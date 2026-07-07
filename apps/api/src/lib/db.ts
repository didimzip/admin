import fs from "fs";
import path from "path";
import type { Banner, Post } from "@didimzip/api";
import { seedBanners, seedPosts } from "./seed";

// ─── Mock 영속 계층 (JSON 파일) ──────────────────────────────────────────────
//
// 실백엔드(PostgreSQL) 전환 시 이 파일과 repository 구현만 교체하면 된다.
// Route Handler / Client / admin / web 코드는 수정 불필요.

export interface DbShape {
  posts: Post[];
  banners: Banner[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function ensureDb(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbShape = { posts: seedPosts(), banners: seedBanners() };
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
    if (!parsed.banners) {
      parsed.banners = seedBanners();
      changed = true;
    }
    const db = parsed as DbShape;
    if (changed) writeDb(db);
    return db;
  } catch {
    return { posts: [], banners: [] };
  }
}

export function writeDb(db: DbShape): void {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
