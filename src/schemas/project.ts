import { z } from 'zod';
import {
  PROJECT_PRIORITY_VALUES,
  PROJECT_STAGE_VALUES,
  PROJECT_TYPE_VALUES,
} from '@/lib/labels';
import { PROJECT_SECTIONS, DEFAULT_PROJECT_SECTIONS } from '@/lib/projectSections';
import type { ProjectType } from '@/types/database';

/**
 * 프로젝트 등록/수정 검증 스키마 (10_projects.md 10.2, 17_conventions.md 3장).
 * 등록·수정 폼에서 동일 스키마를 재사용한다. 담당자(다대다)·매칭 스타트업/협력사는
 * 별도 매핑 패널에서 다루므로 여기서는 기본 딜 정보만 검증한다.
 */
export const projectSchema = z
  .object({
    name: z.string().min(1, '프로젝트명을 입력해 주세요.').max(150),
    projectType: z.enum(PROJECT_TYPE_VALUES, {
      errorMap: () => ({ message: '프로젝트 유형을 선택해 주세요.' }),
    }),
    /** '기타' 선택 시에만 사용. 그 외 유형에선 무시(저장 시 비움). */
    projectTypeEtc: z.string().max(50, '50자 이내로 입력해 주세요.'),
    stage: z.enum(PROJECT_STAGE_VALUES, {
      errorMap: () => ({ message: '진행 상태를 선택해 주세요.' }),
    }),
    priority: z.enum(PROJECT_PRIORITY_VALUES, {
      errorMap: () => ({ message: '우선순위를 선택해 주세요.' }),
    }),
    startDate: z.string().min(1, '개시일을 선택해 주세요.').max(10),
    /** 예상 종료일은 선택값(YYYY-MM-DD 또는 빈 문자열) */
    endDate: z.string().max(10),
    /** 매출 — 0 이상 */
    revenue: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }).min(0, '0 이상이어야 합니다.'),
    /** 이익 — 손실(음수) 허용 */
    profit: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }),
    description: z.string().max(2000, '설명은 2000자 이내로 입력해 주세요.'),
    sections: PROJECT_SECTIONS.schema,
  })
  .superRefine((val, ctx) => {
    // 유형이 '기타'면 자유 입력 필수.
    if (val.projectType === 'other' && !val.projectTypeEtc.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectTypeEtc'],
        message: '기타 유형을 입력해 주세요.',
      });
    }
    // 종료일이 있으면 개시일 이후여야 한다(DB CHECK 와 동일 규칙).
    if (val.endDate && val.startDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '종료일은 개시일 이후여야 합니다.',
      });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;

/** 빈 입력값. projectType 을 주면 그 유형으로 고정(M&A/신사업 분리 등록). */
export function emptyProjectInput(projectType: ProjectType = 'm_and_a'): ProjectInput {
  return {
    name: '',
    projectType,
    projectTypeEtc: '',
    stage: 'pending',
    priority: 'medium',
    startDate: '',
    endDate: '',
    revenue: 0,
    profit: 0,
    description: '',
    sections: DEFAULT_PROJECT_SECTIONS,
  };
}
