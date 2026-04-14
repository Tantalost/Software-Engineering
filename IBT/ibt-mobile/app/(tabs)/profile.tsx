import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, Avatar, Divider, Button, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import AuthScreen from '@/src/AuthScreen';
import API_URL from '@/src/config';
import { authService } from '@/src/services/auth.service'; 
import { colors } from '@/src/themes/stallsColors';
import { sanitizePhoneNumber } from '@/src/utils/validation'; 

type UserData = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contact: string;
  avatarUrl?: string;
};

type ApplicationData = {
  status: string;
  targetSlot: string;
  floor: string;
  paymentHistory?: { referenceNo: string; amount: number; datePaid: string }[];
  [key: string]: any;
};

const normalizeComparableContact = (value: unknown): string => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63')) return digits.slice(2);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsStep, setSettingsStep] = useState<'menu' | 'changePassword' | 'changeEmail' | 'verifyEmail'>('menu');
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', otp: '' });

  // Removed email from EditForm as requested
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    avatar: null as string | null
  });

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('ibt_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        await fetchApplications(parsedUser.id);
      } else {
        setUser(null);
        setApplications([]);
      }
    } catch (e) {
      console.error("Profile Load Error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchApplications = async (userId: string) => {
    try {
      const timestamp = new Date().getTime();
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/stalls/my-application/${userId}?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      let apps = [];
      if (Array.isArray(data)) {
        apps = data;
      } else if (data && data.targetSlot) {
        apps = [data];
      }

      const normalizedUserId = String(userId || '').trim();
      const currentUserEmail = String(user?.email || '').trim().toLowerCase();
      const currentUserContact = normalizeComparableContact(user?.contact || '');
      const parseSlots = (value: unknown) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean);

      const getOwnershipSignals = (app: any) => {
        const ownerId = String(app?.userId || app?.uid || '').trim();
        const ownerEmail = String(app?.email || '').trim().toLowerCase();
        const ownerContact = normalizeComparableContact(app?.contact || app?.contactNo);

        const hasEmailMatch = Boolean(ownerEmail && currentUserEmail && ownerEmail === currentUserEmail);
        const hasContactMatch = Boolean(ownerContact && currentUserContact && ownerContact === currentUserContact);
        const hasIdMatch = Boolean(ownerId && ownerId === normalizedUserId);

        return { hasIdMatch, hasEmailMatch, hasContactMatch };
      };

      const isStrongOwned = (app: any) => {
        const status = String(app?.status || '').toUpperCase();
        const { hasIdMatch, hasEmailMatch, hasContactMatch } = getOwnershipSignals(app);

        if (hasEmailMatch || hasContactMatch) return true;

        if (hasIdMatch && status !== 'TENANT') return true;

        return false;
      };

      const isWeakOwned = (app: any) => {
        const { hasIdMatch, hasEmailMatch, hasContactMatch } = getOwnershipSignals(app);
        return hasIdMatch || hasEmailMatch || hasContactMatch;
      };

      const trustedOwnedSlots = new Set(
        apps
          .filter((app) => isStrongOwned(app))
          .flatMap((app) => parseSlots(app?.targetSlot))
      );

      apps = apps.filter((app) => {
        const status = String(app?.status || '').toUpperCase();
        if (isStrongOwned(app)) return true;

        if (status !== 'TENANT') return isWeakOwned(app);

        if (trustedOwnedSlots.size === 0) return false;

        if (!isWeakOwned(app)) return false;

        const appSlots = parseSlots(app?.targetSlot);
        return appSlots.some((slot) => trustedOwnedSlots.has(slot));
      });

      const validApps = apps.filter(app => 
        app && 
        app.targetSlot && 
        app.targetSlot.trim() !== "" &&
        app.status !== 'REJECTED' && 
        app.tenantDbStatus !== 'Inactive' 
      );
      setApplications(validApps);

    } catch (error) {
      console.log("Error fetching apps for profile", error);
      setApplications([]);
    }
  };

  const openEditModal = () => {
    if (!user) return;

    let rawContact = user.contact || '';
    if (rawContact.startsWith('+63')) rawContact = rawContact.substring(3);
    else if (rawContact.startsWith('0')) rawContact = rawContact.substring(1);

    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      contact: sanitizePhoneNumber(rawContact),
      avatar: user.avatarUrl || null
    });
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'We need camera roll permissions to change your photo.');
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, 
    });

    if (!result.canceled) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setEditForm(prev => ({ ...prev, avatar: manipResult.uri }));
      } catch (error) {
        console.error("Error manipulating image:", error);
        Alert.alert("Error", "Could not process the selected image.");
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    const pureNumber = editForm.contact.replace(/\D/g, '');
    if (pureNumber.length !== 10) {
        return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('firstName', editForm.firstName);
      formData.append('lastName', editForm.lastName);
      formData.append('contact', `+63${pureNumber}`);
      
      // Keep existing email to satisfy backend validation
      formData.append('email', user.email); 

      if (editForm.avatar && !editForm.avatar.startsWith('http')) {
        const uri = editForm.avatar;
        const fileType = uri.split('.').pop();
        const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

        formData.append('avatar', {
          uri: uri,
          name: `profile_photo.${fileType}`,
          type: mimeType,
        } as any);
      }

      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      const newAvatarUrl = data.user.avatarUrl
        ? `${data.user.avatarUrl}?t=${new Date().getTime()}`
        : user.avatarUrl;

      const updatedUser = {
        ...user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        contact: data.user.contact,
        avatarUrl: newAvatarUrl
      };

      await AsyncStorage.setItem('ibt_user', JSON.stringify(updatedUser));

      setUser(null);
      setTimeout(() => setUser(updatedUser), 50);

      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");

    } catch (error: any) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowLogin(false);
    if (userData && userData.id) {
        fetchApplications(userData.id);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(['ibt_user', 'token']);
          setUser(null);
          setApplications([]);
          router.replace('/');
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    const safeStatus = (status || 'VERIFICATION_PENDING').toUpperCase();
    switch (safeStatus) {
      case 'TENANT': return colors.success || '#4CAF50';
      case 'VERIFICATION_PENDING':
      case 'PENDING': return colors.warning;
      case 'PAYMENT_UNLOCKED': return '#2196F3';
      case 'CONTRACT_PENDING': return '#E65100';
      default: return 'grey';
    }
  };

  const formatStatus = (status: string) => {
    const safeStatus = status || 'VERIFICATION PENDING';
    return safeStatus.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ padding: 10, alignItems: 'flex-start' }}>
          <Button mode="text" icon="arrow-left" onPress={() => setShowLogin(false)} textColor='black'>
            Back to Profile
          </Button>
        </View>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Icon name="account-circle-outline" size={80} color="grey" />
          <Text variant="titleMedium" style={{ marginTop: 20, color: 'grey' }}>Please log in to view your profile.</Text>
          <Button mode="contained" onPress={() => setShowLogin(true)} style={{ marginTop: 20, backgroundColor: colors.primary }} textColor='white'>
            Go to Login
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <Portal>
        <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 20, color: colors.textDark }}>Edit Profile</Text>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={pickImage}>
              {editForm.avatar ? (
                <Avatar.Image
                  size={100}
                  source={{
                    uri: editForm.avatar.startsWith('file') || editForm.avatar.startsWith('http')
                    ? editForm.avatar
                    : `${API_URL}/auth/avatar/${editForm.avatar}`
                  }}
                />
              ) : (
                <Avatar.Text
                  size={100}
                  label={editForm.firstName ? editForm.firstName.charAt(0).toUpperCase() : 'U'}
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 15, padding: 5, elevation: 2, borderWidth: 1, borderColor: '#eee' }}>
                <Icon name="camera" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: 'grey', marginTop: 5 }}>Tap to change photo</Text>
          </View>

          <TextInput label="First Name" value={editForm.firstName} onChangeText={t => setEditForm({ ...editForm, firstName: t })} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} style={styles.input} />
          <TextInput label="Last Name" value={editForm.lastName} onChangeText={t => setEditForm({ ...editForm, lastName: t })} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} style={styles.input} />
          
          <View style={styles.phoneRow}>
              <View style={styles.prefixContainer}>
                  <Text style={styles.prefixText}>+63</Text>
              </View>
              <TextInput 
                  label="Mobile Number" 
                  value={editForm.contact} 
                  onChangeText={(t) => { 
                      let cleaned = t.startsWith('0') ? t.substring(1) : t;
                      setEditForm({ ...editForm, contact: sanitizePhoneNumber(cleaned) }); 
                  }} 
                  mode="outlined" 
                  style={[styles.input, styles.phoneInput]} 
                  textColor='#000000' 
                  outlineColor={colors.textMedium} 
                  activeOutlineColor={colors.primary}
                  keyboardType="numeric" 
                  maxLength={10} 
                  placeholder="9XX XXX XXXX" 
              />
          </View>

          <Button mode="contained" onPress={saveProfile} loading={saving} style={{ marginTop: 15, backgroundColor: colors.primary }} textColor='white'>Save Changes</Button>
          <Button onPress={() => setEditModalVisible(false)} style={{ marginTop: 5 }} textColor="grey">Cancel</Button>
        </Modal>


        <Modal visible={settingsModalVisible} onDismiss={() => setSettingsModalVisible(false)} contentContainerStyle={styles.modalContent}>
          {settingsStep === 'menu' && (
            <View>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 20, color: colors.textDark }}>Settings</Text>
              
              <TouchableOpacity onPress={() => setSettingsStep('changePassword')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Icon name="lock-reset" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                <Text style={{ fontSize: 16 , color: 'black'}}>Change Security Code (MPIN)</Text>
              </TouchableOpacity>

      
              <TouchableOpacity onPress={() => setSettingsStep('changeEmail')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Icon name="email-edit" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                <Text style={{ fontSize: 16 , color: 'black'}}>Change Account Email</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  Alert.alert("Deactivate Account", "Are you sure? Your stalls will remain, but you cannot log in until you reactivate via email.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Deactivate", style: "destructive", onPress: async () => {
                        setSaving(true);
                        try {
                          await fetch(`${API_URL}/auth/deactivate`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: user.email }) });
                          await AsyncStorage.multiRemove(['ibt_user', 'token']);
                          setUser(null);
                          setSettingsModalVisible(false);
                          router.replace('/');
                        } catch(e) { Alert.alert("Error", "Could not deactivate"); }
                        setSaving(false);
                    }}
                  ])
                }} 
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }}
              >
                <Icon name="account-cancel" size={24} color="red" style={{ marginRight: 15 }} />
                <Text style={{ fontSize: 16, color: 'red' }}>Deactivate Account</Text>
              </TouchableOpacity>
              
              <Button mode="text" onPress={() => setSettingsModalVisible(false)} style={{ marginTop: 20 }} textColor='black'>Close</Button>
            </View>
          )}

          {settingsStep === 'changePassword' && (
            <View>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 20, color: 'black'}}>Change Security Code</Text>
              <TextInput label="Current MPIN" value={passForm.oldPass} onChangeText={t => setPassForm({...passForm, oldPass: t.replace(/[^0-9]/g, '')})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} />
              <TextInput label="New 4-Digit MPIN" value={passForm.newPass} onChangeText={t => setPassForm({...passForm, newPass: t.replace(/[^0-9]/g, '')})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} />
              <TextInput label="Confirm New MPIN" value={passForm.confirmPass} onChangeText={t => setPassForm({...passForm, confirmPass: t.replace(/[^0-9]/g, '')})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} />
              
              <Button mode="contained" loading={saving} onPress={async () => {
                 if (passForm.newPass !== passForm.confirmPass) return Alert.alert("Error", "Codes do not match.");
                 if (passForm.newPass.length !== 4) return Alert.alert("Error", "MPIN must be exactly 4 digits.");
                 
                 setSaving(true);
                 try {
                   const res = await fetch(`${API_URL}/auth/change-password`, { 
                     method: 'POST', 
                     headers: {'Content-Type':'application/json'}, 
                     body: JSON.stringify({ email: user.email, oldPassword: passForm.oldPass, newPassword: passForm.newPass }) 
                   });
                   const data = await res.json();
                   if (!res.ok) throw new Error(data.error || "Update failed.");
                   
                   Alert.alert("Success", "Security Code updated!");
                   setSettingsModalVisible(false);
                   setPassForm({oldPass: '', newPass: '', confirmPass: ''});
                   setSettingsStep('menu');
                 } catch(e: any) { Alert.alert("Error", e.message || "Could not update code."); }
                 setSaving(false);
              }} style={{ marginTop: 10, backgroundColor: colors.primary }} textColor="white">Save</Button>
              <Button mode="text" onPress={() => setSettingsStep('menu')} style={{ marginTop: 5 }} textColor="grey">Back</Button>
            </View>
          )}

          {settingsStep === 'changeEmail' && (
            <View>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 10, color: 'black' }} >Change Email</Text>
              <Text style={{ color: 'grey', marginBottom: 20 }}>Please enter your new email address. We will send a verification code to confirm it's yours.</Text>
              
              <TextInput label="New Email Address" value={emailForm.newEmail} onChangeText={t => setEmailForm({...emailForm, newEmail: t})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
              
              <Button mode="contained" loading={saving} onPress={async () => {
                 if (!emailForm.newEmail) return Alert.alert("Error", "Please enter a new email.");
                 
                 setSaving(true);
                 try {
                   await authService.requestEmailChange({ userId: user.id, newEmail: emailForm.newEmail });
                   Alert.alert("Code Sent", "Please check your new email for the verification code.");
                   setSettingsStep('verifyEmail');
                 } catch(e: any) { 
                   Alert.alert("Error", e.message || "Could not request change."); 
                 }
                 setSaving(false);
              }} style={{ marginTop: 10, backgroundColor: colors.primary }} textColor="white">Send Code</Button>
              <Button mode="text" onPress={() => setSettingsStep('menu')} style={{ marginTop: 5 }} textColor="grey">Back</Button>
            </View>
          )}

          {settingsStep === 'verifyEmail' && (
            <View>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 10, color: 'black' }}>Verify New Email</Text>
              <Text style={{ color: 'grey', marginBottom: 20 }}>Enter the 4-digit code sent to {emailForm.newEmail}.</Text>
              
              <TextInput label="Verification Code" value={emailForm.otp} onChangeText={t => setEmailForm({...emailForm, otp: t.replace(/[^0-9]/g, '')})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} keyboardType="number-pad" maxLength={4} style={styles.input} />
              
              <Button mode="contained" loading={saving} onPress={async () => {
                 if (emailForm.otp.length !== 4) return Alert.alert("Error", "Please enter the 4-digit code.");
                 
                 setSaving(true);
                 try {
                   const data = await authService.verifyAndChangeEmail({ userId: user.id, newEmail: emailForm.newEmail, otp: emailForm.otp });
                   
                   const updatedUser = { ...user, email: data.newEmail };
                   await AsyncStorage.setItem('ibt_user', JSON.stringify(updatedUser));
                   await AsyncStorage.setItem('linked_email', data.newEmail); 
                   setUser(updatedUser);
                   
                   Alert.alert("Success", "Your email has been successfully updated!");
                   setSettingsModalVisible(false);
                   setEmailForm({ newEmail: '', otp: '' });
                   setSettingsStep('menu');
                 } catch(e: any) { 
                   Alert.alert("Error", e.message || "Could not verify code."); 
                 }
                 setSaving(false);
              }} style={{ marginTop: 10, backgroundColor: colors.primary }} textColor="white">Verify & Save</Button>
              <Button mode="text" onPress={() => setSettingsStep('changeEmail')} style={{ marginTop: 5 }} textColor="grey">Change Email Address</Button>
            </View>
          )}

        </Modal>
      </Portal>

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Text variant="headlineMedium" style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => { setSettingsStep('menu'); setSettingsModalVisible(true); }} style={{ padding: 5 }}>
            <Icon name="cog" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfileData(); }} colors={[colors.primary]} />}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={openEditModal} style={{ position: 'relative' }}>
            {user.avatarUrl ? (
              <>
                <Avatar.Image
                  size={80}
                  source={{
                    uri: user.avatarUrl.startsWith('http')
                    ? user.avatarUrl
                    : `${API_URL}/auth/avatar/${user.avatarUrl}`
                  }}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading && (
                  <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 40 }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </>
            ) : (
              <Avatar.Text
                size={80}
                label={user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                style={{ backgroundColor: colors.primary }}
              />
            )}
            
            <View style={{ position: 'absolute', top: 0, right: -5, backgroundColor: colors.primary, borderRadius: 15, padding: 5, elevation: 3, borderWidth: 2, borderColor: 'white' }}>
               <Icon name="pencil" size={14} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text variant="headlineSmall" style={{ marginTop: 15, fontWeight: 'bold', color: colors.black }}>
             {user.firstName ? `${user.firstName} ${user.lastName}` : 'New Vendor'}
          </Text>
          
          <Text variant="bodyMedium" style={{ color: 'grey' }}>{user.email}</Text>
          <Text variant="bodyMedium" style={{ color: 'grey' }}>{user.contact}</Text>
        </View>
        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>My Slots</Text>
        {applications.length === 0 ? (
          <Text style={styles.emptyText}>No active applications or stalls.</Text>
        ) : (
          applications.map((app, index) => (
            <Card key={index} style={styles.card} mode="outlined">
              <Card.Content>
                <View style={styles.rowBetween}>
                  <View>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.black }}>{app.targetSlot}</Text>
                    <Text variant="bodySmall" style={{ color: 'grey' }}>{app.floor}</Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: getStatusColor(app.status),
                      borderRadius: 4,
                      height: 26,
                      paddingHorizontal: 8,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {formatStatus(app.status)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor={colors.error}
          style={styles.logoutBtn}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'flex-start' },
  headerTitle: { fontWeight: '700', color: colors.textDark },
  scrollContent: { padding: 20, paddingBottom: 100 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  profileSection: { alignItems: 'center', marginBottom: 10, marginTop: 10 },
  divider: { marginVertical: 20, height: 1, backgroundColor: '#e0e0e0' },
  sectionTitle: { fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { marginBottom: 10, backgroundColor: 'white', borderColor: '#eee' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyText: { fontStyle: 'italic', color: 'grey', fontSize: 13, marginBottom: 10 },
  historyCard: { backgroundColor: '#fff', marginBottom: 20 },
  logoutBtn: { marginTop: 20, borderColor: colors.error, borderWidth: 1 },
  modalContent: { backgroundColor: 'white', padding: 25, margin: 20, borderRadius: 15 },
  input: { marginBottom: 12, backgroundColor: 'white', fontSize: 14 },
  // Phone Input Styles
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  prefixContainer: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, height: 50, justifyContent: 'center', borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#cbd5e1', borderRightWidth: 0, marginTop: 6 },
  prefixText: { fontWeight: 'bold', color: '#475569', fontSize: 16 },
  phoneInput: { flex: 1, marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
});