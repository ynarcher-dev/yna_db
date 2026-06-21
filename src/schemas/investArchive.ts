import { z } from 'zod';
import { INVEST_ARCHIVE_SECTIONS } from '@/lib/investArchiveSections';

/**
 * 투자 자료실 글쓰기/수정 검증 (22_invest_archives.md 22.3, 17_conventions.md 3장).
 * 등록·수정 공용. 카테고리는 입력받지 않으며(발주자 요청), 첨부파일은 등록/수정 Drawer에서 직접 올린다.
 */
export const investArchiveSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(200),
  isPinned: z.boolean(),
  content: z.string().max(20000, '본문은 20000자 이내로 입력해 주세요.'),
  sections: INVEST_ARCHIVE_SECTIONS.schema,
});

export type InvestArchiveInput = z.infer<typeof investArchiveSchema>;
