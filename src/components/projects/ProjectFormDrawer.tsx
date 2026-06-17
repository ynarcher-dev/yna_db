import { Drawer } from 'antd';
import { ProjectForm } from './ProjectForm';
import { useProjectMutations } from '@/hooks/useProjects';
import { useAppToast } from '@/components/common/useAppToast';
import type { ProjectInput } from '@/schemas/project';
import type { Project } from '@/types/project';

/**
 * 프로젝트 등록/수정 Drawer (목록·상세 화면 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface ProjectFormDrawerProps {
  open: boolean;
  /** edit 모드면 project 필수 */
  project?: Project;
  onClose: () => void;
  /** 저장 성공 후 콜백. 생성·수정된 프로젝트 id 를 넘겨 역방향 자동 매핑에 쓰게 한다. */
  onSaved?: (projectId: string) => void;
}

function toInput(p: Project): ProjectInput {
  return {
    name: p.name,
    projectType: p.projectType,
    projectTypeEtc: p.projectTypeEtc,
    stage: p.stage,
    priority: p.priority,
    startDate: p.startDate,
    endDate: p.endDate,
    description: p.description,
    sections: p.sections,
  };
}

export function ProjectFormDrawer({ open, project, onClose, onSaved }: ProjectFormDrawerProps) {
  const isEdit = Boolean(project);
  const { create, update } = useProjectMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: ProjectInput) => {
    if (isEdit && project) {
      update.mutate(
        { id: project.id, input: values },
        {
          onSuccess: () => {
            toast.success('프로젝트 정보가 수정되었습니다.');
            onSaved?.(project.id);
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: (created) => {
          toast.success('프로젝트가 등록되었습니다.');
          onSaved?.(created.id);
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '프로젝트 수정' : '프로젝트 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <ProjectForm
          defaultValues={project ? toInput(project) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
