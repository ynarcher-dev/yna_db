import { useEffect, useRef, useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useInvestArchive,
  useInvestArchiveMutations,
  incrementArchiveViews,
} from '@/hooks/useInvestArchives';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { InvestArchiveFormDrawer } from '@/components/investArchives/InvestArchiveFormDrawer';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate } from '@/lib/formatters';

/**
 * 투자 자료실 상세 (22_invest_archives.md 22.3).
 * 조회수 증가(RPC) + 본문 + 공통 첨부파일 다운로드 카드. 수정/삭제=작성자 본인·Admin.
 */
export function InvestArchiveDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAdmin = role === 'admin';
  const [editOpen, setEditOpen] = useState(false);

  const { data: archive, isLoading, isError, refetch } = useInvestArchive(id);
  const { remove } = useInvestArchiveMutations();

  // 상세 로딩 시 조회수 1 증가(레코드당 1회). StrictMode 이중 호출 방지 가드.
  const countedRef = useRef<string | null>(null);
  useEffect(() => {
    if (id && countedRef.current !== id) {
      countedRef.current = id;
      void incrementArchiveViews(id);
    }
  }, [id]);

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !archive) {
    return (
      <EmptyState
        message="자료를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/invest-archives')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const isOwner = !!userId && archive.createdById === userId;
  const canEdit = isAdmin || isOwner;

  const handleDelete = () => {
    toast.confirm('자료 삭제', `'${archive.title}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(archive.id);
        toast.success('삭제되었습니다.');
        navigate('/invest-archives');
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
          onClick={() => navigate('/invest-archives')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 투자 자료실
        </button>
        {canEdit ? (
          <Space>
            <Button onClick={() => setEditOpen(true)}>수정</Button>
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          </Space>
        ) : null}
      </div>

      {/* 게시글 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {archive.isPinned ? <span className="text-sm font-bold text-yna-point">[공지]</span> : null}
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{archive.title}</h1>
        </div>
        <Descriptions column={{ xs: 1, md: 3 }} size="small">
          <Descriptions.Item label="작성자">{archive.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(archive.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="조회수">{archive.views.toLocaleString('ko-KR')}</Descriptions.Item>
        </Descriptions>
        {archive.content ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-yna-main">
              {archive.content}
            </p>
          </div>
        ) : null}
      </div>

      {/* 첨부파일 (전 도메인 공통 카드 — 자료 양식 다운로드) */}
      {archive.sections.attachments ? (
        <EntityFilesBlock entityType="invest_archive" entityId={archive.id} title="첨부 자료" />
      ) : null}

      <InvestArchiveFormDrawer
        open={editOpen}
        archive={archive}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
