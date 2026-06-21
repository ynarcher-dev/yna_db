import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useMatchingProgram, useMatchingProgramMutations } from '@/hooks/useMatchingPrograms';
import { useMatchingApplications } from '@/hooks/useMatchingApplications';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchingProgramFormDrawer } from '@/components/matchingPrograms/MatchingProgramFormDrawer';
import { MatchingProgramStatusTag } from '@/components/matchingPrograms/MatchingProgramStatusTag';
import { MatchingApplicationsPanel } from '@/components/matchingPrograms/MatchingApplicationsPanel';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate, formatKRW } from '@/lib/formatters';

/**
 * 매칭 프로그램 상세 (21_matching_programs.md 21.3).
 * 프로그램 현황 카드(상태·기관·예산·선정 스타트업 수) + 매칭 신청/연계 패널 + 첨부파일.
 * 등록/수정=Admin·Manager, 삭제(소프트)=Admin.
 */
export function MatchingProgramDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';
  const [editOpen, setEditOpen] = useState(false);

  const { data: program, isLoading, isError, refetch } = useMatchingProgram(id);
  const { applications } = useMatchingApplications(id);
  const { remove } = useMatchingProgramMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !program) {
    return (
      <EmptyState
        message="매칭 프로그램을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/matching-programs')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const selectedCount = applications.filter((a) => a.status === 'selected').length;

  const handleDelete = () => {
    toast.confirm('매칭 프로그램 삭제', `'${program.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(program.id);
        toast.success('삭제되었습니다.');
        navigate('/matching-programs');
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
          onClick={() => navigate('/matching-programs')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 매칭 프로그램 목록
        </button>
        <Space>
          <Button onClick={() => setEditOpen(true)}>기본 수정</Button>
          {isAdmin ? (
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          ) : null}
        </Space>
      </div>

      {/* 프로그램 현황 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{program.name}</h1>
          <MatchingProgramStatusTag status={program.status} />
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="주관 기관">{program.agency || '-'}</Descriptions.Item>
          <Descriptions.Item label="시행 연도">{program.year}년</Descriptions.Item>
          <Descriptions.Item label="매칭 예산">{formatKRW(program.budget)}</Descriptions.Item>
          <Descriptions.Item label="선정 스타트업">{selectedCount}개사</Descriptions.Item>
          <Descriptions.Item label="작성자">{program.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(program.createdAt)}</Descriptions.Item>
        </Descriptions>
        {program.description ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-yna-main">{program.description}</p>
          </div>
        ) : null}
      </div>

      {/* 매칭 신청/연계 리스트 (스타트업·심사역 연동) */}
      {program.sections.applications ? <MatchingApplicationsPanel programId={program.id} /> : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {program.sections.attachments ? (
        <EntityFilesBlock entityType="matching_program" entityId={program.id} />
      ) : null}

      <MatchingProgramFormDrawer
        open={editOpen}
        program={program}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
