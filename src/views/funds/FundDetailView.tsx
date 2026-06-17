import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useFund, useFundMutations } from '@/hooks/useFunds';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { FundFormDrawer } from '@/components/funds/FundFormDrawer';
import { FundExhaustionBar } from '@/components/funds/FundExhaustionBar';
import { LpCompositionBlock } from '@/components/funds/LpCompositionBlock';
import { CapitalCallsBlock } from '@/components/funds/CapitalCallsBlock';
import { FundInvestmentsBlock } from '@/components/funds/FundInvestmentsBlock';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate, formatKRW } from '@/lib/formatters';

/**
 * 펀드 상세 (8_funds.md 8.3). Admin 전용 수정/삭제.
 * 재무 정보 카드(결성액·잔액·소진율·투자기간) + LP 도넛·Capital Call·포트폴리오·첨부(후속 단계).
 */
export function FundDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const [editOpen, setEditOpen] = useState(false);

  const { data: fund, isLoading, isError, refetch } = useFund(id);
  const { remove } = useFundMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !fund) {
    return (
      <EmptyState
        message="펀드를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/funds')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('펀드 삭제', `'${fund.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(fund.id);
        toast.success('삭제되었습니다.');
        navigate('/funds');
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
          onClick={() => navigate('/funds')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 펀드 목록
        </button>
        {isAdmin ? (
          <Space>
            <Button onClick={() => setEditOpen(true)}>기본 수정</Button>
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          </Space>
        ) : null}
      </div>

      {/* 재무 정보 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-yna-main">{fund.name}</h1>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="결성 총액">{formatKRW(fund.totalAmount)}</Descriptions.Item>
          <Descriptions.Item label="미소진 잔액">{formatKRW(fund.balance)}</Descriptions.Item>
          <Descriptions.Item label="투자 기간">{fund.investingPeriod}</Descriptions.Item>
          <Descriptions.Item label="책임자">{fund.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(fund.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(fund.updatedAt)}</Descriptions.Item>
        </Descriptions>
        <div className="mt-4 border-t border-yna-border pt-4">
          <p className="mb-1 text-sm font-semibold text-yna-main">소진율</p>
          <FundExhaustionBar totalAmount={fund.totalAmount} balance={fund.balance} />
        </div>
      </div>

      {/* 카드 섹션: 기본 수정에서 비활성화한 섹션은 숨긴다 (fund.sections) */}

      {/* LP 구성 (표 + 지분율 도넛) */}
      {fund.sections.lp ? (
        <LpCompositionBlock fund={fund} isAdmin={isAdmin} onSaved={() => void refetch()} />
      ) : null}

      {/* Capital Call 납입 히스토리 */}
      {fund.sections.capitalCalls ? <CapitalCallsBlock fundId={fund.id} isAdmin={isAdmin} /> : null}

      {/* 피투자 포트폴리오 지분 분배 */}
      {fund.sections.investments ? <FundInvestmentsBlock fundId={fund.id} isAdmin={isAdmin} /> : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {fund.sections.attachments ? (
        <EntityFilesBlock entityType="fund" entityId={fund.id} />
      ) : null}

      <FundFormDrawer
        open={editOpen}
        fund={fund}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
