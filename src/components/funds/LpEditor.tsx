import { Controller, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { Button, Input, InputNumber } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import type { LpCompositionFormInput } from '@/schemas/fund';

/**
 * LP 구성 에디터 (8_funds.md 8.3 — LP 이름·지분 배분 입력 에디터).
 * react-hook-form useFieldArray 로 행 추가/삭제. 지분율 합계를 실시간 표시하고 100% 초과 시 경고.
 */
export function LpEditor({ control }: { control: Control<LpCompositionFormInput> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lpComposition' });
  const rows = useWatch({ control, name: 'lpComposition' }) ?? [];
  const totalPct = rows.reduce((sum, r) => sum + (Number(r?.percentage) || 0), 0);
  const over = totalPct > 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-yna-main">LP 구성</span>
        <Button
          size="small"
          icon={<HiOutlinePlus />}
          onClick={() => append({ lpName: '', shares: 0, percentage: 0 })}
        >
          LP 추가
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
          등록된 LP가 없습니다. “LP 추가”로 LP명·출자금·지분율을 기록하세요.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <Controller
            control={control}
            name={`lpComposition.${index}.lpName`}
            render={({ field: f }) => <Input {...f} placeholder="LP명 (예: 모태펀드)" />}
          />
          <Controller
            control={control}
            name={`lpComposition.${index}.shares`}
            render={({ field: f }) => (
              <InputNumber
                {...f}
                min={0}
                className="w-36 shrink-0"
                placeholder="출자금"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number((v ?? '').replace(/,/g, ''))}
                addonAfter="원"
              />
            )}
          />
          <Controller
            control={control}
            name={`lpComposition.${index}.percentage`}
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
            aria-label="LP 삭제"
            icon={<HiOutlineTrash />}
            onClick={() => remove(index)}
          />
        </div>
      ))}

      {fields.length > 0 ? (
        <p className={`pt-1 text-right text-xs ${over ? 'text-yna-point' : 'text-yna-sub'}`}>
          지분율 합계 {totalPct}%{over ? ' — 100%를 초과할 수 없습니다' : ''}
        </p>
      ) : null}
    </div>
  );
}
