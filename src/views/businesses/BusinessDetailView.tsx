import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusiness, useBusinessMutations } from '@/hooks/useBusinesses';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { BusinessFormDrawer } from '@/components/businesses/BusinessFormDrawer';
import { EntityManagersPanel } from '@/components/common/EntityManagersPanel';
import { BusinessStartupsPanel } from '@/components/businesses/BusinessStartupsPanel';
import { BusinessPartnersPanel } from '@/components/businesses/BusinessPartnersPanel';
import { BusinessCalendarBlock } from '@/components/businesses/BusinessCalendarBlock';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate, formatKRWMillions } from '@/lib/formatters';

/**
 * 사업 상세 (7_businesses.md 7.3).
 * 개요 카드 + 운영 심사역 매핑·참여 스타트업·마일스톤 캘린더(후속 단계)·첨부파일.
 * 삭제 = 책임자(created_by)+관리자.
 */
export function BusinessDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: business, isLoading, isError, refetch } = useBusiness(id);
  const { remove } = useBusinessMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !business) {
    return (
      <EmptyState
        message="사업을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/businesses')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const canDelete = role === 'admin' || (!!userId && business.createdById === userId);

  const handleDelete = () => {
    toast.confirm('사업 삭제', `'${business.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(business.id);
        toast.success('삭제되었습니다.');
        navigate('/businesses');
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
          onClick={() => navigate('/businesses')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 사업 목록
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
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{business.name}</h1>
          <span className="rounded-full bg-yna-bg px-2 py-0.5 text-sm text-yna-sub">
            {business.generation}기
          </span>
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="운영 예산">{formatKRWMillions(business.budget)}</Descriptions.Item>
          <Descriptions.Item label="모집 마감일">
            {business.recruitmentDeadline ? formatDate(business.recruitmentDeadline) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="매출">{formatKRWMillions(business.revenue)}</Descriptions.Item>
          <Descriptions.Item label="이익">{formatKRWMillions(business.profit)}</Descriptions.Item>
          <Descriptions.Item label="진행 기간">
            {formatDate(business.startDate)} ~ {formatDate(business.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="작성자">{business.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(business.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(business.updatedAt)}</Descriptions.Item>
        </Descriptions>
        {business.description ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-yna-main">{business.description}</p>
          </div>
        ) : null}
      </div>

      {/* 카드 섹션: 기본 수정에서 비활성화한 섹션은 숨긴다 (business.sections) */}

      {/* 담당자 매핑 (다대다 + 운영 역할) — 담당자는 모두 자유롭게 추가/해제(작성자 필수 편입 폐지, 0054). */}
      {business.sections.managers ? (
        <EntityManagersPanel kind="business" entityId={business.id} />
      ) : null}

      {/* 참여 스타트업 매핑 (보육 상태) */}
      {business.sections.startups ? <BusinessStartupsPanel businessId={business.id} /> : null}

      {/* 참여 협력사(기관) 매핑 (business_partners) */}
      {business.sections.partners ? <BusinessPartnersPanel businessId={business.id} /> : null}

      {/* 마일스톤 캘린더 (business_events → 대시보드 자동 동기화) */}
      {business.sections.calendar ? <BusinessCalendarBlock businessId={business.id} /> : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {business.sections.attachments ? (
        <EntityFilesBlock entityType="business" entityId={business.id} />
      ) : null}

      <BusinessFormDrawer
        open={editOpen}
        business={business}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
