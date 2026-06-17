import { z } from 'zod';

/**
 * 비즈니스 & 팀 역량 편집 검증 (발주자 요청 박스).
 * business/team 두 jsonb 를 한 폼에서 편집하고, 저장 시 호출부가 분리해 저장한다.
 */
export const teamMemberSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  role: z.string().max(50, '50자 이내로 입력해 주세요.'),
  background: z.string().max(200, '200자 이내로 입력해 주세요.'),
});

export const businessTeamSchema = z.object({
  // 비즈니스
  oneLiner: z.string().max(200, '200자 이내로 입력해 주세요.'),
  businessModel: z.string().max(1000, '1000자 이내로 입력해 주세요.'),
  targetMarket: z.string().max(1000, '1000자 이내로 입력해 주세요.'),
  competitiveEdge: z.string().max(1000, '1000자 이내로 입력해 주세요.'),
  // 팀 역량
  founderStrength: z.string().max(1000, '1000자 이내로 입력해 주세요.'),
  members: z.array(teamMemberSchema).max(10, '핵심 팀원은 최대 10명까지 등록할 수 있습니다.'),
  capabilities: z
    .array(z.string().min(1).max(30))
    .max(20, '역량 키워드는 최대 20개까지 등록할 수 있습니다.'),
});

export type BusinessTeamInput = z.infer<typeof businessTeamSchema>;
