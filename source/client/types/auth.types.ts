export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  username: string;
}

export interface UserDetailResponse {
  userId: string;
  email: string;
  username: string;
}
