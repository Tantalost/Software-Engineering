
export interface UserData {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contact: string;
  avatarUrl?: string;
  token?: string;
}

export type AuthMode = 'login' | 'register' | 'forgot-password';

export type ResetStep = 'request' | 'verify-otp' | 'reset-password';