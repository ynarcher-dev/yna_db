import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Spin } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordChecklist } from '@/components/auth/PasswordChecklist';
import { newPasswordSchema, type NewPasswordInput } from '@/schemas/auth';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 최초 비밀번호 설정 화면 (`/onboarding/password`, 14_auth.md 14.3.2).
 * must_change_password=true 세션에서만 접근. 그 외엔 대시보드/로그인으로 리다이렉트.
 */
export function OnboardingPasswordView() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const { updatePassword } = useAuthActions();
  const toast = useAppToast();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: 'onBlur',
    defaultValues: { password: '', confirm: '' },
  });

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!mustChangePassword) return <Navigate to="/" replace />;

  const passwordValue = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    const err = await updatePassword(values.password);
    if (err) {
      setError('password', { message: err });
      return;
    }
    toast.success('비밀번호가 설정되었습니다.');
    navigate('/', { replace: true });
  });

  return (
    <AuthLayout subtitle="안전한 사용을 위해 새 비밀번호를 설정해 주세요">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm text-yna-main">새 비밀번호</label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} size="large" placeholder="새 비밀번호" autoComplete="new-password" />
            )}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-yna-point">{errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm text-yna-main">비밀번호 확인</label>
          <Controller
            name="confirm"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} size="large" placeholder="비밀번호 확인" autoComplete="new-password" />
            )}
          />
          {errors.confirm ? (
            <p className="mt-1 text-xs text-yna-point">{errors.confirm.message}</p>
          ) : null}
        </div>

        <div className="rounded-md bg-yna-bg p-3">
          <PasswordChecklist value={passwordValue ?? ''} />
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
          비밀번호 설정 완료
        </Button>
      </form>
    </AuthLayout>
  );
}
