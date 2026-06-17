import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button, ColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { startupSchema, type StartupInput } from '@/schemas/startup';
import { INVESTMENT_STAGE_OPTIONS, MANAGEMENT_STATUS_OPTIONS } from '@/lib/labels';
import { STARTUP_SECTIONS, DEFAULT_STARTUP_SECTIONS } from '@/lib/startupSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';
import { ProfileImageUploader } from '@/components/common/ProfileImageUploader';

/**
 * 스타트업 등록/수정 폼 (6_startups.md 6.3, 17_conventions.md 3장).
 * 등록·수정 공용. 기본 프로필(기업명·대표자·투자단계·담당심사역·브랜드컬러·로고·설명)만 다룬다.
 * 주주 구성 에디터·시계열 지표는 Phase 4 후속 단계에서 추가한다.
 */
const EMPTY: StartupInput = {
  name: '',
  ceoName: '',
  investmentStage: 'Seed',
  managementStatus: 'sourced',
  managementStatusEtc: '',
  brandColor: '#515151',
  logoUrl: '',
  description: '',
  sections: DEFAULT_STARTUP_SECTIONS,
};

interface StartupFormProps {
  defaultValues?: StartupInput;
  /** 로고 이미지 업로드 경로 (수정=startupId, 신규=임시 uuid) */
  logoFolder: string;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: StartupInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function StartupForm({
  defaultValues,
  logoFolder,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: StartupFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StartupInput>({
    resolver: zodResolver(startupSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });
  const isEtcStatus = watch('managementStatus') === 'other';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">기업명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="스타트업 기업명" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">대표자명 *</label>
          <Controller
            name="ceoName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="대표자 이름" />}
          />
          <FieldError message={errors.ceoName?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">투자 단계 *</label>
          <Controller
            name="investmentStage"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={INVESTMENT_STAGE_OPTIONS} />
            )}
          />
          <FieldError message={errors.investmentStage?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">관리 현황 *</label>
        <Controller
          name="managementStatus"
          control={control}
          render={({ field }) => (
            <Select {...field} className="w-full" options={MANAGEMENT_STATUS_OPTIONS} />
          )}
        />
        <FieldError message={errors.managementStatus?.message} />
        {isEtcStatus ? (
          <div className="mt-2">
            <Controller
              name="managementStatusEtc"
              control={control}
              render={({ field }) => <Input {...field} placeholder="기타 내용을 입력해 주세요" />}
            />
            <FieldError message={errors.managementStatusEtc?.message} />
          </div>
        ) : null}
      </div>

      <p className="text-xs text-yna-sub">담당 심사역은 등록 후 상세 화면의 ‘담당자’ 카드에서 배정합니다.</p>

      <div>
        <label className="mb-1 block text-sm text-yna-main">로고 이미지</label>
        <Controller
          name="logoUrl"
          control={control}
          render={({ field }) => (
            <ProfileImageUploader
              value={field.value}
              folder={logoFolder}
              onChange={field.onChange}
              bucket="logos"
              shape="square"
              icon={<HiOutlineOfficeBuilding />}
              accentColor="#515151"
              buttonLabel="로고 업로드"
            />
          )}
        />
        <FieldError message={errors.logoUrl?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">브랜드 컬러</label>
        <div>
          <Controller
            name="brandColor"
            control={control}
            render={({ field }) => (
              <ColorPicker
                disabledAlpha
                format="hex"
                value={field.value}
                onChange={(color: Color) => field.onChange(color.toHexString().slice(0, 7))}
                showText
              />
            )}
          />
        </div>
        <FieldError message={errors.brandColor?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">기업 설명</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="비즈니스 모델 및 기업 소개" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={STARTUP_SECTIONS}
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
