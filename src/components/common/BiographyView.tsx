import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Button } from 'antd';
import { BiographyEditor } from './BiographyEditor';
import { biographySchema } from '@/schemas/biography';
import type { Biography } from '@/types/biography';

/**
 * 약력 표시 카드 (심사역·전문가 상세 공용). 표시는 세로형:
 * 학력 → 경력 → 자격증 → 수상 순으로 위에서 아래로, 각 항목을 한 줄로 나열한다. (입력은 BiographyEditor)
 * editable=true 면 카드 자체의 '수정'(드로어)으로 약력만 부분 저장한다(기본 수정과 분리).
 * editable 이 아닐 때만 비어 있으면 카드를 숨긴다(편집 가능하면 빈 상태로라도 노출해 입력 유도).
 */
interface BiographyViewProps {
  biography: Biography;
  editable?: boolean;
  saving?: boolean;
  onSave?: (biography: Biography) => void;
}

const editSchema = z.object({ biography: biographySchema });
type EditInput = z.infer<typeof editSchema>;

function BiographyEditDrawer({
  open,
  biography,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  biography: Biography;
  saving?: boolean;
  onClose: () => void;
  onSave: (biography: Biography) => void;
}) {
  const { control, handleSubmit } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: { biography },
  });

  return (
    <Drawer title="약력 수정" width={640} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit((v) => onSave(v.biography))} className="space-y-4" noValidate>
          <BiographyEditor control={control} />
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}

export function BiographyView({ biography, editable, saving, onSave }: BiographyViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { education, career, certifications, awards } = biography;
  const hasAny =
    education.length > 0 || career.length > 0 || certifications.length > 0 || awards.length > 0;

  if (!hasAny && !editable) return null;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-yna-main">약력</h2>
        {editable ? (
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        ) : null}
      </div>

      {hasAny ? (
        <div className="space-y-6">
          {education.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-medium text-yna-sub">학력</h3>
              <ul className="space-y-1">
                {education.map((e, i) => (
                  <li key={i} className="text-sm text-yna-main">
                    {e.school}
                    {e.major ? ` ${e.major}` : ''}
                    {e.degree ? ` (${e.degree})` : ''}
                    {e.period ? (
                      <span className="ml-2 text-xs text-gray-500">{e.period}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {career.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-medium text-yna-sub">경력</h3>
              <ul className="space-y-1">
                {career.map((c, i) => (
                  <li key={i} className="text-sm text-yna-main">
                    {c.company}
                    {c.position ? ` ${c.position}` : ''}
                    {c.period ? (
                      <span className="ml-2 text-xs text-gray-500">{c.period}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {certifications.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-medium text-yna-sub">자격증</h3>
              <ul className="space-y-1">
                {certifications.map((c, i) => (
                  <li key={i} className="text-sm text-yna-main">
                    {c.name}
                    {c.issuer ? ` · ${c.issuer}` : ''}
                    {c.period ? (
                      <span className="ml-2 text-xs text-gray-500">{c.period}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {awards.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-medium text-yna-sub">수상</h3>
              <ul className="space-y-1">
                {awards.map((a, i) => (
                  <li key={i} className="text-sm text-yna-main">
                    {a.name}
                    {a.issuer ? ` · ${a.issuer}` : ''}
                    {a.period ? (
                      <span className="ml-2 text-xs text-gray-500">{a.period}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-yna-sub">등록된 약력이 없습니다. “수정”에서 입력하세요.</p>
      )}

      {editable && onSave ? (
        <BiographyEditDrawer
          open={editOpen}
          biography={biography}
          saving={saving}
          onClose={() => setEditOpen(false)}
          onSave={(b) => {
            onSave(b);
            setEditOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
