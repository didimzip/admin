// ─── Consultation Store (localStorage) ──────────────────────────────────────

export type ConsultStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type Consultation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  postTitle: string;
  postCategory: string;
  message: string;
  status: ConsultStatus;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "didimzip-consultations";

const SEED_DATA: Consultation[] = [
  { id: "c001", name: "김민준", email: "minjun.kim@startup.io", phone: "010-1234-5678", company: "넥스트벤처스", jobTitle: "대표이사", postTitle: "2026 스타트업 VC 투자 트렌드 분석", postCategory: "인사이트", message: "안녕하세요. 저희 스타트업이 시리즈A 투자를 준비 중인데, 현재 시장 트렌드와 VC 미팅 전략에 대해 상담을 받고 싶습니다. 가능하면 이번 주 중으로 미팅을 진행하고 싶습니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T09:14:00Z", updatedAt: "2026-03-05T09:14:00Z" },
  { id: "c001b", name: "김민준", email: "minjun.kim@startup.io", phone: "010-1234-5678", company: "넥스트벤처스", jobTitle: "대표이사", postTitle: "B2B SaaS 기업의 ARR 성장 전략", postCategory: "인사이트", message: "지난번 상담 이후 IR 자료를 보완했습니다. 이번에는 ARR 성장 전략과 리텐션 개선 방법에 대해 구체적인 피드백을 받고 싶습니다.", status: "COMPLETED", adminMemo: "2/10 화상 미팅 완료. 리텐션 전략 공유, 후속 자료 이메일 발송.", createdAt: "2026-02-08T10:30:00Z", updatedAt: "2026-02-10T14:00:00Z" },
  { id: "c001c", name: "김민준", email: "minjun.kim@startup.io", phone: "010-1234-5678", company: "넥스트벤처스", jobTitle: "대표이사", postTitle: "IR 피칭 완벽 가이드: 투자자를 설득하는 법", postCategory: "인사이트", message: "처음으로 상담 요청드립니다. IR 자료 구성과 투자자 미팅 준비 방법에 대해 전반적인 가이드를 받고 싶습니다.", status: "COMPLETED", adminMemo: "1/15 전화 상담 완료. IR 자료 템플릿 공유.", createdAt: "2026-01-14T09:00:00Z", updatedAt: "2026-01-15T11:00:00Z" },
  { id: "c002", name: "이수연", email: "suyeon.lee@fintech.co.kr", phone: "010-2345-6789", company: "핀테크솔루션", jobTitle: "CFO", postTitle: "글로벌 핀테크 규제 변화와 대응 전략", postCategory: "인사이트", message: "규제 샌드박스 신청 절차와 해외 진출 시 필요한 인허가 관련하여 전문가 조언을 구하고 싶습니다. 구체적인 사례 기반으로 상담해주시면 감사하겠습니다.", status: "IN_PROGRESS", adminMemo: "3/6 오후 2시 화상 미팅 예정. 자료 준비 중.", createdAt: "2026-03-04T14:22:00Z", updatedAt: "2026-03-05T10:00:00Z" },
  { id: "c002b", name: "이수연", email: "suyeon.lee@fintech.co.kr", phone: "010-2345-6789", company: "핀테크솔루션", jobTitle: "CFO", postTitle: "핀테크 라이선스 취득 절차 총정리", postCategory: "투자정보", message: "전자금융업 라이선스 취득 요건과 소요 기간에 대해 문의드립니다. 현재 내부적으로 검토 중인 단계입니다.", status: "COMPLETED", adminMemo: "관련 법무팀 연결 완료. 2/20 답변 발송.", createdAt: "2026-02-18T11:00:00Z", updatedAt: "2026-02-20T16:00:00Z" },
  { id: "c003", name: "박준혁", email: "junhyuk.park@healthtech.kr", phone: "010-3456-7890", company: "헬스케어이노베이션", jobTitle: "CTO", postTitle: "헬스케어 스타트업 엑셀러레이터 프로그램 가이드", postCategory: "투자정보", message: "저희 회사가 헬스케어 AI 솔루션을 개발 중인데, 엑셀러레이터 프로그램 지원 자격 요건과 선발 과정에 대해 더 자세히 알고 싶습니다.", status: "COMPLETED", adminMemo: "3/3 전화 상담 완료. 프로그램 지원서 안내 이메일 발송 완료.", createdAt: "2026-03-03T11:05:00Z", updatedAt: "2026-03-03T16:30:00Z" },
  { id: "c003b", name: "박준혁", email: "junhyuk.park@healthtech.kr", phone: "010-3456-7890", company: "헬스케어이노베이션", jobTitle: "CTO", postTitle: "의료 AI 스타트업 규제 샌드박스 활용 가이드", postCategory: "인사이트", message: "의료기기 AI 소프트웨어 허가 절차와 규제 샌드박스를 통한 임상 데이터 수집 방법에 대해 문의드립니다.", status: "COMPLETED", adminMemo: "1/25 이메일 답변 완료.", createdAt: "2026-01-23T13:00:00Z", updatedAt: "2026-01-25T10:00:00Z" },
  { id: "c004", name: "최지은", email: "jieun.choi@esginvest.com", phone: "010-4567-8901", company: "ESG인베스트먼트", jobTitle: "투자팀장", postTitle: "ESG 경영 도입 사례와 투자자 설득 전략", postCategory: "인사이트", message: "ESG 평가 기준과 실제 투자 심사 시 중점적으로 보는 항목이 무엇인지 궁금합니다. 포트폴리오 기업들에게 ESG 가이드라인을 제시하려고 합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T08:30:00Z", updatedAt: "2026-03-05T08:30:00Z" },
  { id: "c005", name: "정승우", email: "seungwoo.jung@saas.io", phone: "010-5678-9012", company: "클라우드SaaS", jobTitle: "세일즈 디렉터", postTitle: "B2B SaaS 기업의 ARR 성장 전략", postCategory: "인사이트", message: "현재 ARR 5억 수준에서 다음 단계로 성장하기 위한 영업 전략과 파트너십 구축 방법에 대해 실질적인 조언을 원합니다.", status: "IN_PROGRESS", adminMemo: "담당자 배정 완료. 초기 자료 수집 중.", createdAt: "2026-03-04T16:45:00Z", updatedAt: "2026-03-05T09:00:00Z" },
  { id: "c006", name: "한나영", email: "nayoung.han@ailab.kr", phone: "010-6789-0123", company: "AI연구소", jobTitle: "연구원", postTitle: "2025 AI 스타트업 투자 현황과 전망", postCategory: "투자정보", message: "AI 분야 스타트업으로서 투자 유치 시 기술 평가 기준과 데모데이 발표 팁에 대해 알고 싶습니다.", status: "COMPLETED", adminMemo: "이메일로 자료 전달 완료. 후속 상담 불필요.", createdAt: "2026-03-02T13:20:00Z", updatedAt: "2026-03-02T17:00:00Z" },
  { id: "c007", name: "오재현", email: "jaehyun.oh@globalvc.com", phone: "010-7890-1234", company: "글로벌벤처캐피탈", jobTitle: "심사역", postTitle: "글로벌 스타트업 네트워킹 이벤트 안내", postCategory: "이벤트", message: "이벤트 참가 기업 선발 기준과 VC와의 1:1 매칭 방식에 대해 상세히 알고 싶습니다. 저희 포트폴리오 기업들도 참여시키고 싶습니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T07:55:00Z", updatedAt: "2026-03-05T07:55:00Z" },
  { id: "c008", name: "임서현", email: "seohyun.lim@accel.kr", phone: "010-8901-2345", company: "어클레러레이터K", jobTitle: "프로그램 매니저", postTitle: "스타트업 엑셀러레이터 선발 기준 공개", postCategory: "공지사항", message: "프로그램 지원 서류 양식과 심사 일정 관련하여 추가 문의드립니다.", status: "CANCELLED", adminMemo: "문의자가 직접 취소 요청.", createdAt: "2026-03-01T10:10:00Z", updatedAt: "2026-03-01T11:00:00Z" },
  { id: "c009", name: "강민서", email: "minseo.kang@gov.kr", phone: "010-9012-3456", company: "중소벤처기업부", jobTitle: "사무관", postTitle: "2025 스타트업 정부 지원 정책 총정리", postCategory: "인사이트", message: "정책 내용 중 일부 해석에 대한 공식 입장이 필요합니다. 자료 인용 허가 관련해서도 문의드립니다.", status: "IN_PROGRESS", adminMemo: "법무팀 검토 의뢰 중.", createdAt: "2026-03-04T09:30:00Z", updatedAt: "2026-03-04T15:00:00Z" },
  { id: "c010", name: "윤지호", email: "jiho.yoon@demo.io", phone: "010-0123-4567", company: "데모데이랩", jobTitle: "대표", postTitle: "IR 피칭 완벽 가이드: 투자자를 설득하는 법", postCategory: "인사이트", message: "IR 자료 첨삭 및 피칭 연습 프로그램이 있는지 궁금합니다. 다음 달 데모데이를 앞두고 준비 중입니다.", status: "COMPLETED", adminMemo: "피칭 클리닉 일정 안내 완료. 3/10 참가 확정.", createdAt: "2026-03-01T14:00:00Z", updatedAt: "2026-03-02T10:00:00Z" },
  { id: "c011", name: "송예린", email: "yerin.song@scaleup.kr", phone: "010-1111-2222", company: "스케일업파트너스", jobTitle: "파트너", postTitle: "해외 진출 스타트업의 글로벌 네트워킹 전략", postCategory: "네트워킹", message: "동남아 시장 진출을 위한 현지 파트너 연결 서비스가 있는지 문의합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T11:00:00Z", updatedAt: "2026-03-05T11:00:00Z" },
  { id: "c012", name: "황태양", email: "taeyang.hwang@crypto.io", phone: "010-2222-3333", company: "크립토벤처", jobTitle: "COO", postTitle: "블록체인 스타트업 규제 대응 가이드", postCategory: "인사이트", message: "가상자산 관련 라이선스 취득 절차와 관련 법인 설립 시 주의사항에 대해 전문가 상담을 원합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T10:45:00Z", updatedAt: "2026-03-05T10:45:00Z" },
];

function load(): Consultation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  return [...SEED_DATA];
}

function save(data: Consultation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAllConsultations(): Consultation[] {
  return load();
}

export function updateConsultation(id: string, updates: Partial<Consultation>): void {
  const data = load();
  const idx = data.findIndex((c) => c.id === id);
  if (idx === -1) return;
  data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
  save(data);
}

export function getPendingConsultationCount(): number {
  try {
    return load().filter((c) => c.status === "PENDING").length;
  } catch {
    return 0;
  }
}
