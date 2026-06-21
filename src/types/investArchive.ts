import {
  normalizeInvestArchiveSections,
  type InvestArchiveSections,
} from '@/lib/investArchiveSections';
import type { ArchiveCategory } from '@/types/database';

/**
 * 투자 자료실 게시글 (camelCase 화면 모델, 22_invest_archives.md).
 * 공통 서식·템플릿·시장분석 보고서 등 사내 전용 게시판형 자료.
 */
export interface InvestArchive {
  id: string;
  title: string;
  content: string;
  category: ArchiveCategory;
  /** 상단 고정 공지 여부 */
  isPinned: boolean;
  views: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 작성자(created_by) id. 수정/삭제 권한(본인) 판별에 사용. 없으면 빈 문자열 */
  createdById: string;
  /** 작성자 이름 (임베드). 없으면 빈 문자열 */
  authorName: string;
  /** 상세 카드 섹션 표시/숨김 맵 */
  sections: InvestArchiveSections;
}

export interface InvestArchiveRow {
  id: string;
  title: string;
  content: string | null;
  category: ArchiveCategory;
  is_pinned: boolean;
  views: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  sections: Partial<Record<string, boolean>> | null;
  author: { name: string } | null;
}

export function mapInvestArchiveRow(row: InvestArchiveRow): InvestArchive {
  return {
    id: row.id,
    title: row.title,
    content: row.content ?? '',
    category: row.category,
    isPinned: row.is_pinned,
    views: row.views,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.created_by ?? '',
    authorName: row.author?.name ?? '',
    sections: normalizeInvestArchiveSections(row.sections),
  };
}
