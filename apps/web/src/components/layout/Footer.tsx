import { footerApi, type FamilySite, type FooterSettings } from "@didimzip/api";
import MenuDropdown from "@/components/ui/MenuDropdown";
import Logo from "./Logo";

// Footer: Admin(시스템 설정 > Footer 설정 / 관련 사이트 관리) → API → Web.
// ✦ 서버 컴포넌트로 데이터를 조회(SSR)해 "항상 완전한 레이아웃"으로 렌더한다.
//   (클라이언트 useEffect fetch 방식은 로딩 전 settings=null 상태의 미완성 푸터가 잠깐 보였다.
//    또한 루트 레이아웃에 배치되어 페이지 이동 시 리마운트/리페치가 없다.)
const BODY = "text-[14px] leading-relaxed"; // 본문 14px/400/#E1E2E3

async function loadFooter(): Promise<{ settings: FooterSettings | null; sites: FamilySite[] }> {
  try {
    const [settings, sites] = await Promise.all([
      footerApi.getSettings().catch(() => null),
      footerApi.listFamilySites({ visible: true }).catch(() => [] as FamilySite[]),
    ]);
    return { settings, sites };
  } catch {
    return { settings: null, sites: [] };
  }
}

export default async function Footer() {
  const { settings, sites } = await loadFooter();

  return (
    <footer className="w-full text-[#E1E2E3]" style={{ background: "#333333" }}>
      {/* 사이트 공통 컨테이너(헤더·본문·광고 배너와 동일: max-w-[1200px] mx-auto px-6) */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-[60px]">
        {/* Row 1: Logo */}
        <Logo size={28} className="text-white" />

        {/* Row 2: 회사정보(left) ↔ 관련 사이트(right) */}
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          {settings && (
            <div className={`flex flex-col gap-2 font-normal ${BODY}`}>
              <p>
                <span>{settings.companyName}</span>
                <Sep />
                <span>대표자: {settings.ceo}</span>
                <Sep />
                <span>사업자등록번호: {settings.bizNumber}</span>
              </p>
              <p>
                <span>주소: {settings.address}</span>
                <Sep />
                <span>고객지원 문의: {settings.customerEmail}</span>
              </p>
              <p>고객지원: {settings.operatingHours}</p>
            </div>
          )}

          {/* 관련 사이트(패밀리 사이트) — 공통 MenuDropdown(클라이언트 자식), Admin 관리 데이터 연결 */}
          <div className="shrink-0">
            <MenuDropdown
              label="관련 사이트"
              openUp
              emptyText="등록된 사이트가 없습니다"
              items={sites.map((s) => ({ label: s.name, href: s.url, newTab: s.newTab }))}
            />
          </div>
        </div>

        {/* Row 3: Copyright */}
        <p className="mt-8 text-[12px] text-[#E1E2E3]/40 md:text-[13px]">
          {settings?.copyright ?? ""}
        </p>
      </div>
    </footer>
  );
}

function Sep() {
  return <span className="mx-2 text-[#E1E2E3]/30">|</span>;
}
