import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button, DatePicker, Input } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import dayjs from 'dayjs';
import type { PartnerInput } from '@/schemas/partner';

/**
 * 교류 협력 이력 에디터 (12_partners.md 12.3 — 일자별 교류 내역 입력).
 * react-hook-form useFieldArray 로 행 추가/삭제를 관리한다.
 */
export function InteractionLogEditor({ control }: { control: Control<PartnerInput> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'interactionLog' });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-yna-main">교류 협력 이력</span>
        <Button
          size="small"
          icon={<HiOutlinePlus />}
          onClick={() => append({ date: dayjs().format('YYYY-MM-DD'), content: '' })}
        >
          이력 추가
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
          등록된 교류 이력이 없습니다. “이력 추가”로 MOU 체결·사업 협의 등을 기록하세요.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <Controller
            control={control}
            name={`interactionLog.${index}.date`}
            render={({ field: f }) => (
              <DatePicker
                value={f.value ? dayjs(f.value) : null}
                onChange={(d) => f.onChange(d ? d.format('YYYY-MM-DD') : '')}
                className="w-36 shrink-0"
                placeholder="일자"
              />
            )}
          />
          <Controller
            control={control}
            name={`interactionLog.${index}.content`}
            render={({ field: f }) => (
              <Input {...f} placeholder="예: MOU 체결, 사업 협의 완료" />
            )}
          />
          <Button
            danger
            type="text"
            aria-label="이력 삭제"
            icon={<HiOutlineTrash />}
            onClick={() => remove(index)}
          />
        </div>
      ))}
    </div>
  );
}
