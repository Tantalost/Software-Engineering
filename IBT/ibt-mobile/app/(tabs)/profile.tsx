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

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsStep, setSettingsStep] = useState<'menu' | 'changePassword' | 'changeEmail' | 'verifyEmail'>('menu');
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', otp: '' });

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
      formData.append('email', user.email);
     
      if (editForm.avatar && (editForm.avatar.startsWith('file://') || editForm.avatar.startsWith('content://'))) {
        const uri = editForm.avatar;
        const fileType = uri.split('.').pop() || 'jpeg';
        const mimeType = fileType.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
        formData.append('avatar', { uri, name: `profile_photo.${fileType}`, type: mimeType } as any);
      }
      const res = await fetch(`${API_URL}/auth/update-profile`, { method: 'PUT', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      const newAvatarUrl = data.user.avatarUrl
        ? `${data.user.avatarUrl}?t=${new Date().getTime()}`
        : user.avatarUrl;
      const updatedUser = { ...user, firstName: data.user.firstName, lastName: data.user.lastName, contact: data.user.contact, avatarUrl: newAvatarUrl };
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
        text: "Log Out", style: "destructive",
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
      case 'TENANT': return colors.success || '#16A34A';
      case 'VERIFICATION_PENDING':
      case 'PENDING': return colors.warning;
      case 'PAYMENT_UNLOCKED': return '#2563EB';
      case 'CONTRACT_PENDING': return '#EA580C';
      default: return '#94A3B8';
    }
  };

  const formatStatus = (status: string) => {
    const safeStatus = status || 'VERIFICATION PENDING';
    return safeStatus.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.backBar}>
         <TouchableOpacity
                     onPress={() => setShowLogin(false)}
                     style={{
                       flexDirection: 'row',
                       alignItems: 'center',
                       paddingVertical: 6,
                       paddingHorizontal: 10,
                       borderRadius: 8,
                       backgroundColor: '#F3F6FA',
                       gap: 6,
                     }}
                   >
                     <Icon name="arrow-left" size={18} color={colors.primary} />
                     <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Back to Stalls</Text>
                   </TouchableOpacity>
        </View>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <Icon name="account-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>You're not logged in</Text>
          <Text style={styles.guestSubtitle}>Sign in to manage your stalls and profile.</Text>
          <Button
            mode="contained"
            onPress={() => setShowLogin(true)}
            style={styles.guestLoginBtn}
            textColor="white"
            contentStyle={{ paddingVertical: 6 }}
          >
            Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Divider style={styles.modalDivider} />

          <View style={styles.avatarPickerContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarPickerTouch}>
              {editForm.avatar ? (
                <Avatar.Image
                  size={88}
                  source={{
                    uri: editForm.avatar.startsWith('file') || editForm.avatar.startsWith('http')
                      ? editForm.avatar
                      : `${API_URL}/auth/avatar/${editForm.avatar}`
                  }}
                />
              ) : (
                <Avatar.Text
                  size={88}
                  label={editForm.firstName ? editForm.firstName.charAt(0).toUpperCase() : 'U'}
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              <View style={styles.cameraOverlay}>
                <Icon name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.tapToChangeText}>Tap to change photo</Text>
          </View>

          <Text style={styles.fieldLabel}>First Name</Text>
          <TextInput
            value={editForm.firstName}
            onChangeText={t => setEditForm({ ...editForm, firstName: t })}
            mode="outlined"
            textColor="black"
            outlineColor="#E2E8F0"
            activeOutlineColor={colors.primary}
            style={styles.input}
            dense
          />

          <Text style={styles.fieldLabel}>Last Name</Text>
          <TextInput
            value={editForm.lastName}
            onChangeText={t => setEditForm({ ...editForm, lastName: t })}
            mode="outlined"
            textColor="black"
            outlineColor="#E2E8F0"
            activeOutlineColor={colors.primary}
            style={styles.input}
            dense
          />

          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+63</Text>
            </View>
            <TextInput
              value={editForm.contact}
              onChangeText={(t) => {
                let cleaned = t.startsWith('0') ? t.substring(1) : t;
                setEditForm({ ...editForm, contact: sanitizePhoneNumber(cleaned) });
              }}
              mode="outlined"
              style={[styles.input, styles.phoneInput]}
              textColor="#000"
              outlineColor="#E2E8F0"
              activeOutlineColor={colors.primary}
              keyboardType="numeric"
              maxLength={10}
              placeholder="9XX XXX XXXX"
              dense
            />
          </View>

          <Button
            mode="contained"
            onPress={saveProfile}
            loading={saving}
            style={styles.saveBtn}
            textColor="white"
            contentStyle={{ paddingVertical: 6 }}
          >
            Save Changes
          </Button>
          <Button onPress={() => setEditModalVisible(false)} style={{ marginTop: 4 }} textColor="#94A3B8">
            Cancel
          </Button>
        </Modal>

        <Modal
          visible={settingsModalVisible}
          onDismiss={() => setSettingsModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
         
          {settingsStep === 'menu' && (
            <View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Settings</Text>
                <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.modalCloseBtn}>
                  <Icon name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <Divider style={styles.modalDivider} />

              <TouchableOpacity onPress={() => setSettingsStep('changePassword')} style={styles.settingsItem}>
                <View style={[styles.settingsIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Icon name="lock-reset" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingsTextBox}>
                  <Text style={styles.settingsItemTitle}>Security Code (MPIN)</Text>
                  <Text style={styles.settingsItemDesc}>Update your 4-digit MPIN</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSettingsStep('changeEmail')} style={styles.settingsItem}>
                <View style={[styles.settingsIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Icon name="email-edit-outline" size={20} color="#16A34A" />
                </View>
                <View style={styles.settingsTextBox}>
                  <Text style={styles.settingsItemTitle}>Account Email</Text>
                  <Text style={styles.settingsItemDesc}>Change your login email address</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              <Divider style={{ marginVertical: 8 }} />

              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Deactivate Account", "Are you sure? Your stalls will remain, but you cannot log in until you reactivate via email.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Deactivate", style: "destructive", onPress: async () => {
                        setSaving(true);
                        try {
                          await fetch(`${API_URL}/auth/deactivate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
                          await AsyncStorage.multiRemove(['ibt_user', 'token']);
                          setUser(null);
                          setSettingsModalVisible(false);
                          router.replace('/');
                        } catch (e) { Alert.alert("Error", "Could not deactivate"); }
                        setSaving(false);
                      }
                    }
                  ]);
                }}
                style={[styles.settingsItem, { borderBottomWidth: 0 }]}
              >
                <View style={[styles.settingsIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <Icon name="account-cancel-outline" size={20} color="#EF4444" />
                </View>
                <View style={styles.settingsTextBox}>
                  <Text style={[styles.settingsItemTitle, { color: '#EF4444' }]}>Deactivate Account</Text>
                  <Text style={styles.settingsItemDesc}>Temporarily disable your account</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          )}

          {settingsStep === 'changePassword' && (
            <View>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSettingsStep('menu')} style={styles.backBtn}>
                  <Icon name="arrow-left" size={20} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Change Security Code</Text>
              </View>
              <Divider style={styles.modalDivider} />

              <Text style={styles.stepDescription}>Enter your current MPIN and set a new 4-digit code.</Text>

              <Text style={styles.fieldLabel}>Current MPIN</Text>
              <TextInput value={passForm.oldPass} onChangeText={t => setPassForm({ ...passForm, oldPass: t.replace(/[^0-9]/g, '') })} mode="outlined" textColor="black" outlineColor="#E2E8F0" activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} dense />

              <Text style={styles.fieldLabel}>New 4-Digit MPIN</Text>
              <TextInput value={passForm.newPass} onChangeText={t => setPassForm({ ...passForm, newPass: t.replace(/[^0-9]/g, '') })} mode="outlined" textColor="black" outlineColor="#E2E8F0" activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} dense />

              <Text style={styles.fieldLabel}>Confirm New MPIN</Text>
              <TextInput value={passForm.confirmPass} onChangeText={t => setPassForm({ ...passForm, confirmPass: t.replace(/[^0-9]/g, '') })} mode="outlined" textColor="black" outlineColor="#E2E8F0" activeOutlineColor={colors.primary} secureTextEntry style={styles.input} keyboardType="number-pad" maxLength={4} dense />

              <Button mode="contained" loading={saving} onPress={async () => {
                if (passForm.newPass !== passForm.confirmPass) return Alert.alert("Error", "Codes do not match.");
                if (passForm.newPass.length !== 4) return Alert.alert("Error", "MPIN must be exactly 4 digits.");
                setSaving(true);
                try {
                  const res = await fetch(`${API_URL}/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, oldPassword: passForm.oldPass, newPassword: passForm.newPass }) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Update failed.");
                  Alert.alert("Success", "Security Code updated!");
                  setSettingsModalVisible(false);
                  setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
                  setSettingsStep('menu');
                } catch (e: any) { Alert.alert("Error", e.message || "Could not update code."); }
                setSaving(false);
              }} style={styles.saveBtn} textColor="white" contentStyle={{ paddingVertical: 6 }}>
                Save New Code
              </Button>
            </View>
          )}

          {settingsStep === 'changeEmail' && (
            <View>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSettingsStep('menu')} style={styles.backBtn}>
                  <Icon name="arrow-left" size={20} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Change Email</Text>
              </View>
              <Divider style={styles.modalDivider} />

              <Text style={styles.stepDescription}>Enter your new email address. A verification code will be sent to confirm ownership.</Text>

              <Text style={styles.fieldLabel}>New Email Address</Text>
              <TextInput value={emailForm.newEmail} onChangeText={t => setEmailForm({ ...emailForm, newEmail: t })} mode="outlined" textColor="black" outlineColor="#E2E8F0" activeOutlineColor={colors.primary} autoCapitalize="none" keyboardType="email-address" style={styles.input} dense />

              <Button mode="contained" loading={saving} onPress={async () => {
                if (!emailForm.newEmail) return Alert.alert("Error", "Please enter a new email.");
                setSaving(true);
                try {
                  await authService.requestEmailChange({ userId: user.id, newEmail: emailForm.newEmail });
                  Alert.alert("Code Sent", "Please check your new email for the verification code.");
                  setSettingsStep('verifyEmail');
                } catch (e: any) { Alert.alert("Error", e.message || "Could not request change."); }
                setSaving(false);
              }} style={styles.saveBtn} textColor="white" contentStyle={{ paddingVertical: 6 }}>
                Send Verification Code
              </Button>
            </View>
          )}

          {settingsStep === 'verifyEmail' && (
            <View>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSettingsStep('changeEmail')} style={styles.backBtn}>
                  <Icon name="arrow-left" size={20} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Verify New Email</Text>
              </View>
              <Divider style={styles.modalDivider} />

              <View style={styles.verifyEmailBanner}>
                <Icon name="email-check-outline" size={28} color={colors.primary} />
                <Text style={styles.verifyEmailText}>A 4-digit code was sent to{'\n'}<Text style={{ fontWeight: '700', color: colors.primary }}>{emailForm.newEmail}</Text></Text>
              </View>

              <Text style={styles.fieldLabel}>Verification Code</Text>
              <TextInput value={emailForm.otp} onChangeText={t => setEmailForm({ ...emailForm, otp: t.replace(/[^0-9]/g, '') })} mode="outlined" textColor="black" outlineColor="#E2E8F0" activeOutlineColor={colors.primary} keyboardType="number-pad" maxLength={4} style={styles.input} dense />

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
                } catch (e: any) { Alert.alert("Error", e.message || "Could not verify code."); }
                setSaving(false);
              }} style={styles.saveBtn} textColor="white" contentStyle={{ paddingVertical: 6 }}>
                Verify & Save
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => { setSettingsStep('menu'); setSettingsModalVisible(true); }}
          style={styles.headerSettingsBtn}
        >
          <Icon name="cog-outline" size={22} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadProfileData(); }}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.profileCard}>
        
          <View style={styles.profileBanner} />

          <View style={styles.profileCardBody}>
          
            <TouchableOpacity onPress={openEditModal} style={styles.avatarWrapper}>
              {user.avatarUrl ? (
                <>
                  <Avatar.Image
                    size={84}
                    source={{
                      uri: user.avatarUrl.startsWith('http')
                        ? user.avatarUrl
                        : `${API_URL}/auth/avatar/${user.avatarUrl}`
                    }}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <View style={[StyleSheet.absoluteFill, styles.avatarLoadingOverlay]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                </>
              ) : (
                <Avatar.Text
                  size={84}
                  label={user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              <View style={styles.editAvatarBadge}>
                <Icon name="pencil" size={11} color="white" />
              </View>
            </TouchableOpacity>

           
            <Text style={styles.profileName}>
              {user.firstName ? `${user.firstName} ${user.lastName}` : 'New Vendor'}
            </Text>

           
            <View style={styles.infoRowsContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Icon name="email-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.infoText} numberOfLines={1}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Icon name="phone-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.infoText}>{user.contact}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Icon name="store-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>My Stall Slots</Text>
            {applications.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{applications.length}</Text>
              </View>
            )}
          </View>

          {applications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="store-remove-outline" size={38} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Active Stalls</Text>
              <Text style={styles.emptySubtext}>Your approved or pending stall slots will appear here.</Text>
            </View>
          ) : (
            applications.map((app, index) => (
              <Card key={index} style={styles.slotCard} mode="outlined">
                <Card.Content style={styles.slotCardContent}>
                  <View style={styles.slotLeft}>
                    <View style={styles.slotIconBox}>
                      <Icon name="store" size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.slotName}>{app.targetSlot}</Text>
                      <View style={styles.floorRow}>
                        <Icon name="layers-outline" size={12} color="#94A3B8" />
                        <Text style={styles.floorText}>{app.floor}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '1A', borderColor: getStatusColor(app.status) + '55' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(app.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                      {formatStatus(app.status)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Icon name="logout-variant" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  backBar: {
    padding: 8,
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  guestLoginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  profileBanner: {
    height: 72,
    backgroundColor: colors.primary,
    opacity: 0.92,
  },
  profileCardBody: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: -42,
    marginBottom: 12,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  avatarLoadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 42,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  infoRowsContainer: {
    width: '100%',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },

  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18,
  },

  slotCard: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    elevation: 1,
  },
  slotCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  slotIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floorText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error + '55',
    backgroundColor: colors.error + '0A',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    marginHorizontal: 16,
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalDivider: {
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    height: 1,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },

  avatarPickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPickerTouch: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tapToChangeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  prefixContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRightWidth: 0,
    marginTop: 0,
  },
  prefixText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  saveBtn: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },

  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  settingsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTextBox: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingsItemDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },

  verifyEmailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  verifyEmailText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 19,
  },
});