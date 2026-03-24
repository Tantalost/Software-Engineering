import API_URL from '../config'; 

interface LoginPayload { 
    email: string; 
    mpin: string; 
}

interface SendOtpPayload { 
    email: string; 
}

interface RegisterPayload { 
    email: string; 
    otp: string;
    mpin: string; 
    firstName: string; 
    middleName: string; 
    lastName: string; 
    suffix: string; 
    contactNo: string; 
}

interface ResetRequestPayload { 
    email: string; 
}

interface ResetConfirmPayload { 
    email: string; 
    otp: string; 
    newMpin: string; 
}

export const authService = {
  
  login: async (payload: LoginPayload) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Authentication Failed");
    return data;
  },

  sendRegistrationOtp: async (payload: SendOtpPayload) => {
    const res = await fetch(`${API_URL}/auth/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP");
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) 
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration Failed");
    return data;
  },

  requestPasswordReset: async (payload: ResetRequestPayload) => {
    const res = await fetch(`${API_URL}/auth/forgot-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("BACKEND CRASH REPORT:", errorText);
      try {
        const parsedData = JSON.parse(errorText);
        throw new Error(parsedData.error || "Failed to send reset code");
      } catch (e) {
        throw new Error("Server crashed or endpoint not found. Check console.");
      }
    }
    return await res.json();
  },

  resetPassword: async (payload: ResetConfirmPayload) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset MPIN");
    return data;
  },

  changePassword: async (payload: any) => {
    const res = await fetch(`${API_URL}/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to change code");
    return data;
  },

  deactivateAccount: async (payload: any) => {
    const res = await fetch(`${API_URL}/auth/deactivate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to deactivate");
    return data;
  },
  reactivateRequest: async (payload: any) => {
    const res = await fetch(`${API_URL}/auth/reactivate-request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to request reactivation");
    return data;
  },
  reactivateConfirm: async (payload: any) => {
    const res = await fetch(`${API_URL}/auth/reactivate-confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reactivate");
    return data;
  }
};