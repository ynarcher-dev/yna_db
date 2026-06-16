import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from 'antd';
import { partnerSchema, type PartnerInput } from '@/schemas/partner';
import { PARTNER_TYPE_OPTIONS } from '@/lib/labels';
import { InteractionLogEditor } from './InteractionLogEditor';

/**
 * 협력사 등록/수정 폼 (12_partners.md 12.3, 17_conventions.md 3장).
 * 등록·수정 공용. onBlur 1차 + 제출 시 전체 검증, 에러는 필드 하단 인라인 표시.
 */
const EMPTY: PartnerInput = {
  name: '',
  department: '',
  partnerType: 'partner',
  contactPerson: '',
  phone: '',
  email: '',
  interactionLog: [],
};

interface PartnerFormProps {
  defaultValues?: PartnerInput;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: PartnerInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function PartnerForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: PartnerFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">기업/기관명 *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="협력사명" />}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">부서명</label>
        <Controller
          name="department"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예: 창업진흥과, 오픈이노베이션팀" />}
        />
        <FieldError message={errors.department?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">협력사 유형 *</label>
        <Controller
          name="partnerType"
          control={control}
          render={({ field }) => (
            <Select {...field} className="w-full" options={PARTNER_TYPE_OPTIONS} />
          )}
        />
        <FieldError message={errors.partnerType?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">담당자 *</label>
        <Controller
          name="contactPerson"
          control={control}
          render={({ field }) => <Input {...field} placeholder="담당자 이름" />}
        />
        <FieldError message={errors.contactPerson?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-yna-main">연락처</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <Input {...field} placeholder="02-000-0000" />}
          />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-yna-main">이메일</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} placeholder="name@example.com" />}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <InteractionLogEditor control={control} />

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
