import type { CombinedUser } from "../users/types.js";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: CombinedUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export interface SignoutRequest {
  access_token: string;
}

export interface SignoutResponse {
  message: string;
}
