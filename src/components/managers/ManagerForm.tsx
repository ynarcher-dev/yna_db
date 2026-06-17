import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from 'antd';
import { managerSchema, type ManagerInput } from '@/schemas/manager';
import { MANAGER_SECTIONS } from '@/lib/managerSections';
import { ProfileImageUploader } from '@/components/common/ProfileImageUploader';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 심사역 프로필 수정 폼 (5_managers.md 5.3, 17_conventions.md 3장).
 * mode='admin' 이면 직급·소속까지 수정, mode='self'(본인) 이면 직급·소속·역할은
 * 노출하지 않는다(SECURITY DEFINER RPC 가 허용 컬럼만 갱신). 등록은 계정 발급(Edge Function)으로 분리.
 */
interface ManagerFormProps {
  mode: 'admin' | 'self';
  /** 프로필 이미지 업로드 경로용 대상 심사역 id */
  managerId: string;
  defaultValues: ManagerInput;
  /** 소속 팀 옵션 (라벨 "회사 · 그룹 · 팀") */
  teamOptions: { value: string; label: string }[];
  submitting?: boolean;
  onSubmit: (values: ManagerInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function ManagerForm({
  mode,
  managerId,
  defaultValues,
  teamOptions,
  submitting,
  onSubmit,
  onCancel,
}: ManagerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManagerInput>({
    resolver: zodResolver(managerSchema),
    mode: 'onBlur',
    defaultValues,
  });

  const isAdmin = mode === 'admin';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">프로필 이미지</label>
        <Controller
          name="profileImageUrl"
          control={control}
          render={({ field }) => (
            <ProfileImageUploader
              value={field.value}
              folder={managerId}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError message={errors.profileImageUrl?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">이름 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="이름" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 직급·소속은 Admin 만 수정 (본인 수정 RPC 는 직급/소속/역할 제외) */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-yna-main">직급 *</label>
            <Controller
              name="position"
              control={control}
              render={({ field }) => <Input {...field} placeholder="예: 수석심사역" />}
            />
            <FieldError message={errors.position?.message} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-yna-main">소속 (팀)</label>
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  placeholder="소속 팀 선택 (회사 · 그룹 · 팀)"
                  options={teamOptions}
                  onChange={(v) => field.onChange(v ?? '')}
                />
              )}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-yna-main">연락처</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => <Input {...field} placeholder="010-0000-0000" />}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">관심 분야</label>
        <Controller
          name="specialties"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              mode="tags"
              className="w-full"
              placeholder="예: ICT, 핀테크 (입력 후 Enter)"
              open={false}
              tokenSeparators={[',']}
            />
          )}
        />
        <FieldError message={errors.specialties?.message} />
      </div>

      {/* 소개·약력은 기본 수정에서 분리 — 상세 화면의 각 카드 '수정'에서 편집한다. */}

      {/* 표시 섹션 토글은 Admin 전용 (본인 수정 RPC 는 sections 미전송) */}
      {isAdmin ? (
        <Controller
          name="sections"
          control={control}
          render={({ field }) => (
            <SectionVisibilityField
              config={MANAGER_SECTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          저장
        </Button>
      </div>
    </form>
  );
}
