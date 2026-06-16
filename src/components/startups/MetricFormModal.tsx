import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, InputNumber, Input, DatePicker, Button } from 'antd';
import type { Control } from 'react-hook-form';
import dayjs from 'dayjs';
import { startupMetricSchema, type StartupMetricInput } from '@/schemas/startupMetric';
import { formatDate } from '@/lib/formatters';
import type { StartupMetric } from '@/types/startupMetric';

/**
 * 성장 지표 카드별 관리 모달 (6_startups.md Detail Tab 1).
 * group 에 따라 해당 카드 항목만 렌더한다. 기준 연도를 고르면 그 연도의 기존 값을 불러와
 * 수정할 수 있고(없으면 신규), 저장 시 같은 연도 행에 해당 카드 컬럼만 병합(upsert)된다.
 * 폼은 전체 스키마(기본값 0/'' 유효)를 사용하고, 제출 시 호출부가 그룹 컬럼만 저장한다.
 */
export type MetricGroup = 'finance' | 'revenue' | 'employment' | 'investment';

const EMPTY: StartupMetricInput = {
  recordDate: dayjs().format('YYYY') + '-12-31',
  revenue: 0,
  operatingProfit: 0,
  netIncome: 0,
  assets: 0,
  liabilities: 0,
  equity: 0,
  employeeCount: 0,
  valuation: 0,
  fundingAmount: 0,
  fundingRound: '',
  remarks: '',
};

type FieldKey = keyof StartupMetricInput;
type FieldKind = 'won' | 'count' | 'text';

const FIELD_META: Record<string, { label: string; kind: FieldKind }> = {
  revenue: { label: '매출액 (원)', kind: 'won' },
  operatingProfit: { label: '영업이익 (원)', kind: 'won' },
  netIncome: { label: '당기순이익 (원)', kind: 'won' },
  assets: { label: '자산 (원)', kind: 'won' },
  liabilities: { label: '부채 (원)', kind: 'won' },
  equity: { label: '자본 (원)', kind: 'won' },
  employeeCount: { label: '고용 인원', kind: 'count' },
  valuation: { label: '기업 가치 (원)', kind: 'won' },
  fundingAmount: { label: '투자유치액 (원)', kind: 'won' },
  fundingRound: { label: '투자 라운드', kind: 'text' },
};

const GROUP_CONFIG: Record<MetricGroup, { title: string; fields: FieldKey[] }> = {
  finance: { title: '재무 현황 관리', fields: ['assets', 'liabilities', 'equity'] },
  revenue: { title: '매출 현황 관리', fields: ['revenue', 'operatingProfit', 'netIncome'] },
  employment: { title: '고용 현황 관리', fields: ['employeeCount'] },
  investment: { title: '투자 현황 관리', fields: ['valuation', 'fundingAmount', 'fundingRound'] },
};

function err(message?: string) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

function FieldInput({ control, name }: { control: Control<StartupMetricInput>; name: FieldKey }) {
  const meta = FIELD_META[name];
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        if (meta.kind === 'text') return <Input {...(field as object)} placeholder="예: Series A" />;
        if (meta.kind === 'count')
          return <InputNumber {...(field as object)} min={0} className="w-full" addonAfter="명" />;
        return (
          <InputNumber
            {...(field as object)}
            className="w-full"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => Number((v ?? '').replace(/,/g, ''))}
          />
        );
      }}
    />
  );
}

interface MetricFormModalProps {
  open: boolean;
  group: MetricGroup;
  metrics: StartupMetric[];
  submitting: boolean;
  onSubmit: (values: StartupMetricInput) => void;
  onDelete: (id: string, year: string) => void;
  onClose: () => void;
}

export function MetricFormModal({
  open,
  group,
  metrics,
  submitting,
  onSubmit,
  onDelete,
  onClose,
}: MetricFormModalProps) {
  const cfg = GROUP_CONFIG[group];
  const findByYear = (year: string) => metrics.find((m) => formatDate(m.recordDate, 'YYYY') === year);

  // 마운트 시 기본 연도(올해)에 값이 있으면 불러와 채운다.
  const buildDefaults = (): StartupMetricInput => {
    const d: Record<string, unknown> = { ...EMPTY, recordDate: `${dayjs().format('YYYY')}-12-31` };
    const ex = findByYear(dayjs().format('YYYY'));
    if (ex) cfg.fields.forEach((f) => (d[f] = ex[f as keyof StartupMetric]));
    return d as StartupMetricInput;
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StartupMetricInput>({
    resolver: zodResolver(startupMetricSchema),
    mode: 'onBlur',
    defaultValues: buildDefaults(),
  });

  // 연도 변경 시 해당 연도의 기존 값으로 카드 항목을 다시 채운다(없으면 초기화).
  const prefill = (year: string) => {
    const ex = findByYear(year);
    cfg.fields.forEach((f) => setValue(f, (ex ? ex[f as keyof StartupMetric] : EMPTY[f]) as never));
  };

  const selectedYear = formatDate(watch('recordDate'), 'YYYY');
  const existingSel = findByYear(selectedYear);

  return (
    <Modal title={`${cfg.title} (연도별)`} open={open} onCancel={onClose} footer={null} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">기준 연도 *</label>
            <Controller
              name="recordDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  picker="year"
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(d) => {
                    field.onChange(d ? `${d.format('YYYY')}-12-31` : '');
                    prefill(d ? d.format('YYYY') : '');
                  }}
                />
              )}
            />
            <p className="mt-1 text-xs text-yna-sub">
              {existingSel ? '기존 값을 불러왔습니다. 수정 후 저장하세요.' : '선택한 연도로 새로 등록됩니다.'}
            </p>
            {err(errors.recordDate?.message)}
          </div>

          {cfg.fields.map((name) => (
            <div key={name}>
              <label className="mb-1 block text-sm text-yna-main">{FIELD_META[name].label}</label>
              <FieldInput control={control} name={name} />
              {err(errors[name]?.message)}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <div>
              {existingSel ? (
                <Button danger onClick={() => onDelete(existingSel.id, selectedYear)}>
                  이 연도 삭제
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose}>취소</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                저장
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
