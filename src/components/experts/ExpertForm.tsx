import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Switch, Button } from 'antd';
import { expertSchema, type ExpertInput } from '@/schemas/expert';
import { EXPERT_TYPE_OPTIONS } from '@/lib/labels';
import { EXPERT_SECTIONS, DEFAULT_EXPERT_SECTIONS } from '@/lib/expertSections';
import { ProfileImageUploader } from '@/components/common/ProfileImageUploader';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';
import { BiographyEditor } from '@/components/common/BiographyEditor';
import { EMPTY_BIOGRAPHY } from '@/types/biography';

/**
 * 전문가 등록/수정 폼 (9_experts.md 9.3, 17_conventions.md 3장).
 * 등록·수정 공용. onBlur 1차 + 제출 시 전체 검증, 에러는 필드 하단 인라인 표시.
 */
const EMPTY: ExpertInput = {
  name: '',
  company: '',
  position: '',
  phone: '',
  email: '',
  expertType: 'mentor',
  specialties: [],
  isAvailable: true,
  profileImageUrl: '',
  greeting: '',
  biography: EMPTY_BIOGRAPHY,
  sections: DEFAULT_EXPERT_SECTIONS,
};

interface ExpertFormProps {
  defaultValues?: ExpertInput;
  /** 프로필 이미지 업로드 경로 (수정=expertId, 신규=임시 uuid) */
  imageFolder: string;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ExpertInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function ExpertForm({
  defaultValues,
  imageFolder,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ExpertFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpertInput>({
    resolver: zodResolver(expertSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

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
              folder={imageFolder}
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
          render={({ field }) => <Input {...field} placeholder="전문가 이름" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">소속 *</label>
          <Controller
            name="company"
            control={control}
            render={({ field }) => <Input {...field} placeholder="회사/기관명" />}
          />
          <FieldError message={errors.company?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">직책 *</label>
          <Controller
            name="position"
            control={control}
            render={({ field }) => <Input {...field} placeholder="예: 대표, 회계사" />}
          />
          <FieldError message={errors.position?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">전문가 유형 *</label>
        <Controller
          name="expertType"
          control={control}
          render={({ field }) => (
            <Select {...field} className="w-full" options={EXPERT_TYPE_OPTIONS} />
          )}
        />
        <FieldError message={errors.expertType?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <label className="mb-1 block text-sm text-yna-main">이메일 *</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} placeholder="name@example.com" />}
          />
          <FieldError message={errors.email?.message} />
        </div>
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
              placeholder="예: AI, 특허, 법률 (입력 후 Enter)"
              open={false}
              tokenSeparators={[',']}
            />
          )}
        />
        <FieldError message={errors.specialties?.message} />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="isAvailable"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Switch checked={value} onChange={onChange} />
          )}
        />
        <span className="text-sm text-yna-main">매칭 가능</span>
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
        <label className="mb-2 block text-sm font-medium text-yna-main">약력</label>
        <BiographyEditor control={control} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={EXPERT_SECTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
