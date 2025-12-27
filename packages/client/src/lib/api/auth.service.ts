import { api } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from './auth.types';

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', userData);
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  /**
   * Logout (client-side only, removes token)
   */
  logout: () => {
    localStorage.removeItem('auth_token');
  },

  /**
   * Save auth token to localStorage
   */
  saveToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  /**
   * Get auth token from localStorage
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
