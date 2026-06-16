import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Alert } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordChecklist } from '@/components/auth/PasswordChecklist';
import {
  resetRequestSchema,
  type ResetRequestInput,
  newPasswordSchema,
  type NewPasswordInput,
} from '@/schemas/auth';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 비밀번호 재설정 화면 (`/reset-password`, 14_auth.md 14.3.3).
 * - 요청 모드: 이메일 입력 → 재설정 메일 발송(계정 열거 방지 동일 문구).
 * - 복구 모드: 메일 링크(`#type=recovery`)로 진입 시 새 비밀번호 입력 → 로그인 화면 이동.
 * 복구 여부는 진입 시점의 URL 해시로 1회 판별한다.
 */
const IS_RECOVERY =
  typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

const RESET_SENT_MESSAGE =
  '입력하신 이메일로 재설정 안내를 발송했습니다. 메일함을 확인해 주세요. (가입 여부와 무관하게 동일하게 안내됩니다.)';

function RequestForm() {
  const { sendResetEmail } = useAuthActions();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await sendResetEmail(values.email);
    setSent(true);
  });

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert type="success" message={RESET_SENT_MESSAGE} showIcon />
        <Link to="/login">
          <Button block size="large">
            로그인으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
      <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting} disabled={!isValid}>
        재설정 메일 받기
      </Button>
      <div className="text-center">
        <Link to="/login" className="text-xs text-yna-sub hover:text-yna-point">
          로그인으로 돌아가기
        </Link>
      </div>
    </form>
  );
}

function RecoveryForm() {
  const { updatePassword, signOut } = useAuthActions();
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

  const onSubmit = handleSubmit(async (values) => {
    const err = await updatePassword(values.password);
    if (err) {
      setError('password', { message: err });
      return;
    }
    await signOut();
    toast.success('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
    navigate('/login', { replace: true });
  });

  return (
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
        <PasswordChecklist value={watch('password') ?? ''} />
      </div>
      <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
        비밀번호 변경
      </Button>
    </form>
  );
}

export function ResetPasswordView() {
  return (
    <AuthLayout subtitle={IS_RECOVERY ? '새 비밀번호를 설정해 주세요' : '가입한 이메일로 재설정 링크를 보내드립니다'}>
      {IS_RECOVERY ? <RecoveryForm /> : <RequestForm />}
    </AuthLayout>
  );
}
