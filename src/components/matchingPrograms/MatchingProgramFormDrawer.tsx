import { Drawer } from 'antd';
import { MatchingProgramForm } from './MatchingProgramForm';
import { useMatchingProgramMutations } from '@/hooks/useMatchingPrograms';
import { useAppToast } from '@/components/common/useAppToast';
import type { MatchingProgramInput } from '@/schemas/matchingProgram';
import type { MatchingProgram } from '@/types/matchingProgram';

/**
 * 매칭 프로그램 등록/수정 Drawer (목록·상세 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface MatchingProgramFormDrawerProps {
  open: boolean;
  program?: MatchingProgram;
  onClose: () => void;
  onSaved?: (programId: string) => void;
}

function toInput(p: MatchingProgram): MatchingProgramInput {
  return {
    name: p.name,
    agency: p.agency,
    year: p.year,
    budget: p.budget,
    status: p.status,
    description: p.description,
    sections: p.sections,
  };
}

export function MatchingProgramFormDrawer({
  open,
  program,
  onClose,
  onSaved,
}: MatchingProgramFormDrawerProps) {
  const isEdit = Boolean(program);
  const { create, update } = useMatchingProgramMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: MatchingProgramInput) => {
    if (isEdit && program) {
      update.mutate(
        { id: program.id, input: values },
        {
          onSuccess: () => {
            toast.success('프로그램 정보가 수정되었습니다.');
            onSaved?.(program.id);
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: (created) => {
          toast.success('매칭 프로그램이 등록되었습니다.');
          onSaved?.(created.id);
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '매칭 프로그램 수정' : '매칭 프로그램 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <MatchingProgramForm
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
