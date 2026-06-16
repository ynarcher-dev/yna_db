import { HiCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { passwordClassCount } from '@/schemas/auth';

/**
 * 비밀번호 정책 실시간 충족 체크리스트 (14_auth.md 14.3.2).
 * 최소 10자 / 영문 대·소문자·숫자·특수문자 중 3종 이상.
 */
function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-yna-sub'}`}>
      {ok ? <HiCheckCircle size={16} /> : <HiOutlineXCircle size={16} />}
      {label}
    </li>
  );
}

export function PasswordChecklist({ value }: { value: string }) {
  const lengthOk = value.length >= 10;
  const classesOk = passwordClassCount(value) >= 3;
  return (
    <ul className="space-y-1 text-xs">
      <Rule ok={lengthOk} label="최소 10자 이상" />
      <Rule ok={classesOk} label="영문 대/소문자·숫자·특수문자 중 3종 이상 조합" />
    </ul>
  );
}
