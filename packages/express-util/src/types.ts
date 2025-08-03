export interface DataWithTokensResult<T> {
  data: T;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthConfig {
  baseUrl: string;
  endpoints: {
    refresh: string;
    refreshApi: string;
  };
}
