import { z } from 'zod';

/**
 * 펀드 투자 집행 등록/수정 검증 (fund_investments, 8_funds.md). Admin 전용.
 * 같은 펀드-스타트업 조합은 DB UNIQUE(fund_id, startup_id)로 1건만 허용된다.
 */
export const fundInvestmentSchema = z.object({
  startupId: z.string().uuid('피투자 스타트업을 선택해 주세요.'),
  investmentAmount: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .positive('0보다 커야 합니다.'),
  sharePercentage: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .min(0, '0 이상이어야 합니다.')
    .max(100, '100 이하여야 합니다.'),
  investmentDate: z.string().min(1, '투자일을 선택해 주세요.'),
});

export type FundInvestmentInput = z.infer<typeof fundInvestmentSchema>;
