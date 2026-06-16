import { HiStar } from 'react-icons/hi';
import type { ExpertRating } from '@/types/expert';

/** 목록용 컴팩트 멘토링 만족도 표시 (별점 평균 + 이력 건수). 이력 없으면 '-'. */
export function RatingCell({ rating }: { rating?: ExpertRating }) {
  if (!rating || rating.mentoringCount === 0 || rating.averageRating === null) {
    return <span className="text-yna-sub">-</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <HiStar className="text-yellow-400" />
      <span className="font-medium text-yna-main">{rating.averageRating.toFixed(1)}</span>
      <span className="text-xs text-yna-sub">({rating.mentoringCount})</span>
    </span>
  );
}
