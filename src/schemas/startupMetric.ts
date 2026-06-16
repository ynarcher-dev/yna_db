import { z } from 'zod';

const won = z.number({ invalid_type_error: '숫자로 입력해 주세요.' });
const wonNonNeg = won.min(0, '0 이상이어야 합니다.');

/**
 * 스타트업 성장 지표(연도별) 등록 검증 (6_startups.md startup_metrics).
 * 재무현황(매출·손익·재무상태) + 고용 + 투자현황을 한 회계연도 행으로 입력한다.
 * record_date 는 startup 당 UNIQUE → 중복 시 DB 에러를 호출부가 토스트로 안내한다.
 */
export const startupMetricSchema = z.object({
  recordDate: z.string().min(1, '기준 연도를 선택해 주세요.'),
  // [재무현황]
  revenue: wonNonNeg,
  operatingProfit: won, // 영업이익: 음수 가능
  netIncome: won, // 당기순이익: 음수 가능
  assets: wonNonNeg,
  liabilities: wonNonNeg,
  equity: won, // 자본: 자본잠식 시 음수 가능
  // [고용]
  employeeCount: z
    .number({ invalid_type_error: '숫자로 입력해 주세요.' })
    .int('정수로 입력해 주세요.')
    .min(0, '0 이상이어야 합니다.'),
  // [투자현황]
  valuation: wonNonNeg,
  fundingAmount: wonNonNeg,
  fundingRound: z.string().max(30, '30자 이내로 입력해 주세요.'),
  remarks: z.string().max(500, '비고는 500자 이내로 입력해 주세요.'),
});

export type StartupMetricInput = z.infer<typeof startupMetricSchema>;
