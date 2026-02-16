import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { getPasswordStrength } from '../utils/validation';
import { AuthMode, ResetStep, UserData } from '../types/auth.types';

export const useAuthForm = (onLoginSuccess: (user: UserData) => void) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [loading, setLoading] = useState(false);
  

  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    username: '', 
    contactNo: '',
    otp: '' 
  });

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetFormState = () => {
    setForm(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
  };

  const validateRegister = () => {
    const strength = getPasswordStrength(form.password);
    const isPasswordValid = strength.text === 'Strong Password';
    const isMatch = form.password === form.confirmPassword;

    if (!form.username || !form.contactNo) {
        Alert.alert("Error", "Please fill all fields");
        return false;
    }
    if (!isPasswordValid) {
        Alert.alert("Weak Password", "Password must be at least 8 characters and !@#$%^&* special characters.");
        return false;
    }
    if (!isMatch) {
        Alert.alert("Error", "Passwords do not match.");
        return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!form.email || !form.password) return Alert.alert("Error", "Please fill all fields");
    
    if (authMode === 'register') {
        if (!validateRegister()) return;
    }

    setLoading(true);
    try {
        let data;
        if (authMode === 'register') {
            data = await authService.register({ ...form, contactNo: `+63${form.contactNo}` });
        } else {
            data = await authService.login({ email: form.email, password: form.password });
        }

        if (data.token) await AsyncStorage.setItem('ibt_token', data.token);
        
        const userData = data.user;
        await AsyncStorage.setItem('ibt_user', JSON.stringify(userData));
        onLoginSuccess(userData);

    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!form.email) return Alert.alert("Error", "Please enter your email address.");

    setLoading(true);
    try {
        await authService.requestPasswordReset({ email: form.email });
        Alert.alert("Success", "A verification code has been sent to your email.");
        setResetStep('verify-otp');
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtpLocal = () => {
      if (!form.otp || form.otp.length < 4) {
          return Alert.alert("Error", "Please enter the verification code sent to your email.");
      }
      setResetStep('reset-password');
  };

  const handleFinalReset = async () => {
    const strength = getPasswordStrength(form.password);
    const isPasswordValid = strength.text === 'Strong Password';
    const isMatch = form.password === form.confirmPassword;

    if (!form.password || !form.confirmPassword) return Alert.alert("Error", "Please fill in the new password fields.");
    if (!isPasswordValid) return Alert.alert("Weak Password", "Password must be at least 8 characters and !@#$%^&* special characters.");
    if (!isMatch) return Alert.alert("Error", "Passwords do not match.");

    setLoading(true);
    try {
        await authService.resetPassword({ email: form.email, otp: form.otp, newPassword: form.password });
        Alert.alert("Success", "Password reset successfully! Please login.");
        
        setAuthMode('login');
        setResetStep('request');
        resetFormState();
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  return {
    authMode, setAuthMode,
    resetStep, setResetStep,
    loading,
    form, updateForm, resetFormState,
    handleAuth,
    handleRequestReset,
    handleVerifyOtpLocal,
    handleFinalReset
  };
};