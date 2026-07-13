import fs from "fs";
import path from "path";
import type { Author, Banner, Category, FamilySite, FooterSettings, Post } from "@didimzip/api";
import {
  seedAuthors,
  seedBanners,
  seedCategories,
  seedFamilySites,
  seedFooterSettings,
  seedPosts,
} from "./seed";

// ─── Mock 영속 계층 (JSON 파일) ──────────────────────────────────────────────
//
// 실백엔드(PostgreSQL) 전환 시 이 파일과 repository 구현만 교체하면 된다.
// Route Handler / Client / admin / web 코드는 수정 불필요.

export interface DbShape {
  posts: Post[];
  authors: Author[];
  banners: Banner[];
  categories: Category[];
  footerSettings: FooterSettings;
  familySites: FamilySite[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function ensureDb(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbShape = {
      posts: seedPosts(),
      authors: seedAuthors(),
      banners: seedBanners(),
      categories: seedCategories(),
      footerSettings: seedFooterSettings(),
      familySites: seedFamilySites(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function readDb(): DbShape {
  ensureDb();
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as Partial<DbShape>;
    // 기존 db.json 에 banners 가 없으면 seed 로 백필
    let changed = false;
    if (!parsed.posts) {
      parsed.posts = seedPosts();
      changed = true;
    }
    // 작성자 신원 테이블 백필 (기존 db.json 에 authors 가 없으면 시드로 생성)
    if (!parsed.authors) {
      parsed.authors = seedAuthors();
      changed = true;
    }
    if (!parsed.banners) {
      parsed.banners = seedBanners();
      changed = true;
    }
    // 레거시 position(문자열) → positions(배열) 마이그레이션 (기존 데이터 무손실)
    if (parsed.banners) {
      for (const b of parsed.banners as unknown as Array<Record<string, unknown>>) {
        if (!Array.isArray(b.positions)) {
          b.positions = b.position ? [b.position] : [];
          delete b.position;
          changed = true;
        }
        // 유료 광고 여부(isPaid) 백필 — 기존 배너는 모두 false
        if (typeof b.isPaid !== "boolean") {
          b.isPaid = false;
          changed = true;
        }
      }
    }
    if (!parsed.categories) {
      parsed.categories = seedCategories();
      changed = true;
    }
    if (!parsed.footerSettings) {
      parsed.footerSettings = seedFooterSettings();
      changed = true;
    }
    if (!parsed.familySites) {
      parsed.familySites = seedFamilySites();
      changed = true;
    }
    const db = parsed as DbShape;
    if (changed) writeDb(db);
    return db;
  } catch {
    return {
      posts: [],
      authors: seedAuthors(),
      banners: [],
      categories: [],
      footerSettings: seedFooterSettings(),
      familySites: seedFamilySites(),
    };
  }
}

export function writeDb(db: DbShape): void {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
