/**
 * 프로필 텍스트 블록 카드 (심사역·전문가 상세 공용). '소개' 등 자유 서술 텍스트를
 * 별도 블록으로 표시한다. 값이 없으면 안내 문구를 보여준다(홈페이지 노출용으로 항상 노출).
 */
export function ProfileTextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-yna-main">{title}</h2>
      {text ? (
        <p className="whitespace-pre-line border-l-2 border-yna-point pl-4 text-sm leading-relaxed text-yna-main">
          {text}
        </p>
      ) : (
        <p className="text-sm text-yna-sub">등록된 {title} 내용이 없습니다.</p>
      )}
    </div>
  );
}
