import {
  footerApi,
  type FamilySite,
  type FamilySiteInput,
  type FooterSettings,
  type FooterSettingsInput,
} from "@didimzip/api";

// ─── Footer 스토어 (API 기반) ─────────────────────────────────────────────────
//
// Footer 회사정보(단일 레코드) + 관련 사이트(패밀리 사이트, save-all)를
// 공유 Mock API(@didimzip/api)로 관리한다. 실백엔드 전환 시에도 admin 화면
// 코드는 무수정 (API Client/Repository만 교체).

export type { FamilySite, FooterSettings };

export async function getFooterSettings(): Promise<FooterSettings> {
  return footerApi.getSettings();
}

export async function saveFooterSettings(
  input: FooterSettingsInput,
): Promise<FooterSettings> {
  return footerApi.updateSettings(input);
}

export async function getFamilySites(): Promise<FamilySite[]> {
  return footerApi.listFamilySites();
}

/** 전체 관련 사이트를 배열 순서대로 교체 저장 (Admin save-all, 순서=배열 위치). */
export async function saveFamilySites(
  sites: FamilySiteInput[],
): Promise<FamilySite[]> {
  return footerApi.saveFamilySites(sites);
}
