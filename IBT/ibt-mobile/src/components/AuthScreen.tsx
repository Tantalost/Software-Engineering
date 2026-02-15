import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../src/config';

// Define the User type to pass back to the parent
interface UserData {
  id: string;
  name: string;
  email: string;
  contact: string;
}

interface AuthScreenProps {
  onLoginSuccess: (user: UserData) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    contactNo: '' 
  });

  const handleAuth = async () => {
    // Basic Validation
    if (!form.email || !form.password) return Alert.alert("Error", "Please fill all fields");
    if (authMode === 'register' && (!form.fullName || !form.contactNo)) return Alert.alert("Error", "Please fill all fields");

    setLoading(true);
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Authentication Failed");

        // Save Session
        const userData = data.user;
        await AsyncStorage.setItem('ibt_user', JSON.stringify(userData));
        
        // Notify Parent (stalls.tsx)
        onLoginSuccess(userData);

    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Icon name="store" size={80} color="#1B5E20" style={styles.icon} />
            <Text variant="headlineMedium" style={styles.title}>
                Stall Application
            </Text>

            <Card style={styles.card}>
                <Text variant="titleLarge" style={styles.cardTitle}>
                    {authMode === 'login' ? "Login to Apply" : "Create Account"}
                </Text>

                {authMode === 'register' && (
                    <View>
                        <TextInput label="Full Name" value={form.fullName} onChangeText={t => setForm({...form, fullName: t})} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" />
                        <TextInput label="Contact Number" value={form.contactNo} onChangeText={t => setForm({...form, contactNo: t})} mode="outlined" style={styles.input} keyboardType="phone-pad" activeOutlineColor="#1B5E20" />
                    </View>
                )}
                
                <TextInput label="Email" value={form.email} onChangeText={t => setForm({...form, email: t})} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" activeOutlineColor="#1B5E20"/>
                <TextInput label="Password" value={form.password} onChangeText={t => setForm({...form, password: t})} mode="outlined" style={styles.input} secureTextEntry activeOutlineColor="#1B5E20" />

                <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button}>
                    {authMode === 'login' ? "Login" : "Register"}
                </Button>

                <Button mode="text" onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={styles.switchButton} textColor="#1B5E20">
                    {authMode === 'login' ? "New vendor? Register here" : "Already have an account? Login"}
                </Button>
            </Card>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 20 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  icon: { alignSelf: 'center', marginBottom: 20 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#1B5E20', marginBottom: 30 },
  card: { padding: 20, backgroundColor: 'white', elevation: 4 },
  cardTitle: { marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { marginBottom: 10, backgroundColor: 'white' },
  button: { marginTop: 10, backgroundColor: '#1B5E20' },
  switchButton: { marginTop: 10 }
});