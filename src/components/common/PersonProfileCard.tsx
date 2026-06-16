import type { ReactNode } from 'react';
import { Avatar } from 'antd';
import { HiOutlineUser } from 'react-icons/hi';

/**
 * 사람-프로필 공통 카드 (17_conventions.md 6장 PersonProfileCard).
 * 심사역(managers)·전문가(experts) 상세 화면이 동일한 헤더(아바타+이름+태그+직책·소속)와
 * 카드 프레임을 공유한다. 연락처/이메일/관심분야/날짜 등 필드 행은 children(Descriptions)으로,
 * 도메인 고유 블록(평점/약력 등)은 카드 바깥에 별도로 배치한다.
 */
interface PersonProfileCardProps {
  imageUrl?: string;
  name: string;
  /** 이름 옆 배지들 (역할/유형/상태 등) */
  tags?: ReactNode;
  /** 직책 · 소속 등 한 줄 서브타이틀 */
  subtitle?: string;
  /** 인삿말 등 헤더 하단 소개 블록 (선택) */
  intro?: ReactNode;
  /** 연락처/이메일/관심분야/날짜 등 (보통 antd Descriptions) */
  children: ReactNode;
}

export function PersonProfileCard({
  imageUrl,
  name,
  tags,
  subtitle,
  intro,
  children,
}: PersonProfileCardProps) {
  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center gap-4">
        <Avatar
          size={64}
          src={imageUrl || undefined}
          icon={<HiOutlineUser />}
          style={{ backgroundColor: '#e22213' }}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-yna-main">{name}</h1>
            {tags}
          </div>
          {subtitle ? <p className="mt-1 text-sm text-yna-sub">{subtitle}</p> : null}
        </div>
      </div>
      {intro ? <div className="mb-4">{intro}</div> : null}
      {children}
    </div>
  );
}
