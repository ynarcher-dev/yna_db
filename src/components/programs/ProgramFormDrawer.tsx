import { Drawer } from 'antd';
import { ProgramForm } from './ProgramForm';
import { useProgramMutations } from '@/hooks/usePrograms';
import { useAppToast } from '@/components/common/useAppToast';
import type { ProgramInput } from '@/schemas/program';
import type { Program } from '@/types/program';

/**
 * 프로그램 등록/수정 Drawer (목록·상세 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface ProgramFormDrawerProps {
  open: boolean;
  program?: Program;
  onClose: () => void;
  onSaved?: () => void;
}

function toInput(p: Program): ProgramInput {
  return {
    name: p.name,
    generation: p.generation,
    budget: p.budget,
    startDate: p.startDate,
    endDate: p.endDate,
    recruitmentDeadline: p.recruitmentDeadline,
    description: p.description,
    sections: p.sections,
  };
}

export function ProgramFormDrawer({ open, program, onClose, onSaved }: ProgramFormDrawerProps) {
  const isEdit = Boolean(program);
  const { create, update } = useProgramMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: ProgramInput) => {
    if (isEdit && program) {
      update.mutate(
        { id: program.id, input: values },
        {
          onSuccess: () => {
            toast.success('프로그램 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('프로그램이 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '프로그램 수정' : '프로그램 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <ProgramForm
          defaultValues={program ? toInput(program) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
