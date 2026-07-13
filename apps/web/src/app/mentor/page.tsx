import { bannersApi } from "@didimzip/api";
import MentorHub from "@/components/mentor/MentorHub";

export const dynamic = "force-dynamic";

// 상단 광고 — MENTOR_TOP 위치. 카테고리/콘텐츠 상단 광고와 동일 pickAd 엔진 + AdBanner(AD Badge 포함) 재사용.
async function loadTopAd() {
  try {
    return await bannersApi.pickAd("MENTOR_TOP");
  } catch {
    return null;
  }
}

// 멘토 Q&A / 매칭 페이지 — 상단 광고 + LNB + 많이 본 Q&A + 디딤멘토 소개 + (풀폭 밴드) 궁금한 점.
// 그레이 밴드가 메인 영역 전체 폭을 차지하도록 MentorHub 를 컨테이너로 감싸지 않는다.
export default async function MentorPage() {
  const topAd = await loadTopAd();

  return (
    <div className="flex flex-col">
      <MentorHub topAd={topAd} />
    </div>
  );
}
