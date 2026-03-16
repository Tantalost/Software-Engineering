import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Text, TextInput, Button, HelperText, Checkbox } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuthForm } from './hooks/AuthForm';
import { getPasswordStrength, sanitizePhoneNumber } from './utils/validation';
import { UserData } from './types/auth.types';
import styles from './styles/LogForm';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

interface AuthScreenProps {
  onLoginSuccess: (user: UserData) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  
  const { 
    authMode, setAuthMode, resetStep, setResetStep, 
    registerStep, setRegisterStep, 
    loading, form, updateForm, resetFormState,
    handleAuth, handleSendRegistrationOtp,
    handleRequestReset, handleVerifyOtpLocal, handleFinalReset 
  } = useAuthForm(onLoginSuccess);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(form.password);
  const isMatch = form.password === form.confirmPassword;

  const getCardTitle = () => {
      if (authMode === 'login') return "Login to Apply";
      if (authMode === 'register') return "Create Account"; 
      if (authMode === 'forgot-password') {
          return resetStep === 'request' ? "Reset Password" : resetStep === 'verify-otp' ? "Enter Code" : "New Password";
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
              <Button mode="text" compact onPress={() => { setAuthMode('login'); resetFormState(); }} textColor="#1B5E20" labelStyle={{ fontWeight: 'bold' }}>
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
              Back
            </Button>
          </View>
        );

      case 'otp_verify':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: "black" }}>Enter One-Time-Password</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>Please enter the one-time Password (OTP) that we sent to {form.email}</Text>
            
            <TextInput label="OTP" value={form.otp} onChangeText={(t) => updateForm('otp', t)} mode="outlined" style={styles.input} keyboardType="number-pad" activeOutlineColor="#1B5E20" textColor='#000000' maxLength={6} />
            
            <Button mode="contained" onPress={() => setRegisterStep('personal_info')} style={styles.button} textColor="#ffffff">
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

            <Button mode="contained" onPress={() => setRegisterStep('create_password')} style={styles.button} textColor="#ffffff">
              Next
            </Button>
            <Button mode="text" onPress={() => setRegisterStep('otp_verify')} style={styles.switchButton} textColor="grey">
              Back
            </Button>
          </View>
        );

      case 'create_password':
        return (
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 5, color: "black"}}>Create your Password</Text>
            <Text style={{ color: 'grey', marginBottom: 20 }}>Secure your account with a strong password.</Text>

            <TextInput label="Password" value={form.password} onChangeText={(t) => updateForm('password', t)} mode="outlined" style={[styles.input, { marginBottom: 0 }]} secureTextEntry={!showPassword} activeOutlineColor={strength.color} outlineColor={strength.color === 'transparent' ? '#79747E' : strength.color} textColor='#000000' right={form.password.length > 0 ? (<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} /> ) : null} />
            {form.password.length > 0 && (
                <View style={styles.strengthContainer}>
                    <Icon name={strength.icon as any} size={16} color={strength.color} style={{ marginRight: 5 }} />
                    <Text style={{ color: strength.color, fontSize: 12 }}>{strength.text}</Text>
                </View>
            )}
            
            <TextInput label="Confirm Password" value={form.confirmPassword} onChangeText={(t) => updateForm('confirmPassword', t)} mode="outlined" style={styles.input} secureTextEntry={!showConfirmPassword} activeOutlineColor={!isMatch && form.confirmPassword.length > 0 ? "red" : "#1B5E20"} textColor='#000000' right={form.confirmPassword.length > 0 ? (<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} /> ) : null } />
            {form.confirmPassword.length > 0 && !isMatch && <HelperText type="error" visible={!isMatch}>Passwords do not match!</HelperText>}

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
                        {resetStep === 'verify-otp' && (
                            <>
                                <Text style={styles.desc}>Enter the code sent to {form.email}.</Text>
                                <TextInput label="Verification Code (OTP)" value={form.otp} onChangeText={(t) => updateForm('otp', t)} mode="outlined" style={styles.input} keyboardType="number-pad" activeOutlineColor="#1B5E20" textColor='#000000' />
                                <Button mode="contained" onPress={handleVerifyOtpLocal} style={styles.button} textColor="#ffffff">Verify Code</Button>
                                <Button mode="text" onPress={() => setResetStep('request')} style={styles.switchButton} textColor="#666">Change Email</Button>
                            </>
                        )}
                        {resetStep === 'reset-password' && (
                            <>
                                <TextInput label="New Password" value={form.password} onChangeText={(t) => updateForm('password', t)} mode="outlined" style={[styles.input, { marginBottom: 0 }]} secureTextEntry={!showPassword} activeOutlineColor={strength.color} outlineColor={strength.color === 'transparent' ? '#79747E' : strength.color} textColor='#000000'
                                    right={
                                        form.password.length > 0 ? (<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} /> ) : null
                                    } />
                                {form.password.length > 0 && (
                                    <View style={styles.strengthContainer}>
                                        <Icon name={strength.icon as any} size={16} color={strength.color} style={{ marginRight: 5 }} />
                                        <Text style={{ color: strength.color, fontSize: 12 }}>{strength.text}</Text>
                                    </View>
                                )}
                                <TextInput label="Confirm New Password" value={form.confirmPassword} onChangeText={(t) => updateForm('confirmPassword', t)} mode="outlined" style={styles.input} secureTextEntry={!showConfirmPassword} activeOutlineColor={!isMatch && form.confirmPassword.length > 0 ? "red" : "#1B5E20"} textColor='#000000'
                                    right={
                                        form.confirmPassword.length > 0 ? (<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} /> ) : null
                                    } />
                                {form.confirmPassword.length > 0 && !isMatch && <HelperText type="error" visible={!isMatch}>Passwords do not match!</HelperText>}
                                <Button mode="contained" onPress={handleFinalReset} loading={loading} style={styles.button} textColor="#ffffff">Reset Password</Button>
                            </>
                        )}
                        <Button mode="text" onPress={() => { setAuthMode('login'); setResetStep('request'); resetFormState(); }} style={[styles.switchButton, {marginTop: 20}]} textColor="#1B5E20">Back to Login</Button>
                    </View>

                ) : authMode === 'register' ? (
               
                    renderRegisterFlow()

                ) : (
                 
                    <View>
                        <TextInput label="Email Address" value={form.email} onChangeText={(t) => updateForm('email', t)} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" activeOutlineColor="#1B5E20" textColor='#000000' />
                        <TextInput label="Password" value={form.password} onChangeText={(t) => updateForm('password', t)} mode="outlined" style={[styles.input, { marginBottom: 0 }]} secureTextEntry={!showPassword} activeOutlineColor="#1B5E20" outlineColor="#79747E" textColor='#000000'
                            right={
                                form.password.length > 0 ? (<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} /> ) : null
                            } />
                        <View style={{marginBottom: 10}} />
                        
                        <View style={{alignItems: 'flex-end'}}>
                            <Button mode="text" compact onPress={() => setAuthMode('forgot-password')} textColor="#1B5E20" labelStyle={{ fontSize: 12, marginVertical: 0 }}>Forgot Password?</Button>
                        </View>
                        
                        <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button} textColor="#ffffff">
                            Login
                        </Button>
                        <Button mode="text" onPress={() => {
                            setAuthMode('register');
                            setRegisterStep('landing'); 
                        }} style={styles.switchButton} textColor="#1B5E20">
                            New vendor? Register here
                        </Button>
                    </View>
                )}

            </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}