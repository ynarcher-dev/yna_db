import { Button, Input } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

/**
 * URL 복수 입력 필드 — 간트 일정(테스크) 드로어 공용.
 * 제어 컴포넌트(string[]). 빈 행은 저장 단계(toRow)에서 정리된다.
 */
export function UrlListField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const update = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };
  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, '']);

  return (
    <div className="space-y-2">
      {value.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={url}
            placeholder="https://example.com"
            onChange={(e) => update(i, e.target.value)}
          />
          <Button
            type="text"
            danger
            aria-label="링크 삭제"
            icon={<HiOutlineTrash />}
            onClick={() => removeAt(i)}
          />
        </div>
      ))}
      <Button size="small" type="dashed" icon={<HiOutlinePlus />} onClick={add} block>
        링크 추가
      </Button>
    </div>
  );
}
