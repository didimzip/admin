export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  subcategories: { id: string; name: string; slug: string }[];
}

export interface ContentCard {
  id: string;
  title: string;
  summary: string;
  thumbnail: string;
  category: string;
  subcategory: string;
  author: string;
  authorBadge?: "editor" | "expert" | "mentor";
  viewCount: number;
  isHot: boolean;
  isAd: boolean;
  createdAt: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  job: string;
  profileImage: string;
  tags: string[];
}

export interface QAItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  viewCount: number;
  answerCount: number;
}

export interface CommunePost {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: "recruiting" | "closed";
  deadline: string;
  viewCount: number;
  commentCount: number;
  thumbnail?: string;
}

export const categories: Category[] = [
  {
    id: "1",
    name: "자금조달",
    slug: "funding",
    description: "성공적인 사업 자금 확보 전략과 투자 유치 비법을 공유합니다.",
    subcategories: [
      { id: "1-1", name: "투자유치", slug: "investment" },
      { id: "1-2", name: "정부지원사업", slug: "government" },
      { id: "1-3", name: "고용지원금", slug: "employment" },
      { id: "1-4", name: "정부대출", slug: "loan" },
    ],
  },
  {
    id: "2",
    name: "마케팅",
    slug: "marketing",
    description: "디지털 마케팅부터 브랜딩까지, 성장을 위한 마케팅 전략을 나눕니다.",
    subcategories: [
      { id: "2-1", name: "디지털 마케팅", slug: "digital" },
      { id: "2-2", name: "브랜딩", slug: "branding" },
      { id: "2-3", name: "퍼포먼스", slug: "performance" },
    ],
  },
  {
    id: "3",
    name: "사업화전략",
    slug: "strategy",
    description: "사업 모델 구축부터 시장 진입까지, 실전 사업화 전략을 다룹니다.",
    subcategories: [
      { id: "3-1", name: "비즈니스 모델", slug: "bm" },
      { id: "3-2", name: "시장분석", slug: "market" },
    ],
  },
  {
    id: "4",
    name: "지식정보",
    slug: "knowledge",
    description: "창업에 필요한 법률, 세무, 노무 등 전문 지식을 공유합니다.",
    subcategories: [
      { id: "4-1", name: "법률", slug: "legal" },
      { id: "4-2", name: "세무/회계", slug: "tax" },
      { id: "4-3", name: "노무", slug: "labor" },
    ],
  },
  {
    id: "5",
    name: "조직문화",
    slug: "culture",
    description: "팀 빌딩, HR, 조직 문화 구축에 대한 인사이트를 나눕니다.",
    subcategories: [
      { id: "5-1", name: "HR/채용", slug: "hr" },
      { id: "5-2", name: "팀 빌딩", slug: "team" },
    ],
  },
  {
    id: "6",
    name: "기획/디자인",
    slug: "design",
    description: "제품 기획, UX/UI, 서비스 디자인에 관한 실무 노하우를 공유합니다.",
    subcategories: [
      { id: "6-1", name: "서비스 기획", slug: "planning" },
      { id: "6-2", name: "UX/UI", slug: "uxui" },
    ],
  },
  {
    id: "7",
    name: "AI/데이터",
    slug: "ai",
    description: "AI, 데이터 분석, 테크 트렌드에 대한 최신 정보를 다룹니다.",
    subcategories: [
      { id: "7-1", name: "AI 활용", slug: "ai-use" },
      { id: "7-2", name: "데이터 분석", slug: "data" },
    ],
  },
];

const thumbnails = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=640&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=640&q=80",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=640&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80",
];

const titles = [
  "디지털 마케팅의 중요성과 전략",
  "네트워킹의 힘: 비즈니스 성장의 열쇠",
  "소셜 미디어 활용하기: 고객과의 소통",
  "창업가의 심리적 준비: 실패를 두려워하지 마세요",
  "비즈니스 계획서 작성의 핵심 포인트",
  "화장품을 창고처럼 쌓아두고 판다?",
  "이메일 마케팅: 고객과의 지속적 관계",
  "스타트업 성공 사례: 혁신적인 아이디어",
  "크라우드 펀딩으로 자금 조달하기",
  "업종별 성공적인 비즈니스 모델 분석",
  "스타트업을 위한 팀 구성 전략",
  "초개인화 알고리즘의 명암",
];

const authors = ["디딤에디터", "오프뷰티", "김창업", "이혁신", "박성장", "신한금융희망재단"];

