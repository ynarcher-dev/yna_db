import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button, Input, InputNumber } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import type { StartupInput } from '@/schemas/startup';

/**
 * 주주 구성 에디터 (6_startups.md 6.3 — 주주 정보 추가/제외 블록).
 * react-hook-form useFieldArray 로 행 추가/삭제를 관리한다. 지분율 합계를 보조 표시한다.
 */
export function ShareholderEditor({ control }: { control: Control<StartupInput> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'shareholders' });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-yna-main">주주 구성</span>
        <Button
          size="small"
          icon={<HiOutlinePlus />}
          onClick={() => append({ name: '', shares: 0, percentage: 0 })}
        >
          주주 추가
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
          등록된 주주가 없습니다. “주주 추가”로 주주명·보유 주식 수·지분율을 기록하세요.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <Controller
            control={control}
            name={`shareholders.${index}.name`}
            render={({ field: f }) => <Input {...f} placeholder="주주명" />}
          />
          <Controller
            control={control}
            name={`shareholders.${index}.shares`}
            render={({ field: f }) => (
              <InputNumber
                {...f}
                min={0}
                className="w-32 shrink-0"
                placeholder="주식 수"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number((v ?? '').replace(/,/g, ''))}
              />
            )}
          />
          <Controller
            control={control}
            name={`shareholders.${index}.percentage`}
            render={({ field: f }) => (
              <InputNumber
                {...f}
                min={0}
                max={100}
                step={0.1}
                className="w-24 shrink-0"
                placeholder="지분율"
                addonAfter="%"
              />
            )}
          />
          <Button
            danger
            type="text"
            aria-label="주주 삭제"
            icon={<HiOutlineTrash />}
            onClick={() => remove(index)}
          />
        </div>
      ))}
    </div>
  );
}
