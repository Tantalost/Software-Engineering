import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { authService } from '../services/auth.service';
import { AuthMode, ResetStep, UserData } from '../types/auth.types';

export type RegisterStep = 'landing' | 'email_entry' | 'otp_verify' | 'personal_info' | 'create_mpin';
export type LoginStep = 'email' | 'mpin';

export const useAuthForm = (onLoginSuccess: (user: UserData) => void) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('landing');
  const [loginStep, setLoginStep] = useState<LoginStep>('email');
  const [isReactivating, setIsReactivating] = useState(false);
  
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
        setLoginStep('mpin');
      }
    };
    checkSavedDevice();
  }, []);

  const handleUnlinkDevice = async () => {
    await AsyncStorage.removeItem('linked_email');
    setForm(prev => ({ ...prev, email: '', mpin: '' }));
    setIsDeviceLinked(false);
    setLoginStep('email');
  };

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetFormState = (clearEmail = false) => {
    setForm(prev => ({ 
        email: clearEmail ? '' : prev.email, 
        mpin: '', confirmMpin: '', 
        firstName: '', middleName: '', lastName: '', suffix: '', 
        contactNo: '', otp: '', agreedToTerms: false 
    }));
    if (clearEmail) setLoginStep('email');
  };

  const handleNextLoginStep = () => {
    if (!form.email) return Alert.alert("Error", "Please enter your email address.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return Alert.alert("Error", "Please enter a valid email address.");
    setLoginStep('mpin');
  };

  const registerForPushNotificationsAsync = async (userId: string) => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B5E20',
      });
    }
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await authService.savePushToken({ userId, expoPushToken: token });
      } catch (e) {
        console.log("Error getting push token:", e);
      }
    }
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

  const handleVerifyRegistrationOtp = () => {
    if (!form.otp || form.otp.length !== 4) {
        return Alert.alert("Error", "Please enter the 4-digit verification code sent to your email.");
    }
    setRegisterStep('personal_info');
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
            await AsyncStorage.setItem('linked_email', form.email); 
            
            await registerForPushNotificationsAsync(userData.id);
            onLoginSuccess(userData);
        } catch (error: any) {
            if (error.message?.toLowerCase().includes("deactivated") || error.isDeactivated) {
               Alert.alert(
                 "Account Deactivated", 
                 "Your account is currently deactivated. Would you like to reactivate it?",
                 [
                   { text: "Cancel", style: "cancel" },
                   { text: "Reactivate", onPress: async () => {
                       setLoading(true);
                       try {
                         await authService.reactivateRequest({ email: form.email });
                         setIsReactivating(true);
                         setResetStep('verify-otp');
                         setAuthMode('forgot-password'); 
                         Alert.alert("Sent", "A reactivation code has been sent to your email.");
                       } catch(e: any) { 
                         Alert.alert("Error", e.message); 
                       } finally {
                         setLoading(false);
                       }
                   }}
                 ]
               );
            } else {
               Alert.alert("Error", error.message);
            }
        } finally {
            setLoading(false);
        }
        return; 
    }

    if (authMode === 'register') {
        const isMpinValid = /^\d{4}$/.test(form.mpin);
        const isMatch = form.mpin === form.confirmMpin;

        if (!form.firstName || !form.lastName || !form.contactNo) return Alert.alert("Error", "Please fill all required personal information fields.");
        
        const pureNumber = form.contactNo.replace(/\D/g, '');
        if (pureNumber.length !== 10) return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
        if (!isMpinValid) return Alert.alert("Invalid MPIN", "Your MPIN must be exactly 4 digits.");
        if (!isMatch) return Alert.alert("Error", "MPINs do not match.");

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

            await authService.register(payload);
            await AsyncStorage.setItem('linked_email', form.email); 
            setIsDeviceLinked(true); 
            
            Alert.alert("Success", "Account created successfully! Please log in with your new MPIN.");
            setAuthMode('login');
            setRegisterStep('landing');
            setLoginStep('mpin');
            resetFormState(false); 
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
        setIsReactivating(false);
        Alert.alert("Success", "A verification code has been sent to your email.");
        setResetStep('verify-otp');
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
      if (!form.otp || form.otp.length !== 4) return Alert.alert("Error", "Please enter the 4-digit verification code sent to your email.");
      
      if (isReactivating) {
          setLoading(true);
          try {
              await authService.reactivateConfirm({ email: form.email, otp: form.otp });
              Alert.alert("Success", "Account reactivated! You can now log in.");
              setIsReactivating(false);
              setAuthMode('login');
              setResetStep('request');
              setLoginStep('mpin');
              resetFormState(false);
          } catch (error: any) {
              Alert.alert("Error", error.message);
          } finally {
              setLoading(false);
          }
      } else {
          setResetStep('reset-password');
      }
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
        setLoginStep('mpin');
        resetFormState(false);
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
    loginStep, setLoginStep, handleNextLoginStep, 
    isReactivating, setIsReactivating,
    loading, setLoading,
    form, updateForm, resetFormState,
    isDeviceLinked, handleUnlinkDevice,
    handleAuth, handleSendRegistrationOtp, handleVerifyRegistrationOtp, 
    handleRequestReset, handleVerifyOtp, handleFinalReset
  };
};