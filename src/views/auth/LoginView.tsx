import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Alert } from 'antd';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useAuthStore } from '@/stores/authStore';

/**
 * 로그인 화면 (`/login`, 14_auth.md 14.3.1).
 * 이메일 형식 검증·빈 값 비활성화, 실패 시 인라인 얼럿(상세 사유 비노출).
 * 이미 인증된 세션이면 대시보드(또는 온보딩)로 리다이렉트한다.
 */
export function LoginView() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  if (initialized && session) {
    return <Navigate to={mustChangePassword ? '/onboarding/password' : '/'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const err = await signIn(values.email, values.password);
    if (err) {
      setFormError(err);
      return;
    }
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from ?? '/', { replace: true });
  });

  return (
    <AuthLayout subtitle="계정으로 로그인하세요">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <Alert type="error" message={formError} showIcon /> : null}

        <div>
          <label className="mb-1 block text-sm text-yna-main">이메일</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input {...field} type="email" size="large" placeholder="name@ynarcher.com" autoComplete="username" />
            )}
          />
          {errors.email ? <p className="mt-1 text-xs text-yna-point">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm text-yna-main">비밀번호</label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} size="large" placeholder="비밀번호" autoComplete="current-password" />
            )}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-yna-point">{errors.password.message}</p>
          ) : null}
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={isSubmitting}
          disabled={!isValid}
        >
          로그인
        </Button>

        <div className="text-center">
          <Link to="/reset-password" className="text-xs text-yna-sub hover:text-yna-point">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
