export const getPasswordStrength = (pass: string) => {
  if (pass.length === 0) return { color: 'transparent', text: '', icon: '' };
  
  const hasLength = pass.length >= 8;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

  if (hasLength && hasSpecial) {
    return { color: '#1B5E20', text: 'Strong Password', icon: 'check-circle' };
  } else if (hasLength) {
    return { color: '#F57C00', text: 'Weak: Add a special character (!@#$)', icon: 'alert-circle' };
  } else {
    return { color: '#D32F2F', text: 'Too short: Must be 8+ characters', icon: 'close-circle' };
  }
};

export const sanitizePhoneNumber = (text: string): string => {
  return text.replace(/[^0-9]/g, '');
};