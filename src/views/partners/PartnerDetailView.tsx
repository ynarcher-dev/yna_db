import { useState } from 'react';
import { Button, Space, Timeline, Descriptions } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { usePartner, usePartnerMutations } from '@/hooks/usePartners';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PartnerTypeTag } from '@/components/partners/PartnerTypeTag';
import { PartnerFormDrawer } from '@/components/partners/PartnerFormDrawer';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { PartnerRelatedBlocks } from '@/components/partners/PartnerRelatedBlocks';
import { formatDate } from '@/lib/formatters';

/**
 * 협력사 상세 (12_partners.md 12.3).
 * 고유 블록: 프로필 카드 + 교류 협력 히스토리 타임라인.
 * 연계 블록(공동 참여 프로젝트)은 Phase 4 에서 project_partners 조인으로 연결한다.
 */
export function PartnerDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const [editOpen, setEditOpen] = useState(false);

  const { data: partner, isLoading, isError, refetch } = usePartner(id);
  const { remove } = usePartnerMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !partner) {
    return (
      <EmptyState
        message="협력사를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/partners')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('협력사 삭제', `'${partner.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(partner.id);
        toast.success('삭제되었습니다.');
        navigate('/partners');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  const sortedLog = [...partner.interactionLog].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/partners')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 협력사 목록
        </button>
        <Space>
          <Button onClick={() => setEditOpen(true)}>수정</Button>
          {role === 'admin' ? (
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          ) : null}
        </Space>
      </div>

      {/* 프로필 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{partner.name}</h1>
          <PartnerTypeTag type={partner.partnerType} />
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="부서명">{partner.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="담당자">{partner.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="연락처">{partner.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="이메일">{partner.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="책임자">{partner.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(partner.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(partner.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 교류 협력 히스토리 (기본 수정에서 비활성화하면 숨김) */}
      {partner.sections.interactionLog ? (
        <div className="rounded-lg border border-yna-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-yna-main">교류 협력 이력</h2>
          {sortedLog.length === 0 ? (
            <EmptyState message="등록된 교류 이력이 없습니다." />
          ) : (
            <Timeline
              items={sortedLog.map((entry, i) => ({
                key: i,
                children: (
                  <div>
                    <p className="text-sm text-yna-main">{entry.content}</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                  </div>
                ),
              }))}
            />
          )}
        </div>
      ) : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {partner.sections.attachments ? (
        <EntityFilesBlock entityType="partner" entityId={partner.id} />
      ) : null}

      {/* 역방향 연계: 참여 프로젝트 */}
      <PartnerRelatedBlocks partnerId={partner.id} />

      <PartnerFormDrawer
        open={editOpen}
        partner={partner}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
