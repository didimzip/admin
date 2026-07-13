import { authorsApi } from "@didimzip/api";
import { getAllAdmins } from "./auth-store";

// ─── 작성자 신원 동기화 (admin 계정 → 공유 Authors 테이블) ─────────────────────
//
// admin 계정(작성자)은 브라우저 localStorage 에 있어 web 이 직접 읽지 못한다.
// 그래서 최신 이름(닉네임)을 공유 API(Authors)로 upsert 해 두면, web 은 콘텐츠의
// authorId 로 이 테이블을 조회해 항상 최신 작성자명을 표시한다.
// → 관리자에서 닉네임을 바꾸면 그 사람이 쓴 모든 콘텐츠에 즉시 반영된다.
//
// profileImage 는 현재 admin 계정에 필드가 없어 전송하지 않는다(서버 기존값 보존).
// 추후 계정에 프로필 이미지가 생기면 여기서 함께 upsert 하면 web 에 그대로 반영된다.
export async function syncAuthorsFromAdmins(): Promise<void> {
  try {
    const admins = getAllAdmins();
    if (admins.length === 0) return;
    await authorsApi.upsert(admins.map((a) => ({ id: a.id, nickname: a.name })));
  } catch {
    // 동기화 실패는 화면 동작에 영향을 주지 않는다(다음 로드/변경 시 재시도).
  }
}
