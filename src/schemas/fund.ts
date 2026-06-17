import { z } from 'zod';
import { FUND_SECTIONS } from '@/lib/fundSections';

/**
 * 펀드 등록/수정 검증 스키마 (8_funds.md 8.2, 17_conventions.md 3장).
 * 등록·수정 공용(Admin 전용). LP 구성은 별도 에디터(LP 카드)에서 다루므로 여기선 기본 재무 정보만.
 */
export const fundSchema = z
  .object({
    name: z.string().min(1, '펀드/투자조합명을 입력해 주세요.').max(150),
    totalAmount: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .min(0, '0 이상이어야 합니다.'),
    investingPeriod: z.string().min(1, '투자 기간을 입력해 주세요.').max(100),
    balance: z
      .number({ invalid_type_error: '숫자로 입력해 주세요.' })
      .min(0, '0 이상이어야 합니다.'),
    sections: FUND_SECTIONS.schema,
  })
  .superRefine((val, ctx) => {
    // 잔액은 결성 총액을 초과할 수 없다(DB CHECK 와 동일 규칙).
    if (val.balance > val.totalAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['balance'],
        message: '잔액은 결성 총액을 초과할 수 없습니다.',
      });
    }
  });

export type FundInput = z.infer<typeof fundSchema>;

/** LP 1구좌 검증 (LP 구성 카드 전용). */
export const lpEntrySchema = z.object({
  lpName: z.string().min(1, 'LP 이름을 입력해 주세요.').max(100),
  shares: z.number({ invalid_type_error: '숫자로 입력해 주세요.' }).min(0, '0 이상이어야 합니다.'),
  percentage: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .min(0, '0 이상이어야 합니다.')
    .max(100, '100 이하여야 합니다.'),
});

/** LP 구성 편집(LP 카드 전용 드로어). */
export const lpCompositionFormSchema = z.object({
  lpComposition: z
    .array(lpEntrySchema)
    .max(50, 'LP는 최대 50개까지 등록할 수 있습니다.')
    .superRefine((rows, ctx) => {
      const total = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
      if (total > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `지분율 합계가 ${total}%로 100%를 초과했습니다.`,
        });
      }
    }),
});

export type LpCompositionFormInput = z.infer<typeof lpCompositionFormSchema>;
