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
  authorProfileImage?: string; // authorId 로 조회한 최신 프로필 이미지 (빈 값이면 미노출)
  authorBadge?: "editor" | "expert" | "mentor";
  company?: string; // 광고(isAd=true) 시 광고주명 — 작성자(닉네임) 위치에 표시. 추후 Admin 필드로 교체.
  viewCount: number;
  isHot: boolean;
  isAd: boolean;
  createdAt: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  job: string;
  description: string;
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

// 멘토링 후기 — 향후 Admin/실 후기 데이터로 교체 시 이 형태만 채우면 카드가 자동 생성.
export interface MentorReview {
  id: string;
  role: string; // 멘토 직무
  mentorName: string; // 멘토명
  profileImage?: string; // 없으면 기본 아바타
  content: string; // 후기 내용
  rating: number; // 별점(0~5)
  reviewer: string; // 후기 작성자
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
    description: "초기 창업부터 투자 유치까지 함께합니다.",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    tags: ["자금조달", "IR피칭"],
  },
  {
    id: "2",
    name: "김환수 멘토",
    job: "노무사",
    description: "안녕하세요, 스타트업 노무 관련 궁금한 점이 있으면 편하게 물어보세요.",
    profileImage: "", // 프로필 이미지 없음 → 기본 Avatar(BsPerson) 노출
    tags: [
      "근로계약",
      "임금체불",
      "부당해고",
      "근로시간 단축",
      "퇴직금",
      "연차수당",
      "4대보험",
      "취업규칙",
      "징계",
      "산업재해",
      "인사평가",
      "노사협의",
    ],
  },
  {
    id: "3",
    name: "이서진 멘토",
    job: "마케팅 전문가",
    description: "데이터 기반 그로스 마케팅을 코칭합니다.",
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

export const mentorReviews: MentorReview[] = [
  {
    id: "r1",
    role: "창업 컨설턴트 멘토",
    mentorName: "김민수",
    content:
      "아이디어는 있었지만 어디서부터 시작해야 할지 몰라 막막했는데, 디딤멘토를 통해 상담을 받고 방향이 정리됐습니다. 특히 사업계획서를 어떻게 풀어야 하는지, 지금 단계에서 무엇을 우선해야 하는지 구체적으로 알려주셔서 바로 실행으로 이어질 수 있었습니다.",
    rating: 5,
    reviewer: "안**님 후기",
  },
  {
    id: "r2",
    role: "노무사",
    mentorName: "김민수",
    content:
      "초반에 잡았던 기획 방향이 맞는지 확신이 없었는데, 멘토링을 통해 문제점과 보완할 부분을 명확하게 알 수 있었습니다. 막연하게 알던 내용을 정확히 짚어주셔서 이후 방향을 잡는 데 큰 도움이 됐습니다.",
    rating: 5,
    reviewer: "광**님 후기",
  },
  {
    id: "r3",
    role: "서비스 기획자",
    mentorName: "이서연",
    content:
      "기획을 하면서 사용자 입장에서 생각하는 게 쉽지 않았는데, 실제 사용 흐름을 기준으로 어떻게 설계해야 하는지 단계별로 설명해주셨습니다. 이론이 아닌 실제 사례로 설명해주셔서 이해가 잘 됐고 바로 적용할 수 있었습니다.",
    rating: 5,
    reviewer: "조**님 후기",
  },
  {
    id: "r4",
    role: "서비스 기획자",
    mentorName: "강태형",
    content:
      "이론이 아니라 실제 서비스 기획 과정에서 겪는 부분을 중심으로 설명해주셔서 현실적으로 와닿았습니다. 어떤 부분이 왜 중요한지 이유까지 함께 설명해주셔서 이해가 빨랐고 업무에 바로 적용할 수 있었습니다.",
    rating: 5,
    reviewer: "김**님 후기",
  },
  {
    id: "r5",
    role: "창업 멘탈링 멘토",
    mentorName: "박도현",
    content:
      "창업을 처음 준비하다 보니 모르는 게 많았는데, 전반적인 흐름을 한 번에 이해할 수 있어 좋았습니다. 실제 사례 중심으로 설명해주셔서 막연하던 창업 준비가 훨씬 구체적으로 다가왔습니다.",
    rating: 5,
    reviewer: "도**님 후기",
  },
];

// 최신 Q&A — 향후 실제 Q&A 데이터로 교체 시 이 형태만 채우면 카드가 자동 생성.
export interface LatestQnaItem {
  id: string;
  status: "채택완료" | "미채택"; // 답변 채택 여부
  title: string;
  body: string; // 질문 내용 요약
  category: string;
  viewCount: number;
  answerCount: number;
  date: string; // 작성일(표시용). 실제 데이터 연결 시 createdAt 포맷팅.
}

export const latestQnaItems: LatestQnaItem[] = [
  {
    id: "lq1",
    status: "채택완료",
    title: "아이디어만 있는데 지금 바로 창업해도 될까요?",
    body: "구체적인 서비스는 아직 없고 아이디어만 있는 상태입니다. 바로 사업자 등록을 하는 게 맞는지, 아니면 MVP나 시장 검증을 먼저 하는 게 좋을지 고민입니다.",
    category: "자금조달",
    viewCount: 5600,
    answerCount: 8,
    date: "26.04.23",
  },
  {
    id: "lq2",
    status: "미채택",
    title: "MVP는 어느 정도 수준까지 만들어야 할까요?",
    body: "아이디어를 바탕으로 간단한 서비스를 만들어보려고 합니다. MVP를 어느 정도 수준까지 만들어야 하는지 기준이 애매합니다. 디자인까지 신경 써야 할까요?",
    category: "사업화전략",
    viewCount: 7250,
    answerCount: 0,
    date: "26.04.23",
  },
  {
    id: "lq3",
    status: "미채택",
    title: "초기 마케팅 예산이 거의 없는데 어떻게 시작해야 할까요?",
    body: "서비스를 준비 중인데 마케팅 예산이 거의 없는 상황입니다. 유료 광고보다는 무료 채널을 활용해야 할 것 같은데, 어떤 방식으로 접근하는 것이 좋을지 고민입니다.",
    category: "마케팅",
    viewCount: 300,
    answerCount: 2,
    date: "26.04.22",
  },
  {
    id: "lq4",
    status: "채택완료",
    title: "공동창업자를 구할 때 가장 중요하게 봐야 할 기준은 무엇인가요?",
    body: "혼자 창업을 준비하다 한계를 느껴 공동창업자를 찾고 있습니다. 실력, 성향, 역할 분배 등 어떤 기준으로 판단해야 하는지 경험자들의 의견이 궁금합니다.",
    category: "조직문화",
    viewCount: 2150,
    answerCount: 8,
    date: "26.04.22",
  },
  {
    id: "lq5",
    status: "미채택",
    title: "초기 스타트업에서 브랜딩은 꼭 필요한가요?",
    body: "서비스 기능 개발이 우선인지, 브랜드 이미지나 로고 같은 브랜딩을 먼저 준비해야 하는지 고민입니다. 초기 단계에서 어디까지 신경 써야 할까요?",
    category: "사업화전략",
    viewCount: 127,
    answerCount: 4,
    date: "26.04.21",
  },
];

// 멘토에게 질문 — Infinite Scroll 테스트용 더미 Q&A. index 기반 결정적 생성(Math.random 미사용).
const QNA_TITLE_POOL = [
  "아이디어만 있는데 지금 바로 창업해도 될까요?",
  "MVP는 어느 정도 수준까지 만들어야 할까요?",
  "초기 마케팅 예산이 거의 없는데 어떻게 시작해야 할까요?",
  "공동창업자를 구할 때 가장 중요하게 봐야 할 기준은 무엇인가요?",
  "초기 스타트업에서 브랜딩은 꼭 필요한가요?",
  "정부지원사업은 언제부터 준비하는 게 좋을까요?",
  "투자 유치를 위해 꼭 준비해야 하는 자료는 무엇인가요?",
  "서비스 출시 전 꼭 테스트해야 하는 부분은 무엇인가요?",
  "법인 전환은 언제 하는 것이 유리한가요?",
  "초기 팀에게 지분은 어떻게 배분하는 게 좋을까요?",
];
const QNA_BODY_POOL = [
  "구체적인 서비스는 아직 없고 아이디어만 있는 상태입니다. 바로 사업자 등록을 하는 게 맞는지, MVP나 시장 검증을 먼저 하는 게 좋을지 고민입니다.",
  "간단한 서비스를 만들어보려고 합니다. MVP를 어느 수준까지 만들어야 하는지 기준이 애매합니다. 디자인까지 신경 써야 할까요?",
  "마케팅에 쓸 예산이 거의 없는 상황입니다. 유료 광고보다는 무료 채널을 활용해야 할 것 같은데 어떤 방식이 좋을지 고민입니다.",
  "혼자 준비하다 한계를 느껴 공동창업자를 찾고 있습니다. 실력·성향·역할 분배 등 어떤 기준으로 판단해야 할지 궁금합니다.",
  "기능 개발이 우선인지, 브랜드 이미지나 로고 같은 브랜딩을 먼저 준비해야 하는지 초기 단계에서 어디까지 신경 써야 할까요?",
];
const QNA_CATEGORY_POOL = [
  "자금조달",
  "사업화전략",
  "오픈이노베이션",
  "기관투자자",
  "바우처공급기업",
  "창업공간",
];

export function generateLatestQna(count = 42): LatestQnaItem[] {
  return Array.from({ length: count }, (_, i) => {
    const day = String(28 - (i % 28)).padStart(2, "0");
    return {
      id: `q_${i + 1}`,
      status: i % 3 === 0 ? "채택완료" : "미채택",
      title: QNA_TITLE_POOL[i % QNA_TITLE_POOL.length],
      body: QNA_BODY_POOL[i % QNA_BODY_POOL.length],
      category: QNA_CATEGORY_POOL[(i * 2 + (i % 3)) % QNA_CATEGORY_POOL.length],
      viewCount: 120 + ((i * 173) % 9000),
      answerCount: (i * 3) % 12,
      date: `26.04.${day}`,
    } satisfies LatestQnaItem;
  });
}

// 멘토에게 질문 탭 전체 목록(더미). 추후 실제 Q&A API 로 교체.
export const allQnaItems: LatestQnaItem[] = generateLatestQna(42);
