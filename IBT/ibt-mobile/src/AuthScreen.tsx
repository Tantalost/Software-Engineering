import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Text, TextInput, Button, HelperText } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuthForm } from './hooks/AuthForm';
import { getPasswordStrength, sanitizePhoneNumber } from './utils/validation';
import { UserData } from './types/auth.types';
import styles from './styles/LogForm';

interface AuthScreenProps {
  onLoginSuccess: (user: UserData) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  
  const { 
    authMode, setAuthMode, resetStep, setResetStep, loading, form, updateForm, resetFormState,
    handleAuth, handleRequestReset, handleVerifyOtpLocal, handleFinalReset 
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Icon name="store" size={80} color="#1B5E20" style={styles.icon} />
            <Text variant="headlineMedium" style={styles.title}>Stall Application</Text>

            <Card style={styles.card}>
                <Text variant="titleLarge" style={styles.cardTitle}>{getCardTitle()}</Text>

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
                ) : (
                    <View>
                        {authMode === 'register' && (
                            <View>
                                <TextInput label="Username" value={form.username} onChangeText={(t) => updateForm('username', t)} mode="outlined" style={styles.input} textColor='#000000' autoCapitalize="none" activeOutlineColor="#1B5E20" />
                                <View style={styles.phoneRow}>
                                    <View style={styles.prefixContainer}><Text style={styles.prefixText}>+63</Text></View>
                                    <TextInput label="Phone Number" value={form.contactNo} onChangeText={(t) => { if(!t.startsWith('0')) updateForm('contactNo', sanitizePhoneNumber(t)); }} mode="outlined" style={[styles.input, styles.phoneInput]} textColor='#000000' keyboardType="number-pad" maxLength={10} activeOutlineColor="#1B5E20" placeholder="9XXXXXXXXX" />
                                </View>
                            </View>
                        )}
                        <TextInput label={authMode === 'login' ? "Email or Username" : "Email Address"} value={form.email} onChangeText={(t) => updateForm('email', t)} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType={authMode === 'login' ? "default" : "email-address"} activeOutlineColor="#1B5E20" textColor='#000000' />
                        <TextInput label="Password" value={form.password} onChangeText={(t) => updateForm('password', t)} mode="outlined" style={[styles.input, { marginBottom: 0 }]} secureTextEntry={!showPassword} activeOutlineColor={authMode === 'register' && form.password.length > 0 ? strength.color : "#1B5E20"} outlineColor={authMode === 'register' && form.password.length > 0 ? strength.color : "#79747E"} textColor='#000000'
                            right={
                                form.password.length > 0 ? (<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} /> ) : null
                            } />
                        {authMode === 'register' && form.password.length > 0 && (
                             <View style={styles.strengthContainer}>
                                <Icon name={strength.icon as any} size={16} color={strength.color} style={{ marginRight: 5 }} />
                                <Text style={{ color: strength.color, fontSize: 12 }}>{strength.text}</Text>
                            </View>
                        )}
                        {(authMode !== 'register' || form.password.length === 0) && <View style={{marginBottom: 10}} />}
                        {authMode === 'login' && (
                            <View style={{alignItems: 'flex-end'}}>
                                <Button mode="text" compact onPress={() => setAuthMode('forgot-password')} textColor="#1B5E20" labelStyle={{ fontSize: 12, marginVertical: 0 }}>Forgot Password?</Button>
                            </View>
                        )}
                        {authMode === 'register' && (
                            <>
                                <TextInput label="Confirm Password" value={form.confirmPassword} onChangeText={(t) => updateForm('confirmPassword', t)} mode="outlined" style={styles.input} secureTextEntry={!showConfirmPassword} activeOutlineColor={!isMatch && form.confirmPassword.length > 0 ? "red" : "#1B5E20"} textColor='#000000'
                                    right={
                                        form.confirmPassword.length > 0 ? (<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} /> ) : null 
                                    } />
                                {form.confirmPassword.length > 0 && !isMatch && <HelperText type="error" visible={!isMatch}>Passwords do not match!</HelperText>}
                            </>
                        )}
                        <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button} textColor="#ffffff">{authMode === 'login' ? "Login" : "Register"}</Button>
                        <Button mode="text" onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={styles.switchButton} textColor="#1B5E20">{authMode === 'login' ? "New vendor? Register here" : "Already have an account? Login"}</Button>
                    </View>
                )}

            </Card>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

