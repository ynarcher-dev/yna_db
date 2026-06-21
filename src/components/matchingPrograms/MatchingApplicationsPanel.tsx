import { useMemo, useState } from 'react';
import { Table, Select, Button } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useMatchingApplications,
  useMatchingApplicationMutations,
} from '@/hooks/useMatchingApplications';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchingApplicationFormModal } from './MatchingApplicationFormModal';
import { MATCHING_APPLICATION_STATUS_OPTIONS } from '@/lib/labels';
import { formatDate, formatKRWShort } from '@/lib/formatters';
import type { MatchingApplicationInput } from '@/schemas/matchingApplication';
import type { MatchingApplication } from '@/types/matchingApplication';
import type { MatchingApplicationStatus } from '@/types/database';

/**
 * 매칭 신청/연계 리스트 패널 (matching_applications, 21_matching_programs.md 21.3).
 * 신청한 스타트업·담당 심사역·진행 상태를 표로 표출하고, 팝업 폼으로 신규 추천/매칭을 추가한다.
 * 진행 상태는 인라인 변경, 행 수정/연동 해제 지원. 스타트업/심사역과 연결되는 연동 카드.
 */
export function MatchingApplicationsPanel({ programId }: { programId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { applications, isLoading } = useMatchingApplications(programId);
  const { add, update, updateStatus, remove } = useMatchingApplicationMutations(programId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MatchingApplication | undefined>();

  const excludeStartupIds = useMemo(
    () => applications.map((a) => a.startupId),
    [applications],
  );

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (a: MatchingApplication) => {
    setEditing(a);
    setModalOpen(true);
  };

  const handleSubmit = (values: MatchingApplicationInput) => {
    if (editing) {
      update.mutate(
        { id: editing.id, input: values },
        {
          onSuccess: () => {
            toast.success('매칭 신청이 수정되었습니다.');
            setModalOpen(false);
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      add.mutate(values, {
        onSuccess: () => {
          toast.success('스타트업이 매칭에 추가되었습니다.');
          setModalOpen(false);
        },
        onError: (err) => toast.error('추가에 실패했습니다.', err),
      });
    }
  };

  const handleStatusChange = (id: string, status: MatchingApplicationStatus) => {
    updateStatus.mutate(
      { id, status },
      { onError: (err) => toast.error('상태 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (a: MatchingApplication) => {
    toast.confirm('연동 해제', `'${a.startupName || '스타트업'}' 매칭을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(a.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  const columns: TableProps<MatchingApplication>['columns'] = [
    {
      title: '스타트업',
      key: 'startup',
      ellipsis: true,
      render: (_, a) => <span className="font-medium text-yna-main">{a.startupName || '-'}</span>,
    },
    { title: '담당 심사역', key: 'manager', width: 120, ellipsis: true, render: (_, a) => a.managerName || '-' },
    {
      title: '진행 상태',
      key: 'status',
      width: 130,
      render: (_, a) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            size="small"
            className="w-28"
            options={MATCHING_APPLICATION_STATUS_OPTIONS}
            value={a.status}
            onChange={(v: MatchingApplicationStatus) => handleStatusChange(a.id, v)}
          />
        </div>
      ),
    },
    { title: '신청일', key: 'apply_date', width: 110, align: 'center', render: (_, a) => formatDate(a.applyDate) },
    {
      title: '선정일',
      key: 'selection_date',
      width: 110,
      align: 'center',
      render: (_, a) => (a.selectionDate ? formatDate(a.selectionDate) : '-'),
    },
    {
      title: '매칭 지원금',
      key: 'matching_amount',
      width: 110,
      align: 'right',
      render: (_, a) => (a.matchingAmount ? formatKRWShort(a.matchingAmount) : '-'),
    },
    {
      title: '관리',
      key: 'actions',
      width: 96,
      align: 'center',
      render: (_, a) => (
        <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            type="text"
            aria-label="수정"
            icon={<HiOutlinePencil />}
            onClick={() => openEdit(a)}
          />
          <Button
            size="small"
            type="text"
            danger
            aria-label="연동 해제"
            icon={<HiOutlineLinkSlash />}
            onClick={() => handleRemove(a)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-yna-main">
          매칭 신청/연계
          <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
        </h2>
        <Button type="primary" size="small" icon={<HiOutlinePlus />} onClick={openCreate}>
          스타트업 매칭 추가
        </Button>
      </div>

      {applications.length === 0 && !isLoading ? (
        <EmptyState message="아직 매칭 신청 스타트업이 없습니다." />
      ) : (
        <Table<MatchingApplication>
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={applications}
          pagination={false}
          onRow={(a) => ({
            onClick: () => (a.startupId ? navigate(`/startups/${a.startupId}`) : undefined),
            style: { cursor: a.startupId ? 'pointer' : 'default' },
          })}
        />
      )}

      <MatchingApplicationFormModal
        open={modalOpen}
        application={editing}
        excludeStartupIds={excludeStartupIds}
        submitting={add.isPending || update.isPending}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
