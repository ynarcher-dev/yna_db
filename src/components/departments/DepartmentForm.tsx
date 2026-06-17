import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { departmentSchema, type DepartmentInput } from '@/schemas/department';
import { DEPARTMENT_SECTIONS, DEFAULT_DEPARTMENT_SECTIONS } from '@/lib/departmentSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 소속(부서) 등록/수정 폼 (11_departments.md 11.3, 17_conventions.md 3장).
 * 등록·수정 공용(Admin 전용). onBlur 1차 + 제출 시 전체 검증, 에러는 필드 하단 인라인 표시.
 */
const EMPTY: DepartmentInput = {
  name: '',
  establishedAt: '',
  description: '',
  sections: DEFAULT_DEPARTMENT_SECTIONS,
};

interface DepartmentFormProps {
  defaultValues?: DepartmentInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: DepartmentInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function DepartmentForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">본부/부서명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 투자본부, 오픈이노베이션본부" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">설립일</label>
        <Controller
          name="establishedAt"
          control={control}
          render={({ field }) => (
            <DatePicker
              className="w-full"
              placeholder="설립일 선택"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
              onBlur={field.onBlur}
            />
          )}
        />
        <FieldError message={errors.establishedAt?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">설명</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="본부 역할 및 업무 설명" />
          )}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={DEPARTMENT_SECTIONS}
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
