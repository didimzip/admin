import RecommendedSection from "./RecommendedSection";
import LatestSection from "./LatestSection";
import PopularSection from "./PopularSection";
import TopicSection from "./TopicSection";
import QASection from "./QASection";
import MentorSection from "./MentorSection";
import CommuneSection from "./CommuneSection";
import {
  getContentCards,
  getPopularContentCards,
  getQaItems,
  getMentors,
  getCommunePosts,
} from "@/lib/home-data";
import { dummyAdCard } from "@/lib/mock-ads";

// 각 섹션의 async 서버 컨테이너 — 데이터를 await 하고 프레젠테이션 섹션에 props 로 전달.
// page.tsx 에서 <Suspense fallback={스켈레톤}> 로 감싸면, await 동안 스켈레톤이 스트리밍된다.
// (SSR·SEO 유지: 서버에서 렌더 후 HTML 스트리밍)

export async function RecommendedSectionAsync() {
  const items = await getContentCards();
  return <RecommendedSection items={items} />;
}

export async function LatestSectionAsync() {
  const items = await getContentCards();
  return <LatestSection items={items} />;
}

export async function PopularSectionAsync() {
  const items = await getPopularContentCards();
  // 더미 광고 콘텐츠 1개를 일반 콘텐츠와 섞어 노출(디자인 확인용). 디딤집 Pick에는 미포함.
  return <PopularSection items={[dummyAdCard, ...items]} />;
}

export async function TopicSectionAsync() {
  const items = await getContentCards();
  return <TopicSection items={items} />;
}

export async function QASectionAsync() {
  const items = await getQaItems();
  return <QASection items={items} />;
}

export async function MentorSectionAsync() {
  const list = await getMentors();
  return <MentorSection mentors={list} />;
}

export async function CommuneSectionAsync() {
  const posts = await getCommunePosts();
  return <CommuneSection posts={posts} />;
}
