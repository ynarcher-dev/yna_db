import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, InputNumber, DatePicker, Select, Button } from 'antd';
import dayjs from 'dayjs';
import { businessSchema, type BusinessInput } from '@/schemas/business';
import { BUSINESS_STATUS_OPTIONS, BUSINESS_CLASSIFICATION_OPTIONS } from '@/lib/labels';
import { BUSINESS_SECTIONS, DEFAULT_BUSINESS_SECTIONS } from '@/lib/businessSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 사업 등록/수정 폼 (7_businesses.md 7.3, 17_conventions.md 3장). 등록·수정 공용.
 * 기본 정보(사업명·구분·상태·기수·매출·이익·기간·설명)만 다룬다. 매핑·일정은 상세에서 관리.
 */
const EMPTY: BusinessInput = {
  name: '',
  classification: 'public',
  status: 'pending',
  generation: 1,
  revenue: 0,
  profit: 0,
  startDate: '',
  endDate: '',
  description: '',
  sections: DEFAULT_BUSINESS_SECTIONS,
};

interface BusinessFormProps {
  defaultValues?: BusinessInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: BusinessInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function BusinessForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: BusinessFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">사업명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 와이앤아처 액셀러레이팅 배치" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">구분 *</label>
          <Controller
            name="classification"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={BUSINESS_CLASSIFICATION_OPTIONS} />
            )}
          />
          <FieldError message={errors.classification?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">진행 상태 *</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select {...field} className="w-full" options={BUSINESS_STATUS_OPTIONS} />
            )}
          />
          <FieldError message={errors.status?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">기수 *</label>
        <Controller
          name="generation"
          control={control}
          render={({ field }) => (
            <InputNumber
              className="w-full"
              min={1}
              value={field.value}
              onChange={(v) => field.onChange(typeof v === 'number' ? v : 1)}
              onBlur={field.onBlur}
              addonAfter="기"
            />
          )}
        />
        <FieldError message={errors.generation?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">매출 *</label>
          <Controller
            name="revenue"
            control={control}
            render={({ field }) => (
              <InputNumber
                className="w-full"
                min={0}
                value={field.value}
                onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                onBlur={field.onBlur}
                formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
                addonAfter="원"
              />
            )}
          />
          <FieldError message={errors.revenue?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">이익 *</label>
          <Controller
            name="profit"
            control={control}
            render={({ field }) => (
              <InputNumber
                className="w-full"
                value={field.value}
                onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                onBlur={field.onBlur}
                formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
                addonAfter="원"
              />
            )}
          />
          <FieldError message={errors.profit?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">시작일 *</label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.startDate?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">종료일 *</label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.endDate?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">설명</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="사업 공고 소개 및 상세 설명" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={BUSINESS_SECTIONS}
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
