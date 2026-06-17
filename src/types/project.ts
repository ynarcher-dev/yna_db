import type { ProjectPriority, ProjectStage, ProjectType } from './database';
import { normalizeProjectSections, type ProjectSections } from '@/lib/projectSections';

/**
 * 프로젝트 (camelCase 화면 모델, 10_projects.md).
 * M&A 중개 딜 / 오픈이노베이션(OI) 매칭을 단계(stage)별로 관리한다.
 * 담당자(다대다 project_managers)·매칭 스타트업/협력사·타임라인은 후속 단계에서 결합한다.
 */
export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  /** 유형이 '기타'일 때의 자유 텍스트. 그 외엔 빈 문자열 */
  projectTypeEtc: string;
  /** 진행 상태 (대기/진행중/완료/중단/취소) */
  stage: ProjectStage;
  priority: ProjectPriority;
  /** 개시일 (YYYY-MM-DD) */
  startDate: string;
  /** 예상 종료일 (YYYY-MM-DD). 없으면 빈 문자열 */
  endDate: string;
  /** 딜 상세 설명 */
  description: string;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 책임자(created_by) id. 삭제 권한 게이트(책임자+관리자)에 사용. 없으면 빈 문자열 */
  createdById: string;
  /** 책임자(created_by 심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
  /** 담당자(다대다 project_managers) 심사역 이름 목록. 목록 표시용 */
  managerNames: string[];
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: ProjectSections;
}

/** DB row (snake_case). author=책임자(created_by) 임베드 결과. */
export interface ProjectRow {
  id: string;
  name: string;
  project_type: ProjectType;
  project_type_etc: string | null;
  stage: ProjectStage;
  priority: ProjectPriority;
  start_date: string;
  end_date: string | null;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  sections: Partial<Record<string, boolean>> | null;
  author: { name: string } | null;
  /** 담당자(다대다) 임베드 결과. 목록/상세 조회 시 함께 로드 */
  project_managers: { manager: { name: string } | null }[] | null;
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    projectType: row.project_type,
    projectTypeEtc: row.project_type_etc ?? '',
    stage: row.stage,
    priority: row.priority,
    startDate: row.start_date,
    endDate: row.end_date ?? '',
    description: row.description ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.created_by ?? '',
    authorName: row.author?.name ?? '',
    managerNames: (row.project_managers ?? [])
      .map((pm) => pm.manager?.name ?? '')
      .filter(Boolean),
    sections: normalizeProjectSections(row.sections),
  };
}
