import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from 'antd';
import { managerSchema, type ManagerInput } from '@/schemas/manager';
import { MANAGER_SECTIONS } from '@/lib/managerSections';
import { BiographyEditor } from '@/components/common/BiographyEditor';
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
  departmentOptions: { value: string; label: string }[];
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
  departmentOptions,
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
            <label className="mb-1 block text-sm text-yna-main">소속 본부</label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  className="w-full"
                  placeholder="소속 본부 선택"
                  options={departmentOptions}
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
        <label className="mb-1 block text-sm text-yna-main">소개</label>
        <Controller
          name="greeting"
          control={control}
          render={({ field }) => (
            <Input.TextArea
              {...field}
              rows={3}
              placeholder="홈페이지 등에 노출될 소개글을 입력하세요."
            />
          )}
        />
        <FieldError message={errors.greeting?.message} />
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

      <div>
        <label className="mb-2 block text-sm font-medium text-yna-main">약력</label>
        <BiographyEditor control={control} />
      </div>

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
