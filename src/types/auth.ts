export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // seconds
  user: AuthUser;
}
