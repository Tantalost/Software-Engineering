import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, TextInput as NativeTextInput, Pressable } from 'react-native';
import { Card, Text, TextInput, Button, Checkbox } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuthForm } from './hooks/AuthForm';
import { sanitizePhoneNumber } from './utils/validation';
import { UserData } from './types/auth.types';
import styles from './styles/LogForm';

const PinPad = ({ mpin, setMpin, label, isError, errorMessage }: { mpin: string, setMpin: (val: string) => void, label: string, isError?: boolean, errorMessage?: string }) => {
  const inputRef = React.useRef<NativeTextInput>(null);

  return (
    <View style={{ alignItems: 'center', marginVertical: 15, width: '100%' }}>
      <Text style={{ fontSize: 14, color: isError ? '#B00020' : 'grey', fontWeight: 'bold', marginBottom: 10 }}>{label}</Text>
      
      <Pressable style={{ flexDirection: 'row', gap: 20, padding: 10 }} onPress={() => inputRef.current?.focus()}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: mpin.length > i ? '#1B5E20' : 'transparent',
            borderWidth: 2,
            borderColor: isError ? '#B00020' : '#1B5E20'
          }} />
        ))}
      </Pressable>
      
      {isError && errorMessage && <Text style={{ color: '#B00020', fontSize: 12, marginTop: 5 }}>{errorMessage}</Text>}
      
      <NativeTextInput
        ref={inputRef}
        value={mpin}
        onChangeText={(t) => setMpin(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
        style={{ width: 0, height: 0, opacity: 0 }} 
        caretHidden={true}
        autoFocus={false}
      />
    </View>
  );
};

