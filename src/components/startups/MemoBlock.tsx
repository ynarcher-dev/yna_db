import { useState } from 'react';
import { Button, Timeline } from 'antd';
import { SectionHeader } from './SectionHeader';
import { MemoFormDrawer } from './MemoFormDrawer';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/formatters';
import type { Startup } from '@/types/startup';

/**
 * 시계열 메모/회의록 블록 (협력사 교류 이력과 동일한 타임라인 형태).
 * 일자 내림차순 타임라인으로 표시하고, '수정'으로 편집한다.
 */
export function MemoBlock({ startup, onSaved }: { startup: Startup; onSaved?: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const sorted = [...startup.memos].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader
        title="메모 · 회의록"
        updatedAt={startup.memosUpdatedAt}
        action={
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <EmptyState message="등록된 메모가 없습니다. “수정”에서 회의록·메모를 기록하세요." />
      ) : (
        <Timeline
          items={sorted.map((m, i) => ({
            key: i,
            children: (
              <div>
                <p className="text-xs text-gray-500">{formatDate(m.date)}</p>
                <p className="whitespace-pre-wrap text-sm text-yna-main">{m.content}</p>
              </div>
            ),
          }))}
        />
      )}

      <MemoFormDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}
