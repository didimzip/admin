// Auth provider
export type AuthProvider = "EMAIL" | "GOOGLE" | "KAKAO" | "NAVER";

// User role
export type UserRole = "MEMBER" | "ADMIN";

// Auth verification status
export type AuthStatus = "NONE" | "PENDING" | "VERIFIED";

// Member status
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";

// Company / member type (회원 유형)
export type CompanyType = "스타트업" | "투자사" | "공공기관" | "전문직" | "기타" | "일반 회원";

// Document type for verification
export type DocType = "BIZ_REG" | "CARD";

// Document verification status
export type DocStatus = "PENDING" | "APPROVED" | "REJECTED";

// Users table
export interface User {
  id: string;
  email: string;
  password: string; // hashed
  provider: AuthProvider;
  role: UserRole;
  authStatus: AuthStatus;
  createdAt: string;
  updatedAt: string;
}

// Profiles table
export interface Profile {
  userId: string;
  nickname: string;
  realName: string;
  companyType: CompanyType;
  companyName: string;
  position: string;
  jobCategory: string;
  hasBadge: boolean;
  marketingConsent: boolean;
}

// Documents table
export interface Document {
  id: string;
  userId: string;
  fileUrl: string;
  docType: DocType;
  uploadedAt: string;
  status: DocStatus;
}

// Combined view for admin user list (Users + Profiles join)
export interface UserWithProfile {
  id: string;
  email: string;
  provider: AuthProvider;
  role: UserRole;
  authStatus: AuthStatus;
  status: MemberStatus;
  createdAt: string;
  lastActivityAt: string;
  nickname: string;
  realName: string;
  companyType: CompanyType;
  companyName: string;
  position: string;
  jobCategory: string;
  hasBadge: boolean;
  suspendedReason?: string;
  documents?: Array<{
    fileUrl: string;
    docType: DocType;
    status: DocStatus;
    uploadedAt: string;
  }>;
}
