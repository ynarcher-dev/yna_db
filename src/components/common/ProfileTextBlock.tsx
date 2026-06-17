import { useState } from 'react';
import { Drawer, Input, Button } from 'antd';

/**
 * 프로필 텍스트 블록 카드 (심사역·전문가 상세 공용). '소개' 등 자유 서술 텍스트를
 * 별도 블록으로 표시한다. 값이 없으면 안내 문구를 보여준다(홈페이지 노출용으로 항상 노출).
 * editable=true 면 카드 자체의 '수정'(드로어)으로 해당 텍스트만 부분 저장한다(기본 수정과 분리).
 */
interface ProfileTextBlockProps {
  title: string;
  text: string;
  editable?: boolean;
  saving?: boolean;
  onSave?: (text: string) => void;
}

function TextEditDrawer({
  open,
  title,
  text,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  text: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [value, setValue] = useState(text);

  return (
    <Drawer title={`${title} 수정`} width={520} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <div className="space-y-4">
          <Input.TextArea
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${title} 내용을 입력하세요.`}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" loading={saving} onClick={() => onSave(value)}>
              저장
            </Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

export function ProfileTextBlock({ title, text, editable, saving, onSave }: ProfileTextBlockProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-yna-main">{title}</h2>
        {editable ? (
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        ) : null}
      </div>
      {text ? (
        <p className="whitespace-pre-line border-l-2 border-yna-point pl-4 text-sm leading-relaxed text-yna-main">
          {text}
        </p>
      ) : (
        <p className="text-sm text-yna-sub">등록된 {title} 내용이 없습니다.</p>
      )}

      {editable && onSave ? (
        <TextEditDrawer
          open={editOpen}
          title={title}
          text={text}
          saving={saving}
          onClose={() => setEditOpen(false)}
          onSave={(t) => {
            onSave(t);
            setEditOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