const RegistrationBreadcrumbs = ({ currentStep }: { currentStep: string }) => {
  const steps = [
    { id: 'email_entry', label: 'Email' },
    { id: 'otp_verify', label: 'Verify' },
    { id: 'personal_info', label: 'Profile' },
    { id: 'create_mpin', label: 'MPIN' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  if (currentIndex === -1) return null; 

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginBottom: 15 }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const color = isActive || isCompleted ? '#1B5E20' : '#E0E0E0';

        return (
          <React.Fragment key={step.id}>
            <View style={{ alignItems: 'center', width: 50 }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: isActive ? '#1B5E20' : (isCompleted ? '#E8F5E9' : '#F5F5F5'),
                borderWidth: 2, borderColor: color,
                justifyContent: 'center', alignItems: 'center', zIndex: 2
              }}>
                {isCompleted ? (
                  <Icon name="check" size={14} color="#1B5E20" />
                ) : (
                  <Text style={{ color: isActive ? 'white' : '#9E9E9E', fontSize: 11, fontWeight: 'bold' }}>{index + 1}</Text>
                )}
              </View>
              <Text style={{ fontSize: 10, color: isActive ? '#1B5E20' : (isCompleted ? '#1B5E20' : '#9E9E9E'), marginTop: 4, fontWeight: isActive ? 'bold' : 'normal', textAlign: 'center' }}>
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={{ flex: 1, maxWidth: 30, height: 2, backgroundColor: isCompleted ? '#1B5E20' : '#E0E0E0', marginBottom: 16, marginHorizontal: -5, zIndex: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

interface AuthScreenProps {
  onLoginSuccess: (user: UserData) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  
  const { 
    authMode, setAuthMode, resetStep, setResetStep, 
    registerStep, setRegisterStep, 
    loginStep, setLoginStep, handleNextLoginStep, 
    isReactivating, setIsReactivating, // <-- Hooked up new state
    loading, form, updateForm, resetFormState,
    isDeviceLinked, handleUnlinkDevice,
    handleAuth, handleSendRegistrationOtp, handleVerifyRegistrationOtp,
    handleRequestReset, handleVerifyOtp, handleFinalReset 
  } = useAuthForm(onLoginSuccess);

  const isMatch = form.mpin === form.confirmMpin;

  const getCardTitle = () => {
      if (authMode === 'login') return "Login to Apply";
      if (authMode === 'register') return "Create Account"; 
      if (authMode === 'forgot-password') {
          return resetStep === 'request' ? "Reset MPIN" : resetStep === 'verify-otp' ? "Enter Code" : "New MPIN";
      }
  };

  const renderRegisterFlow = () => {
    switch (registerStep) {
      case 'landing':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Icon name="store" size={80} color="#1B5E20" style={{ marginBottom: 20 }} />
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: "black"}}>Stall Application</Text>
            <Text style={{ textAlign: 'center', color: 'grey', marginBottom: 30, paddingHorizontal: 10 }}>
             Your gateway to easy and organized local stall applications.
            </Text>
            
            <Button mode="contained" onPress={() => setRegisterStep('email_entry')} style={[styles.button, { width: '100%' }]} textColor="#ffffff">
              Sign up
            </Button>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
              <Text style={{ color: 'grey' }}>Already a Member? </Text>
              <Button mode="text" compact onPress={() => { setAuthMode('login'); resetFormState(false); }} textColor="#1B5E20" labelStyle={{ fontWeight: 'bold' }}>
                Login here
              </Button>
            </View>
          </View>
        );

      case 'email_entry':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: 'black' }}>Let's Get Started!</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>To start, please enter your email address:</Text>
            
            <TextInput label="Email Address" value={form.email} onChangeText={(t) => updateForm('email', t)} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" activeOutlineColor="#1B5E20" textColor='#000000' />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 5 }}>
              {Platform.OS === 'ios' ? (
                 <Checkbox.IOS status={form.agreedToTerms ? 'checked' : 'unchecked'} onPress={() => updateForm('agreedToTerms', !form.agreedToTerms)} color="#1B5E20" />
              ) : (
                 <Checkbox.Android status={form.agreedToTerms ? 'checked' : 'unchecked'} onPress={() => updateForm('agreedToTerms', !form.agreedToTerms)} color="#1B5E20" />
              )}
              <Text style={{ flex: 1, fontSize: 13, color: 'grey', marginLeft: 5 }}>
                I agree with the <Text style={{ color: '#1B5E20', fontWeight: 'bold' }}>Terms and Conditions</Text> and <Text style={{ color: '#1B5E20', fontWeight: 'bold' }}>Privacy Policy</Text>.
              </Text>
            </View>

            <Button mode="contained" disabled={!form.email || !form.agreedToTerms} onPress={handleSendRegistrationOtp} style={styles.button} textColor="#ffffff">
              Next
            </Button>
            <Button mode="text" onPress={() => setRegisterStep('landing')} style={styles.switchButton} textColor="grey">
              Cancel
            </Button>
          </View>
        );

      case 'otp_verify':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: "black" }}>Enter Verification Code</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>Please enter the one-time code that we sent to {form.email}</Text>
            
            <TextInput label="OTP" value={form.otp} onChangeText={(t) => updateForm('otp', t)} mode="outlined" style={styles.input} keyboardType="number-pad" activeOutlineColor="#1B5E20" textColor='#000000' maxLength={4} />
            
            <Button mode="contained" onPress={handleVerifyRegistrationOtp} style={styles.button} textColor="#ffffff">
              Done
            </Button>
            
            <Button mode="text" onPress={() => setRegisterStep('email_entry')} style={styles.switchButton} textColor="grey">
              Back
            </Button>
          </View>
        );

      case 'personal_info':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: "black" }}>Personal Information</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>Please provide your accurate details.</Text>

            <TextInput label="First Name" value={form.firstName} onChangeText={(t) => updateForm('firstName', t)} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" textColor='#000000' />
            <TextInput label="Middle Name (Optional)" value={form.middleName} onChangeText={(t) => updateForm('middleName', t)} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" textColor='#000000' />
            <TextInput label="Last Name" value={form.lastName} onChangeText={(t) => updateForm('lastName', t)} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" textColor='#000000' />
            <TextInput label="Suffix (e.g., Jr., Sr., III) - Optional" value={form.suffix} onChangeText={(t) => updateForm('suffix', t)} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" textColor='#000000' />
            
            <View style={styles.phoneRow}>
                <View style={styles.prefixContainer}>
                    <Text style={styles.prefixText}>+63</Text></View>
               <TextInput 
                    label="Mobile Number" 
                    value={form.contactNo} 
                     onChangeText={(t) => { 
                        let cleaned = t.startsWith('0') ? t.substring(1) : t;
                        updateForm('contactNo', sanitizePhoneNumber(cleaned)); 
                    }} 
                    mode="outlined" 
                    style={[styles.input, styles.phoneInput]} 
                    textColor='#000000' 
                    keyboardType="numeric" 
                    maxLength={10} 
                    activeOutlineColor="#1B5E20" 
                    placeholder="9XX XXX XXXX" 
                />
            </View>

            <Button mode="contained" onPress={() => setRegisterStep('create_mpin')} style={styles.button} textColor="#ffffff">
              Next
            </Button>
            <Button mode="text" onPress={() => setRegisterStep('otp_verify')} style={styles.switchButton} textColor="grey">
              Back
            </Button>
          </View>
        );

      case 'create_mpin':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: "black"}}>Set your MPIN</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>Secure your account with a 4-digit code.</Text>

            <PinPad mpin={form.mpin} setMpin={(val) => updateForm('mpin', val)} label="Enter 4-Digit MPIN" />
            
            <PinPad mpin={form.confirmMpin} setMpin={(val) => updateForm('confirmMpin', val)} label="Confirm MPIN" isError={form.confirmMpin.length > 0 && !isMatch} errorMessage="MPINs do not match" />

            <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button} textColor="#ffffff">
              Complete Sign Up
            </Button>
            <Button mode="text" onPress={() => setRegisterStep('personal_info')} style={styles.switchButton} textColor="grey">
              Back
            </Button>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {!(authMode === 'register') && (
                <>
                    <Icon name="store" size={80} color="#1B5E20" style={styles.icon} />
                    <Text variant="headlineMedium" style={styles.title}>Stall Application</Text>
                </>
            )}

            <Card style={[styles.card, (authMode === 'register' && registerStep === 'landing') ? { elevation: 0, backgroundColor: 'transparent' } : {}]}>
                
                {authMode !== 'register' && (
                    <Text variant="titleLarge" style={styles.cardTitle}>{getCardTitle()}</Text>
                )}

                {authMode === 'forgot-password' ? (
                    <View>
                        {resetStep === 'request' && (
                            <>
                                <Text style={styles.desc}>Enter your email address to receive a verification code.</Text>
                                <TextInput label="Email Address" value={form.email} onChangeText={(t) => updateForm('email', t)} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" activeOutlineColor="#1B5E20" textColor='#000000' />
                                <Button mode="contained" onPress={handleRequestReset} loading={loading} style={styles.button} textColor="#ffffff">Send Code</Button>
                            </>
                        )}
                        {/* NEW: Updated Verify OTP view to conditionally handle Reactivation UI */}
                        {resetStep === 'verify-otp' && (
                            <>
                                <Text style={styles.desc}>Enter the code sent to {form.email}.</Text>
                                <TextInput label="Verification Code (OTP)" value={form.otp} onChangeText={(t) => updateForm('otp', t)} mode="outlined" style={styles.input} keyboardType="number-pad" activeOutlineColor="#1B5E20" textColor='#000000' maxLength={4} />
                                
                                <Button mode="contained" onPress={handleVerifyOtp} loading={loading} style={styles.button} textColor="#ffffff">
                                    {isReactivating ? "Reactivate Account" : "Verify Code"}
                                </Button>
                                
                                {!isReactivating && (
                                    <Button mode="text" onPress={() => setResetStep('request')} style={styles.switchButton} textColor="#666">Change Email</Button>
                                )}
                            </>
                        )}
                        {resetStep === 'reset-password' && (
                            <>
                                <Text style={styles.desc}>Create a new 4-digit security code.</Text>
                                <PinPad mpin={form.mpin} setMpin={(val) => updateForm('mpin', val)} label="New 4-Digit MPIN" />
                                <PinPad mpin={form.confirmMpin} setMpin={(val) => updateForm('confirmMpin', val)} label="Confirm New MPIN" isError={form.confirmMpin.length > 0 && !isMatch} errorMessage="MPINs do not match" />

                                <Button mode="contained" onPress={handleFinalReset} loading={loading} style={styles.button} textColor="#ffffff">Reset MPIN</Button>
                            </>
                        )}
                        
                        <Button mode="text" onPress={() => { 
                            setAuthMode('login'); 
                            setResetStep('request'); 
                            setIsReactivating(false); // Reset Reactivation flag on back
                            resetFormState(false); 
                        }} style={[styles.switchButton, {marginTop: 20}]} textColor="#1B5E20">Back to Login</Button>
                    </View>

                ) : authMode === 'register' ? (
                    <View>
                        <RegistrationBreadcrumbs currentStep={registerStep} />
                        {renderRegisterFlow()}
                    </View>
               ) : (
                 
                    <View>
                        {loginStep === 'email' ? (
                            <View>
                                <Text style={{ color: 'grey', marginBottom: 15 }}>Please enter your email to continue.</Text>
                                <TextInput label="Email Address" value={form.email} onChangeText={(t) => updateForm('email', t)} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" activeOutlineColor="#1B5E20" textColor='#000000' />
                                
                                <Button mode="contained" onPress={handleNextLoginStep} style={styles.button} textColor="#ffffff">
                                    Next
                                </Button>
                                
                                <Button mode="text" onPress={() => {
                                    setAuthMode('register');
                                    setRegisterStep('landing'); 
                                    resetFormState(true); 
                                }} style={styles.switchButton} textColor="#1B5E20">
                                    New vendor? Register here
                                </Button>
                            </View>
                        ) : (
                            <View>
                                <View style={{ alignItems: 'center', marginBottom: 15 }}>
                                    <Text style={{ color: 'grey', fontSize: 14 }}>Welcome back,</Text>
                                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1B5E20', marginBottom: 5 }}>{form.email}</Text>
                                    <Button mode="text" compact onPress={handleUnlinkDevice} textColor="grey" labelStyle={{ fontSize: 12 }}>
                                        Not you? Switch account
                                    </Button>
                                </View>

                                <View style={{ marginTop: 10 }}>
                                  <PinPad mpin={form.mpin} setMpin={(val) => updateForm('mpin', val)} label="Tap to enter MPIN" />
                                </View>
                                
                                <View style={{alignItems: 'center', marginBottom: 15}}>
                                    <Button mode="text" compact onPress={() => {
                                        setAuthMode('forgot-password');
                                        resetFormState(false); 
                                    }} textColor="#1B5E20" labelStyle={{ fontSize: 13, marginVertical: 0 }}>Forgot MPIN?</Button>
                                </View>
                                
                                <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button} textColor="#ffffff">
                                    Login
                                </Button>
                            </View>
                        )}
                    </View>
                )}

            </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}