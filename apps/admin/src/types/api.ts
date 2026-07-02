import type { AuthProvider, CompanyType } from "./user";

// Signup request payload
export interface SignupRequest {
  email: string;
  password?: string; // EMAIL provider only
  provider: AuthProvider;
  snsAccessToken?: string; // SNS providers only
  nickname: string;
  realName: string;
  companyType: CompanyType;
  companyName: string;
  position: string;
  jobCategory: string;
  marketingConsent: boolean;
}

// Signup response
export interface SignupResponse {
  success: boolean;
  message: string;
  userId?: string;
}

// User filter params for admin page
export interface UserFilterParams {
  companyType?: CompanyType | "ALL";
  companyName?: string;
  position?: string;
  jobCategory?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
