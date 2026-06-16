import { z } from 'zod';

/**
 * 인증 폼 zod 스키마 (17_conventions.md 3장, 14_auth.md 14.3).
 * 비밀번호 정책: 최소 10자 + 영문 대/소문자·숫자·특수문자 중 3종 이상 조합.
 */
export const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

const PASSWORD_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];

/** 비밀번호에 포함된 문자 종류 수 (실시간 체크리스트용). */
export function passwordClassCount(value: string): number {
  return PASSWORD_CLASSES.filter((re) => re.test(value)).length;
}

export const passwordPolicy = z
  .string()
  .min(10, '비밀번호는 최소 10자 이상이어야 합니다.')
  .refine(
    (v) => passwordClassCount(v) >= 3,
    '영문 대/소문자·숫자·특수문자 중 3종 이상을 조합해 주세요.',
  );

export const newPasswordSchema = z
  .object({
    password: passwordPolicy,
    confirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.'),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: '비밀번호가 일치하지 않습니다.',
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

export const resetRequestSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
