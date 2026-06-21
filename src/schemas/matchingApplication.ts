import { z } from 'zod';
import { MATCHING_APPLICATION_STATUS_VALUES } from '@/lib/labels';

/**
 * 매칭 신청/연계 등록·수정 검증 (21_matching_programs.md 21.3 매칭 팝업 폼).
 * 스타트업·담당 심사역·진행 상태·신청일은 필수, 선정일·매칭 지원금은 선택.
 * DB CHECK(선정일 >= 신청일)와 동일 규칙을 superRefine 으로 강제한다.
 */
export const matchingApplicationSchema = z
  .object({
    startupId: z.string().min(1, '스타트업을 선택해 주세요.'),
    managerId: z.string().min(1, '담당 심사역을 선택해 주세요.'),
    status: z.enum(MATCHING_APPLICATION_STATUS_VALUES),
    applyDate: z.string().min(1, '신청일을 선택해 주세요.'),
    /** 선정일은 선택값(선정 시 입력) */
    selectionDate: z.string().max(10),
    /** 최종 매칭 지원금(선택) */
    matchingAmount: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .min(0, '0 이상이어야 합니다.'),
  })
  .superRefine((val, ctx) => {
    if (val.selectionDate && val.applyDate && val.selectionDate < val.applyDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectionDate'],
        message: '선정일은 신청일 이후여야 합니다.',
      });
    }
  });

export type MatchingApplicationInput = z.infer<typeof matchingApplicationSchema>;
