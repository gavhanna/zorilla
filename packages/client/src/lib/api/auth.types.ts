// User types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

// Auth response with token
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
