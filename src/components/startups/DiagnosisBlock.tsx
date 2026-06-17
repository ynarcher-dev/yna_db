import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Input, Button } from 'antd';
import { SectionHeader } from './SectionHeader';
import { diagnosisFormSchema, type DiagnosisFormInput } from '@/schemas/startup';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import type { Startup } from '@/types/startup';

/**
 * 기업진단 박스 (주주 구성 아래).
 * 추후 외부 서비스 연동 예정. 현재는 직원이 임시로 진단 내용을 수동 입력할 수 있고,
 * 내용이 없으면 '준비중입니다'를 노출한다. 최종 수정일 + 수정 버튼 제공.
 */
function EditDrawer({
  open,
  startup,
  onClose,
  onSaved,
}: {
  open: boolean;
  startup: Startup;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { updateDiagnosis } = useStartupMutations();
  const toast = useAppToast();
  const { control, handleSubmit } = useForm<DiagnosisFormInput>({
    resolver: zodResolver(diagnosisFormSchema),
    mode: 'onBlur',
    defaultValues: { diagnosis: startup.diagnosis },
  });

  const handleSave = (values: DiagnosisFormInput) => {
    updateDiagnosis.mutate(
      { id: startup.id, input: values },
      {
        onSuccess: () => {
          toast.success('기업진단이 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  return (
    <Drawer title="기업진단 수정" width={520} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">진단 내용</label>
            <Controller
              name="diagnosis"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={8} placeholder="기업진단 내용을 입력하세요." />
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateDiagnosis.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}

export function DiagnosisBlock({ startup, onSaved }: { startup: Startup; onSaved?: () => void }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader
        title="기업진단"
        updatedAt={startup.diagnosisUpdatedAt}
        action={
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        }
      />
      {startup.diagnosis ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-yna-main">
          {startup.diagnosis}
        </p>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md bg-yna-bg">
          <p className="text-sm text-yna-sub">아처스캔 데이터 들어갈 자리</p>
        </div>
      )}

      <EditDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}
