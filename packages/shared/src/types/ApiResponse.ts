export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  data: T;
  requestedAt: string;
}

export interface ErrorResponse {
  status: "error";
  message: string;
}

export interface ValidationErrorResponse {
  status: "fail";
  errors: string;
}
