import { z } from 'zod';
import { REPORT_TYPE_VALUES } from '@/lib/labels';

/** 마일스톤 1건. */
export const milestoneSchema = z.object({
  title: z.string().min(1, '마일스톤 내용을 입력해 주세요.').max(100),
  done: z.boolean(),
});

/**
 * 후속 보고 등록 검증 (6_startups.md startup_followups).
 * (startup_id, report_type, reporting_period) UNIQUE → 중복 시 DB 에러를 토스트로 안내.
 */
export const startupFollowupSchema = z.object({
  title: z.string().min(1, '보고 제목을 입력해 주세요.').max(150),
  reportType: z.enum(REPORT_TYPE_VALUES, {
    errorMap: () => ({ message: '보고 유형을 선택해 주세요.' }),
  }),
  reportingPeriod: z.string().min(1, '보고 기간을 입력해 주세요.').max(20),
  dueDate: z.string().min(1, '제출 기한을 선택해 주세요.'),
  fileUrl: z.string().url('올바른 URL 형식이 아닙니다.').or(z.literal('')),
  isSubmitted: z.boolean(),
  milestones: z.array(milestoneSchema).max(20, '마일스톤은 최대 20개까지 등록할 수 있습니다.'),
});

export type StartupFollowupInput = z.infer<typeof startupFollowupSchema>;
