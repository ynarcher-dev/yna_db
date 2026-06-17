import { Drawer } from 'antd';
import { DepartmentForm } from './DepartmentForm';
import { useDepartmentMutations } from '@/hooks/useDepartments';
import { useAppToast } from '@/components/common/useAppToast';
import type { DepartmentInput } from '@/schemas/department';
import type { Department } from '@/types/department';

/**
 * 소속(부서) 등록/수정 Drawer (목록·상세 화면 공용, Admin 전용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리해 화면 코드를 가볍게 유지한다.
 */
interface DepartmentFormDrawerProps {
  open: boolean;
  /** edit 모드면 department 필수 */
  department?: Department;
  onClose: () => void;
  /** 저장 성공 후 콜백 (예: 상세 새로고침) */
  onSaved?: () => void;
}

function toInput(d: Department): DepartmentInput {
  return {
    name: d.name,
    establishedAt: d.establishedAt,
    description: d.description,
    sections: d.sections,
  };
}

export function DepartmentFormDrawer({
  open,
  department,
  onClose,
  onSaved,
}: DepartmentFormDrawerProps) {
  const isEdit = Boolean(department);
  const { create, update } = useDepartmentMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: DepartmentInput) => {
    if (isEdit && department) {
      update.mutate(
        { id: department.id, input: values },
        {
          onSuccess: () => {
            toast.success('부서 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('부서가 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '부서 수정' : '부서 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <DepartmentForm
          defaultValues={department ? toInput(department) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
