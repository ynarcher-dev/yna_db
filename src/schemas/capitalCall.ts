import { z } from 'zod';

/**
 * Capital Call 등록/수정 검증 (capital_calls, 8_funds.md). Admin 전용.
 * DB CHECK(미완료↔완료일 NULL / 완료↔완료일 NOT NULL)와 동일 규칙을 superRefine 으로 강제한다.
 */
export const capitalCallSchema = z
  .object({
    callRound: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .int('정수로 입력해 주세요.')
      .min(1, '1 이상이어야 합니다.'),
    requestedAmount: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .positive('0보다 커야 합니다.'),
    requestedDate: z.string().min(1, '요청일을 선택해 주세요.'),
    isCompleted: z.boolean(),
    /** 납입 완료 시에만 사용. 미완료면 빈 문자열 */
    completedDate: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.isCompleted && !val.completedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['completedDate'],
        message: '납입 완료일을 선택해 주세요.',
      });
    }
  });

export type CapitalCallInput = z.infer<typeof capitalCallSchema>;
