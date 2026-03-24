import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';

import { AuthMode, ResetStep, UserData } from '../types/auth.types';

export type RegisterStep = 'landing' | 'email_entry' | 'otp_verify' | 'personal_info' | 'create_mpin';

export const useAuthForm = (onLoginSuccess: (user: UserData) => void) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('landing');
  
  const [loading, setLoading] = useState(false);
  const [isDeviceLinked, setIsDeviceLinked] = useState(false);

  const [form, setForm] = useState({ 
    email: '', 
    mpin: '', 
    confirmMpin: '', 
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNo: '',
    otp: '',
    agreedToTerms: false
  });


  useEffect(() => {
    const checkSavedDevice = async () => {
      const savedEmail = await AsyncStorage.getItem('linked_email');
      if (savedEmail) {
        setForm(prev => ({ ...prev, email: savedEmail }));
        setIsDeviceLinked(true);
      }
    };
    checkSavedDevice();
  }, []);

  const handleUnlinkDevice = async () => {
    await AsyncStorage.removeItem('linked_email');
    setForm(prev => ({ ...prev, email: '', mpin: '' }));
    setIsDeviceLinked(false);
  };

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetFormState = () => {
    setForm({ 
        email: isDeviceLinked ? form.email : '', // Preserve email if linked
        mpin: '', confirmMpin: '', 
        firstName: '', middleName: '', lastName: '', suffix: '', 
        contactNo: '', otp: '', agreedToTerms: false 
    });
  };

  const handleSendRegistrationOtp = async () => {
    if (!form.email) return Alert.alert("Error", "Please enter your email address.");
    if (!form.agreedToTerms) return Alert.alert("Error", "You must agree to the Terms and Conditions.");
    
    setLoading(true);
    try {
        await authService.sendRegistrationOtp({ email: form.email });
        setRegisterStep('otp_verify'); 
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAuth = async () => {
    
    if (authMode === 'login') {
        if (!form.email || !form.mpin) return Alert.alert("Error", "Please fill all fields");
        if (form.mpin.length !== 4) return Alert.alert("Error", "MPIN must be exactly 4 digits");
        
        setLoading(true);
        try {
            const data = await authService.login({ email: form.email, mpin: form.mpin });
            if (data.token) await AsyncStorage.setItem('token', data.token);
            const userData = { ...data.user, token: data.token };
            
            await AsyncStorage.setItem('ibt_user', JSON.stringify(userData));
            await AsyncStorage.setItem('linked_email', form.email); // Remember device
            
            onLoginSuccess(userData);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
        return; 
    }

    if (authMode === 'register') {
        const isMpinValid = /^\d{4}$/.test(form.mpin);
        const isMatch = form.mpin === form.confirmMpin;

        if (!form.firstName || !form.lastName || !form.contactNo) {
            return Alert.alert("Error", "Please fill all required personal information fields.");
        }

        const pureNumber = form.contactNo.replace(/\D/g, '');
        if (pureNumber.length !== 10) {
            return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number (e.g., 912 345 6789).");
        }

        if (!isMpinValid) {
            return Alert.alert("Invalid MPIN", "Your MPIN must be exactly 4 digits.");
        }
        
        if (!isMatch) {
            return Alert.alert("Error", "MPINs do not match.");
        }

        setLoading(true);
        try {
            const payload = {
                email: form.email,
                otp: form.otp, 
                mpin: form.mpin,
                firstName: form.firstName,
                middleName: form.middleName,
                lastName: form.lastName,
                suffix: form.suffix,
                contactNo: `+63${pureNumber}`
            };

            const data = await authService.register(payload);
            
            if (data.token) await AsyncStorage.setItem('token', data.token);
            const userData = { ...data.user, token: data.token };
            
            await AsyncStorage.setItem('ibt_user', JSON.stringify(userData));
            await AsyncStorage.setItem('linked_email', form.email); // Remember device
            
            Alert.alert("Success", "Account created successfully!");
            onLoginSuccess(userData); 
            
        } catch (error: any) {
            Alert.alert("Registration Failed", error.message);
        } finally {
            setLoading(false);
        }
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
    const isMpinValid = /^\d{4}$/.test(form.mpin);
    const isMatch = form.mpin === form.confirmMpin;

    if (!form.mpin || !form.confirmMpin) return Alert.alert("Error", "Please fill in the new MPIN fields.");
    if (!isMpinValid) return Alert.alert("Invalid MPIN", "Your MPIN must be exactly 4 digits.");
    if (!isMatch) return Alert.alert("Error", "MPINs do not match.");

    setLoading(true);
    try {
        await authService.resetPassword({ email: form.email, otp: form.otp, newMpin: form.mpin });
        Alert.alert("Success", "MPIN reset successfully! Please login.");
        
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
    registerStep, setRegisterStep,
    resetStep, setResetStep,
    loading, setLoading,
    form, updateForm, resetFormState,
    isDeviceLinked, handleUnlinkDevice,
    handleAuth,
    handleSendRegistrationOtp, 
    handleRequestReset,
    handleVerifyOtpLocal,
    handleFinalReset
  };
};