export function generateContents(count: number): ContentCard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: titles[i % titles.length],
    summary:
      "성공적인 창업을 위해 필요한 핵심 인사이트를 공유합니다. 실전 경험에서 나온 노하우를 확인해보세요.",
    thumbnail: thumbnails[i % thumbnails.length],
    category: categories[i % categories.length].name,
    subcategory:
      categories[i % categories.length].subcategories[0]?.name ?? "",
    author: authors[i % authors.length],
    authorBadge: i % 4 === 0 ? "editor" : undefined,
    viewCount: Math.floor(Math.random() * 500) + 10,
    isHot: i < 8,
    isAd: i === 5,
    createdAt: "2026.04.0" + ((i % 9) + 1),
  }));
}

export const qaItems: QAItem[] = [
  {
    id: "1",
    title: "초기 창업자가 가장 먼저 준비해야 할 것은 무...",
    summary:
      "안녕하세요, 처음 IT서비스를 창업하려고하는데 사업화에대한 이해가 부족합니다...",
    category: "자금조달",
    viewCount: 4500,
    answerCount: 12,
  },
  {
    id: "2",
    title: "시장규모 들어 먼저 MVP를 만들면서 시작하는 것...",
    summary:
      "Lean startup과 같은 방법론을 통해 시장을 검증하면서 진입전략을 세워야...",
    category: "사업화전략",
    viewCount: 3200,
    answerCount: 8,
  },
  {
    id: "3",
    title: "초기 스타트업 마케팅방법은 어떤 매체(블로그)이 시작하...",
    summary:
      "초기 마케팅 비용이 제한적인 상태에서 SNS, 블로그 등을 활용한 전략이...",
    category: "마케팅",
    viewCount: 2800,
    answerCount: 15,
  },
  {
    id: "4",
    title: "창업 초기 공동창업자는 어떻게 찾는 것이 좋을...",
    summary:
      "처음 시작하는 단계에서 기술 파트너나 비즈니스 파트너를 어떻게 찾고 계약을...",
    category: "조직문화",
    viewCount: 2100,
    answerCount: 6,
  },
  {
    id: "5",
    title: "정부 창업 지원사업은 언제부터 준비하는 게...",
    summary:
      "정부지원사업 선정률을 높이기 위한 사업계획서 작성법과 타이밍에 대해 궁금합...",
    category: "자금조달",
    viewCount: 3800,
    answerCount: 10,
  },
  {
    id: "6",
    title: "정부 아이디어인 감중을 보는 이런 방식으로 진...",
    summary:
      "아이디어 감중을 사업화로 연결시키기 위한 과정에서 무엇을 먼저 해야하는지...",
    category: "사업화전략",
    viewCount: 1900,
    answerCount: 5,
  },
];

export const mentors: MentorProfile[] = [
  {
    id: "1",
    name: "김관수 멘토",
    job: "창업 컨설턴트",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    tags: ["자금조달", "IR피칭"],
  },
  {
    id: "2",
    name: "김환수 멘토",
    job: "노무사",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    tags: ["노무관리", "인사전략"],
  },
  {
    id: "3",
    name: "이서진 멘토",
    job: "마케팅 전문가",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    tags: ["퍼포먼스마케팅", "그로스해킹"],
  },
];

export const communePosts: CommunePost[] = [
  {
    id: "1",
    title: "제일기획 공모전 함께하실 팀원 모 모집합니다",
    summary:
      "디자이너분과 마케터분 찾고 있습니다. 5-6월 진행 예정이고 관심있으신 분은 댓글 달아주세요.",
    category: "팀 프로젝트",
    status: "recruiting",
    deadline: "26.05.30",
    viewCount: 523,
    commentCount: 12,
  },
  {
    id: "2",
    title: "AI 모델 개발 프로젝트 팀원을 모집합니다",
    summary:
      "Python, ML 경험 있으신 분 환영합니다. 주 2회 온라인 미팅으로 진행할 예정입니다.",
    category: "팀 프로젝트",
    status: "recruiting",
    deadline: "26.06.15",
    viewCount: 312,
    commentCount: 8,
    thumbnail:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&q=80",
  },
  {
    id: "3",
    title: "창업 네트워킹 그룹 '스타트업 친구' 멤버 모집!",
    summary:
      "매주 수요일 저녁 오프라인 네트워킹을 합니다. 현재 20명 규모로 운영 중.",
    category: "네트워킹",
    status: "recruiting",
    deadline: "상시모집",
    viewCount: 1570,
    commentCount: 24,
  },
  {
    id: "4",
    title: "초기 SaaS 서비스 함께 만들고 공동창업하고 구한다 나...",
    summary:
      "기획자와 개발자가 함께 SaaS 서비스를 만들어볼 공동창업 파트너를 찾습니다.",
    category: "공동창업",
    status: "recruiting",
    deadline: "26.05.01",
    viewCount: 890,
    commentCount: 16,
  },
];
