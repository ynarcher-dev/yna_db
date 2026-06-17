import { z } from 'zod';
import { REPORT_TYPE_VALUES } from '@/lib/labels';

/** 첨부파일 1건. 비공개 버킷 전환(0026) 이후 공개 url 대신 fileId(uploaded_files)를 보관. */
export const followupFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  fileId: z.string().uuid().optional(),
});

/**
 * 후속관리 등록/수정 검증 (6_startups.md startup_followups).
 * (startup_id, report_type, reporting_period) UNIQUE → 중복 시 DB 에러를 토스트로 안내.
 * 제출 완료 여부는 폼이 아닌 카드의 토글로 관리한다.
 */
export const startupFollowupSchema = z.object({
  title: z.string().min(1, '보고 제목을 입력해 주세요.').max(150),
  reportType: z.enum(REPORT_TYPE_VALUES, {
    errorMap: () => ({ message: '보고 유형을 선택해 주세요.' }),
  }),
  reportingPeriod: z.string().min(1, '보고 기간을 입력해 주세요.').max(20),
  comment: z.string().max(2000, '코멘트는 2000자 이내로 입력해 주세요.'),
  files: z.array(followupFileSchema),
});

export type StartupFollowupInput = z.infer<typeof startupFollowupSchema>;
