import { z } from 'zod';
import { biographySchema } from './biography';

/**
 * 전문가 등록/수정 검증 스키마 (9_experts.md 9.2, 17_conventions.md 3장).
 * 등록·수정 폼에서 동일 스키마를 재사용한다. 약력/소개는 심사역과 동일 구조.
 */
const phoneSchema = z
  .string()
  .regex(/^[0-9-]{9,13}$/, '숫자와 하이픈만, 9~13자로 입력해 주세요.')
  .or(z.literal(''));

export const expertSchema = z.object({
  name: z.string().min(1, '전문가 이름을 입력해 주세요.').max(50),
  company: z.string().min(1, '소속 회사/기관을 입력해 주세요.').max(100),
  position: z.string().min(1, '직책을 입력해 주세요.').max(50),
  phone: phoneSchema,
  email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.').max(100),
  expertType: z.enum(['mentor', 'auditor', 'advisor'], {
    errorMap: () => ({ message: '전문가 유형을 선택해 주세요.' }),
  }),
  specialties: z.array(z.string().min(1).max(30)).max(20, '관심 분야는 최대 20개까지 등록할 수 있습니다.'),
  isAvailable: z.boolean(),
  profileImageUrl: z.string().url('올바른 URL 형식이 아닙니다.').or(z.literal('')),
  greeting: z.string().max(1000, '소개는 1000자 이내로 입력해 주세요.'),
  biography: biographySchema,
});

export type ExpertInput = z.infer<typeof expertSchema>;
