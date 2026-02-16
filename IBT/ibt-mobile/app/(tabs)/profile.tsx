import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, Avatar, Divider, Button, List, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker'; 

import AuthScreen from '@/src/AuthScreen';
import API_URL from '@/src/config'; 
import { colors } from '@/src/themes/stallsColors';

type UserData = {
  id: string;
  name: string;
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

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
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
      const res = await fetch(`${API_URL}/stalls/my-application/${userId}?_t=${timestamp}`);
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (error) {
      console.log("Error fetching apps for profile", error);
    }
  };

  const openEditModal = () => {
    if (!user) return;
    setEditForm({
        name: user.name,
        email: user.email,
        contact: user.contact,
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
      quality: 0.7,
    });

    if (!result.canceled) {
        setEditForm(prev => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
        const formData = new FormData();
        
        formData.append('userId', user.id);
        formData.append('name', editForm.name);
        formData.append('email', editForm.email);
        formData.append('contact', editForm.contact);

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
            name: data.user.name,
            email: data.user.email,
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
  
  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    setShowLogin(false);
    fetchApplications(userData.id);
  };

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.removeItem('ibt_user');
          setUser(null);
          setApplications([]);
          router.replace('/'); 
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TENANT': return colors.success || '#4CAF50';
      case 'VERIFICATION_PENDING': return colors.warning;
      case 'PAYMENT_UNLOCKED': return '#2196F3';
      case 'CONTRACT_PENDING': return '#9C27B0';
      default: return 'grey';
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ');

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (showLogin) {
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
            <View style={{padding: 10, alignItems: 'flex-start'}}>
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
          <Text variant="titleMedium" style={{marginTop: 20, color: 'grey'}}>Please log in to view your profile.</Text>
            <Button mode="contained" onPress={() => setShowLogin(true)} style={{marginTop: 20, backgroundColor: colors.primary}} textColor='white'>
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
            <Text variant="headlineSmall" style={{textAlign:'center', fontWeight:'bold', marginBottom: 20, color: colors.textDark}}>Edit Profile</Text>
            
            <View style={{alignItems:'center', marginBottom: 20}}>
                <TouchableOpacity onPress={pickImage}>
                    {editForm.avatar ? (
                         <Avatar.Image size={100} source={{uri: editForm.avatar}} />
                    ) : (
                         <Avatar.Text size={100} label={editForm.name.charAt(0)} style={{backgroundColor: colors.primary}} />
                    )}
                    <View style={{position:'absolute', bottom:0, right:0, backgroundColor:'white', borderRadius:15, padding:5, elevation:2, borderWidth: 1, borderColor:'#eee'}}>
                         <Icon name="camera" size={20} color={colors.primary} />
                    </View>
                </TouchableOpacity>
                <Text style={{fontSize: 12, color: 'grey', marginTop: 5}}>Tap to change photo</Text>
            </View>

            <TextInput label="Username" value={editForm.name} onChangeText={t => setEditForm({...editForm, name: t})} mode="outlined" textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} style={styles.input} />
            <TextInput label="Email" value={editForm.email} onChangeText={t => setEditForm({...editForm, email: t})} mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} />
            <TextInput label="Contact Number" value={editForm.contact} onChangeText={t => setEditForm({...editForm, contact: t})} mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} keyboardType="phone-pad" />

            <Button mode="contained" onPress={saveProfile} loading={saving} style={{marginTop: 15, backgroundColor: colors.primary}} textColor='white'>Save Changes</Button>
            <Button onPress={() => setEditModalVisible(false)} style={{marginTop: 5}} textColor="grey">Cancel</Button>
        </Modal>
      </Portal>

      <View style={styles.header}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
             <Text variant="headlineMedium" style={styles.headerTitle}>My Profile</Text>
             <TouchableOpacity onPress={openEditModal} style={{padding: 5}}>
                <Icon name="pencil" size={24} color={colors.primary} />
             </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfileData(); }} colors={[colors.primary]} />}
      >

        <View style={styles.profileSection}>
            {user.avatarUrl ? (
                <Avatar.Image size={80} source={{uri: user.avatarUrl}} />
            ) : (
                <Avatar.Text size={80} label={user.name.charAt(0)} style={{backgroundColor: colors.primary}} />
            )}
            <Text variant="headlineSmall" style={{marginTop: 15, fontWeight: 'bold', color: colors.black}}>{user.name}</Text>
            <Text variant="bodyMedium" style={{color: 'grey'}}>{user.email}</Text>
            <Text variant="bodyMedium" style={{color: 'grey'}}>{user.contact}</Text>
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
                                <Text variant="titleMedium" style={{fontWeight:'bold', color: colors.black}}>{app.targetSlot}</Text>
                                <Text variant="bodySmall" style={{color:'grey'}}>{app.floor}</Text>
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
                                <Text style={{color: 'white', fontSize: 10, fontWeight:'bold'}}>
                                    {formatStatus(app.status)}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            ))
        )}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Recent Payments</Text>
        {applications.flatMap(app => app.paymentHistory || []).length === 0 ? (
                <Text style={styles.emptyText}>No payment records found.</Text>
        ) : (
            <Card style={styles.historyCard} mode="elevated">
                {applications.flatMap(app => 
                    (app.paymentHistory || []).map(pay => ({...pay, slot: app.targetSlot}))
                ).sort((a,b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime())
                    .map((item, idx) => (
                    <View key={idx}>
                        <List.Item
                            title={`₱ ${item.amount ? item.amount.toLocaleString() : '0'}`}
                            description={`${item.slot} • Ref: ${item.referenceNo}`}
                            left={props => <List.Icon {...props} icon="cash-check" color={colors.primary} />}
                            right={() => <Text style={{fontSize: 11, alignSelf:'center', color:'grey'}}>{new Date(item.datePaid).toLocaleDateString()}</Text>}
                        />
                        <Divider />
                    </View>
                ))}
            </Card>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.textDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100 
  },
  centerContent: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: '#e0e0e0'
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  card: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderColor: '#eee'
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  emptyText: {
    fontStyle: 'italic',
    color: 'grey',
    fontSize: 13,
    marginBottom: 10
  },
  historyCard: {
    backgroundColor: '#fff',
    marginBottom: 20
  },
  logoutBtn: {
    marginTop: 20,
    borderColor: colors.error,
    borderWidth: 1
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    margin: 20,
    borderRadius: 15,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
    fontSize: 14
  }
});