import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgram, useProgramMutations } from '@/hooks/usePrograms';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProgramFormDrawer } from '@/components/programs/ProgramFormDrawer';
import { EntityManagersPanel } from '@/components/common/EntityManagersPanel';
import { ProgramStartupsPanel } from '@/components/programs/ProgramStartupsPanel';
import { ProgramPartnersPanel } from '@/components/programs/ProgramPartnersPanel';
import { ProgramCalendarBlock } from '@/components/programs/ProgramCalendarBlock';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate, formatKRW } from '@/lib/formatters';

/**
 * 프로그램 상세 (7_programs.md 7.3).
 * 개요 카드 + 운영 심사역 매핑·참여 스타트업·마일스톤 캘린더(후속 단계)·첨부파일.
 * 삭제 = 책임자(created_by)+관리자.
 */
export function ProgramDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: program, isLoading, isError, refetch } = useProgram(id);
  const { remove } = useProgramMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !program) {
    return (
      <EmptyState
        message="프로그램을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/programs')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const canDelete = role === 'admin' || (!!userId && program.createdById === userId);

  const handleDelete = () => {
    toast.confirm('프로그램 삭제', `'${program.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(program.id);
        toast.success('삭제되었습니다.');
        navigate('/programs');
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
          onClick={() => navigate('/programs')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 프로그램 목록
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

      {/* 개요 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{program.name}</h1>
          <span className="rounded-full bg-yna-bg px-2 py-0.5 text-sm text-yna-sub">
            {program.generation}기
          </span>
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="운영 예산">{formatKRW(program.budget)}</Descriptions.Item>
          <Descriptions.Item label="모집 마감일">
            {program.recruitmentDeadline ? formatDate(program.recruitmentDeadline) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="진행 기간">
            {formatDate(program.startDate)} ~ {formatDate(program.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="작성자">{program.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(program.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(program.updatedAt)}</Descriptions.Item>
        </Descriptions>
        {program.description ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-yna-main">{program.description}</p>
          </div>
        ) : null}
      </div>

      {/* 카드 섹션: 기본 수정에서 비활성화한 섹션은 숨긴다 (program.sections) */}

      {/* 담당자 매핑 (다대다 + 운영 역할) — 담당자는 모두 자유롭게 추가/해제(작성자 필수 편입 폐지, 0054). */}
      {program.sections.managers ? (
        <EntityManagersPanel kind="program" entityId={program.id} />
      ) : null}

      {/* 참여 스타트업 매핑 (보육 상태) */}
      {program.sections.startups ? <ProgramStartupsPanel programId={program.id} /> : null}

      {/* 참여 협력사(기관) 매핑 (program_partners) */}
      {program.sections.partners ? <ProgramPartnersPanel programId={program.id} /> : null}

      {/* 마일스톤 캘린더 (program_events → 대시보드 자동 동기화) */}
      {program.sections.calendar ? <ProgramCalendarBlock programId={program.id} /> : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {program.sections.attachments ? (
        <EntityFilesBlock entityType="program" entityId={program.id} />
      ) : null}

      <ProgramFormDrawer
        open={editOpen}
        program={program}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
