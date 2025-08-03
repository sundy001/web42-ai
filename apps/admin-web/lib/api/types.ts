export interface ApiError {
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
