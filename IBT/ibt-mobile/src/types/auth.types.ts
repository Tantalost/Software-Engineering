export interface UserData {
  id: string;
  name: string;
  email: string;
  contact: string;
}

export type AuthMode = 'login' | 'register' | 'forgot-password';

export type ResetStep = 'request' | 'verify-otp' | 'reset-password';