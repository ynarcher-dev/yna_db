import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject, useProjectMutations } from '@/hooks/useProjects';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProjectTypeTag } from '@/components/projects/ProjectTypeTag';
import { ProjectStageTag } from '@/components/projects/ProjectStageTag';
import { ProjectPriorityTag } from '@/components/projects/ProjectPriorityTag';
import { ProjectFormDrawer } from '@/components/projects/ProjectFormDrawer';
import { EntityManagersPanel } from '@/components/common/EntityManagersPanel';
import { ProjectLinksPanel } from '@/components/projects/ProjectLinksPanel';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate } from '@/lib/formatters';

/**
 * 프로젝트 상세 (10_projects.md 10.3).
 * 고유 블록: 기본 개요 카드(딜 설명·유형·단계·우선순위·기간).
 * 담당자 매핑·스타트업/협력사 매핑 패널·진척 타임라인은 후속 단계에서 결합한다.
 * 삭제 = 책임자(created_by)+관리자.
 */
export function ProjectDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { remove } = useProjectMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !project) {
    return (
      <EmptyState
        message="프로젝트를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/projects')}>
            목록으로
          </Button>
        }
      />
    );
  }

  // 삭제 = 책임자(본인이 등록) 또는 관리자
  const canDelete = role === 'admin' || (!!userId && project.createdById === userId);

  const handleDelete = () => {
    toast.confirm('프로젝트 삭제', `'${project.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(project.id);
        toast.success('삭제되었습니다.');
        navigate('/projects');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 프로젝트 목록
        </button>
        <Space>
          <Button onClick={() => setEditOpen(true)}>기본 수정</Button>
          {canDelete ? (
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          ) : null}
        </Space>
      </div>

      {/* 기본 개요 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{project.name}</h1>
          <ProjectTypeTag type={project.projectType} etc={project.projectTypeEtc} />
          <ProjectStageTag stage={project.stage} />
          <ProjectPriorityTag priority={project.priority} />
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="개시일">{formatDate(project.startDate)}</Descriptions.Item>
          <Descriptions.Item label="예상 종료일">
            {project.endDate ? formatDate(project.endDate) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="작성자">{project.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(project.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(project.updatedAt)}</Descriptions.Item>
        </Descriptions>
        {project.description ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-yna-main">{project.description}</p>
          </div>
        ) : null}
      </div>

      {/* 카드 섹션: 기본 수정에서 비활성화한 섹션은 숨긴다 (project.sections) */}

      {/* 담당자(다대다) 배정 패널 — 담당자는 모두 자유롭게 추가/해제(작성자 필수 편입 폐지, 0054). */}
      {project.sections.managers ? (
        <EntityManagersPanel kind="project" entityId={project.id} />
      ) : null}

      {/* 매칭 스타트업·협력사 매핑 패널 (좌우 2열) */}
      {project.sections.startups || project.sections.partners ? (
        <div className="grid gap-6 md:grid-cols-2">
          {project.sections.startups ? (
            <ProjectLinksPanel projectId={project.id} kind="startup" title="매칭 스타트업" />
          ) : null}
          {project.sections.partners ? (
            <ProjectLinksPanel projectId={project.id} kind="partner" title="대기업 · 협력사" />
          ) : null}
        </div>
      ) : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {project.sections.attachments ? (
        <EntityFilesBlock entityType="project" entityId={project.id} />
      ) : null}

      <ProjectFormDrawer
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
