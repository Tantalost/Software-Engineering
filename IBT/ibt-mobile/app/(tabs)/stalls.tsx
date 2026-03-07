import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, ScrollView, TouchableOpacity, View, Platform, RefreshControl } from 'react-native';
import { Card, SegmentedButtons, Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import * as FileSystem from 'expo-file-system/legacy'; 

const customRandomValues = (array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
};

if (typeof global.crypto !== 'object') {
  (global as any).crypto = {};
}
if (typeof (global as any).crypto.getRandomValues !== 'function') {
  (global as any).crypto.getRandomValues = customRandomValues;
}

const CryptoJS = require('crypto-js');

import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '@/src/config'; 

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AuthScreen from '@/src/AuthScreen'; 
import styles from '@/src/styles/stallsStyle'; 
import { colors } from '@/src/themes/stallsColors'; 
import GuidelinesModal from '@/src/components/stalls/GuidelinesModal';

import { UserData, FileState, ApplicationData, FormData as FormDataType } from '@/src/types/StallTypes';
import { BILLING_CONFIG } from '@/src/constants/StallConstants';
import StallGrid from '@/src/components/stalls/StallGrid';
import ApplicationModal from '@/src/components/stalls/ApplicationModal';
import { 
  VerificationPendingView, 
  ContractReviewView, 
  ContractPendingView, 
  PaymentReviewView, 
  PaymentUnlockedView, 
  TenantView,
  RejectedView
} from '@/src/components/stalls/StatusViews';

const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || " "; 

export default function StallsPage() {

  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [phone, setPhone] = useState('');

  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<string | null>(null);
  const [occupiedStalls, setOccupiedStalls] = useState<string[]>([]);
  const [pendingStalls, setPendingStalls] = useState<string[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'form' | 'review'>('form'); 
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);

  const [myApplications, setMyApplications] = useState<ApplicationData[]>([]);
  const [viewIndex, setViewIndex] = useState<number>(-1); 
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contact: '',
    email: '',
    productType: 'food_non_alcoholic', 
    otherProduct: '',
  });

  const [paymentData, setPaymentData] = useState({
    referenceNo: ''
  });

  const [files, setFiles] = useState<FileState>({
    permit: null, validId: null, clearance: null, receipt: null, contract: null,
    communityTax: null, policeClearance: null
  });

  const currentApp = (viewIndex >= 0 && viewIndex < myApplications.length) ? myApplications[viewIndex] : null;

  const currentBilling = useMemo(() => {
    const floorType = currentApp ? currentApp.floor : selectedFloor;
    return floorType === 'Night Market' ? BILLING_CONFIG.NightMarket : BILLING_CONFIG.Permanent;
  }, [selectedFloor, currentApp]);

  const modalBilling = useMemo(() => {
    return selectedFloor === 'Night Market' ? BILLING_CONFIG.NightMarket : BILLING_CONFIG.Permanent;
  }, [selectedFloor]);

 const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);
    setPhone(cleaned);
  };

  useFocusEffect(
    useCallback(() => {
      checkLogin();
    }, [])
  );

  const checkLogin = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('ibt_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (!user || user.id !== parsedUser.id) {
             handleLoginSuccess(parsedUser); 
        }
      } else {
        setUser(null);
        setMyApplications([]);
      }
    } catch (e) {
      console.error("Auth Load Error", e);
    }
  };

  const handleLoginSuccess = async (userData: UserData) => {

    await AsyncStorage.setItem('ibt_user', JSON.stringify(userData));
    if ((userData as any).token) {
        await AsyncStorage.setItem('token', (userData as any).token);
    }

    setUser(userData);
    setShowLogin(false);

    const safeName = userData.name || "";

    setFormData(prev => ({
        ...prev,
        firstName: safeName.split(' ')[0] || '',
        lastName: safeName.split(' ').slice(1).join(' ') || '',
        email: userData.email || '',
        contact: userData.contact || ''
    }));
    fetchData(userData.id);
  };

  const fetchData = async (userId: string | undefined, isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setLoading(true);

    try {
      const timestamp = new Date().getTime();

      const stallsRes = await fetch(`${API_URL}/stalls/occupied?floor=${selectedFloor}&_t=${timestamp}`);
      const occupiedData = await stallsRes.json();
      const occupiedList = Array.isArray(occupiedData) ? occupiedData : [];
      setOccupiedStalls(occupiedList);

      try {
        const pendingRes = await fetch(`${API_URL}/stalls/pending?floor=${selectedFloor}&_t=${timestamp}`);
    
        if (!pendingRes.ok) {
          const errorText = await pendingRes.text();
          console.log("SERVER ERROR PAGE:", errorText); 
          return;
        }

        const pendingData = await pendingRes.json();
        setPendingStalls(Array.isArray(pendingData) ? pendingData : []);
      } catch (err) {
        console.log("Error fetching pending slots:", err);
      }

      if (userId) {
          const myAppRes = await fetch(`${API_URL}/stalls/my-application/${userId}?_t=${timestamp}`);
          const myAppData = await myAppRes.json();
          
          let apps = [];
          if (Array.isArray(myAppData)) {
              apps = myAppData;
          } else if (myAppData && myAppData.targetSlot) {
              apps = [myAppData];
          }

          apps = apps.filter(app => {
              if (app.status === 'TENANT') {
                  if (app.floor === selectedFloor) {
                      if (!occupiedList.includes(app.targetSlot)) return false;
                  }
              }
              return true; 
          });

          setMyApplications(apps);
          
          if (viewIndex >= 0) {
              const currentSlot = myApplications[viewIndex]?.targetSlot;
              if (currentSlot && !apps.find(a => a.targetSlot === currentSlot)) {
                   setViewIndex(-1);
              }
          }
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    fetchData(user?.id).then(() => setRefreshing(false));
}, [user, selectedFloor]);
  
  useEffect(() => {
    if (user) fetchData(user.id);
    else fetchData(undefined);

    const interval = setInterval(() => {
        if (user) fetchData(user.id, true);
        else fetchData(undefined, true);
    }, 30000); 

    return () => clearInterval(interval);
  }, [user, selectedFloor]); 

  useEffect(() => {
    if (viewIndex >= 0 && myApplications.length === 0) {
        setViewIndex(-1);
    }
  }, [myApplications]);

 const pickFile = async (fileType: keyof FileState) => {
    try {
      
      let docType: string | string[] = ['image/*']; 
      
      if (fileType === 'contract') {
          docType = 'application/pdf';
      } else if (fileType === 'communityTax' || fileType === 'policeClearance') {
          docType = ['image/*', 'application/pdf']; 
      }

      const result = await DocumentPicker.getDocumentAsync({ type: docType, copyToCacheDirectory: true });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadProgress(prev => ({ ...prev, [fileType]: 0.1 }));
        setFiles(prev => ({ ...prev, [fileType]: result.assets![0] }));

        let currentProgress = 0.1;
        const interval = setInterval(() => {
            currentProgress += 0.2;
            if (currentProgress >= 1) {
                currentProgress = 1;
                clearInterval(interval);
                setTimeout(() => {
                    setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
                }, 1000); 
            }
            setUploadProgress(prev => ({ ...prev, [fileType]: currentProgress }));
        }, 100);
      }
    } catch (err) { console.log("Error picking file: ", err); }
  };

  const generateContractPDF = async () => {
    try {
      setApplying(true);
      const currentName = currentApp?.name || user?.name || "________";
      const currentSlot = currentApp?.targetSlot || "________";
      const currentRent = currentBilling.amountLabel;
      const currentDate = new Date().toLocaleDateString();

      const htmlContent = `<html><body><h1>LEASE AGREEMENT</h1><p>Lessee: ${currentName}</p><p>Slot: ${currentSlot}</p><p>Rent: ${currentRent}</p><p>Date: ${currentDate}</p></body></html>`;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) { Alert.alert("Error", "Could not generate PDF"); } finally { setApplying(false); }
  };

  const handleReview = () => {
    if (!formData.firstName || !formData.contact || !selectedStall) { 
        return Alert.alert("Incomplete", "Please fill in Name, Contact & Select a Stall."); 
    }
    if (!files.permit || !files.validId || !files.clearance) { 
        return Alert.alert("Missing Photos", "Please upload Permit, Valid ID, and Barangay Clearance."); 
    }
    
    if (selectedFloor === 'Night Market') {
        if (!files.communityTax || !files.policeClearance) {
            return Alert.alert("Missing Documents", "Please upload the Community Tax Certificate and Police Clearance.");
        }
    }
    setModalStep('review');
  };

  const encryptFileBeforeUpload = async (fileUri: string, fileName: string) => {
    try {
     
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const encryptedData = CryptoJS.AES.encrypt(fileData, SECRET_KEY).toString();

      const tempDir = FileSystem.cacheDirectory; 
      const tempUri = tempDir + 'enc_' + fileName.replace(/[^a-zA-Z0-9.]/g, '_'); 
      
      await FileSystem.writeAsStringAsync(tempUri, encryptedData, {
        encoding: FileSystem.EncodingType.UTF8
      });

      return tempUri;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error(`Failed to encrypt. ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const appendFile = (form: FormData, key: string, fileObj: any, encryptedUri: string | null = null) => {
    if (fileObj) {
        const uri = encryptedUri 
            ? (Platform.OS === 'android' ? encryptedUri : encryptedUri.replace('file://', ''))
            : (Platform.OS === 'android' ? fileObj.uri : fileObj.uri.replace('file://', ''));

        const name = fileObj.name || `${key}.jpg`;
        const type = 'application/octet-stream'; 
        
        form.append(key, {
            uri: uri,
            name: name,
            type: type,
        } as any);
    }
  };

  const handleApiError = async (res: any) => {
      if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = errorText;
          
          try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.error || parsed.message || errorText;
          } catch (e) {}

          if (res.status === 401 || res.status === 403 || errorMessage.toLowerCase().includes('token')) {
              await AsyncStorage.multiRemove(['ibt_user', 'token']);
              setUser(null);
              setModalVisible(false);
              setShowLogin(true); 
              throw new Error("Session expired. Please log in again.");
          }
          
          throw new Error(errorMessage || "Request failed");
      }
  };
  
  const submitApplication = async () => {
    if (!user) return;
    setApplying(true);
    
    setTimeout(async () => {
        try {
          const formPayload = new FormData();
          const fullCombinedName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}${formData.suffix ? ' ' + formData.suffix : ''}`.replace(/\s+/g, ' ').trim();
          
          formPayload.append('userId', user.id);
          formPayload.append('name', fullCombinedName);
          formPayload.append('contact', `+63${phone}`);
          formPayload.append('email', formData.email);
          formPayload.append('product', formData.productType === 'other' ? formData.otherProduct : formData.productType);
          formPayload.append('targetSlot', selectedStall || "");
          formPayload.append('floor', selectedFloor);
          formPayload.append('devicePlatform', Platform.OS);

          const encPermit = await encryptFileBeforeUpload(files.permit!.uri, files.permit!.name || 'permit.jpg');
          const encValidId = await encryptFileBeforeUpload(files.validId!.uri, files.validId!.name || 'validId.jpg');
          const encClearance = await encryptFileBeforeUpload(files.clearance!.uri, files.clearance!.name || 'clearance.jpg');

          appendFile(formPayload, 'permit', files.permit, encPermit);
          appendFile(formPayload, 'validId', files.validId, encValidId);
          appendFile(formPayload, 'clearance', files.clearance, encClearance);


          if (selectedFloor === 'Night Market') {
              const encCommTax = await encryptFileBeforeUpload(files.communityTax!.uri, files.communityTax!.name || 'communityTax.file');
              const encPolice = await encryptFileBeforeUpload(files.policeClearance!.uri, files.policeClearance!.name || 'policeClearance.file');

              appendFile(formPayload, 'communityTax', files.communityTax, encCommTax);
              appendFile(formPayload, 'policeClearance', files.policeClearance, encPolice);
          }

          const rawUser = await AsyncStorage.getItem('ibt_user');
          const token = await AsyncStorage.getItem('token') || (rawUser ? JSON.parse(rawUser).token : '');

          const res = await fetch(`${API_URL}/stalls/apply`, {
            method: 'POST',
            body: formPayload,
            headers: { 
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
          });

          await handleApiError(res);

          setModalVisible(false); 
          setModalStep('form'); 
          Alert.alert("Success", "Application Submitted!"); 
          await fetchData(user.id); 
          setSelectedStall(null);
          setViewIndex(0); 
        } catch (error: any) { 
            Alert.alert("Submission Failed", error.message); 
        } finally { 
            setApplying(false); 
        }
    }, 100);
  };

  const submitPaymentReceipt = async () => {
    if (!user || !files.receipt) { return Alert.alert("Missing Receipt", "Please upload the receipt."); }
    if (!paymentData.referenceNo) { return Alert.alert("Missing Details", "Please enter the Reference Number."); }
    if (!currentApp) return;

    setApplying(true);
    setTimeout(async () => {
        try {
          const formPayload = new FormData();
          formPayload.append('userId', user.id);
          formPayload.append('targetSlot', currentApp.targetSlot);
          formPayload.append('paymentReference', paymentData.referenceNo);
          formPayload.append('paymentAmount', currentBilling.rawAmount.toString());
          
          const encReceipt = await encryptFileBeforeUpload(files.receipt!.uri, files.receipt!.name || 'receipt.jpg');
          appendFile(formPayload, 'receipt', files.receipt, encReceipt);

          const rawUser = await AsyncStorage.getItem('ibt_user');
          const token = await AsyncStorage.getItem('token') || (rawUser ? JSON.parse(rawUser).token : '');

          const res = await fetch(`${API_URL}/stalls/pay`, { 
            method: 'POST', 
            body: formPayload, 
            headers: { 
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
          });

         await handleApiError(res);
          
          Alert.alert("Sent", "Payment submitted for review."); 
          fetchData(user.id);
        } catch (error) { 
            Alert.alert("Error", "Could not process receipt."); 
        } finally { 
            setApplying(false); 
        }
    }, 100);
  };

  const submitRenewalPayment = async () => {
    if (!user || !files.receipt) { return Alert.alert("Missing Receipt", "Please upload the payment receipt."); }
    if (!paymentData.referenceNo) { return Alert.alert("Missing Details", "Please enter the Reference Number."); }
    if (!currentApp) return;

    setApplying(true);
    setTimeout(async () => {
        try {
          const formPayload = new FormData();
          formPayload.append('userId', user.id);
          formPayload.append('tenantId', currentApp.tenantId || ""); 
          formPayload.append('targetSlot', currentApp.targetSlot);
          formPayload.append('paymentReference', paymentData.referenceNo);
          
          const encReceipt = await encryptFileBeforeUpload(files.receipt!.uri, files.receipt!.name || 'receipt.jpg');
          appendFile(formPayload, 'receipt', files.receipt, encReceipt);

          const rawUser = await AsyncStorage.getItem('ibt_user');
          const token = await AsyncStorage.getItem('token') || (rawUser ? JSON.parse(rawUser).token : '');

          const res = await fetch(`${API_URL}/stalls/pay-renewal`, { 
            method: 'POST', 
            body: formPayload, 
            headers: { 
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
          });

          await handleApiError(res);
          
          Alert.alert("Success", "Renewal payment submitted for review."); 
          setPaymentData({ referenceNo: '' });
          setFiles(prev => ({ ...prev, receipt: null }));
          fetchData(user.id);
        } catch (error) { 
            Alert.alert("Error", "Could not process receipt."); 
        } finally { 
            setApplying(false); 
        }
    }, 100);
  };

  const submitContract = async () => {
    if (!user || !files.contract) { return Alert.alert("Missing Contract", "Please upload the signed contract PDF."); }
    if (!currentApp) return;
    
    setApplying(true);
    setTimeout(async () => {
        try {
            const formPayload = new FormData();
            formPayload.append('userId', user.id);
            formPayload.append('targetSlot', currentApp.targetSlot);
            
            const encContract = await encryptFileBeforeUpload(files.contract!.uri, files.contract!.name || 'contract.pdf');
            appendFile(formPayload, 'contract', files.contract, encContract);

            const rawUser = await AsyncStorage.getItem('ibt_user');
            const token = await AsyncStorage.getItem('token') || (rawUser ? JSON.parse(rawUser).token : '');

            const res = await fetch(`${API_URL}/stalls/upload-contract`, { 
                method: 'POST', 
                body: formPayload, 
                headers: { 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            await handleApiError(res);
            
            Alert.alert("Success", "Contract PDF submitted."); 
            fetchData(user.id);
        } catch (error: any) { 
            Alert.alert("Upload Failed", error.message); 
        } finally { 
            setApplying(false); 
        }
    }, 100);
  };

  const isStallOccupied = (slotLabel: string) => occupiedStalls.includes(slotLabel);

  const handleStallPress = (slotLabel: string) => {
    const alreadyApplied = myApplications.find(a => a.targetSlot === slotLabel);
    const isOccupiedServerSide = isStallOccupied(slotLabel);

    if (alreadyApplied) { 
        
        if (!isOccupiedServerSide && (alreadyApplied.status === 'TENANT' || alreadyApplied.status === 'REJECTED')) {
             setSelectedStall(prev => prev === slotLabel ? null : slotLabel);
             return; 
        }
        return Alert.alert('Active', `You already have an active application for ${slotLabel}. Switch tabs to view it.`); 
    }

    if (isOccupiedServerSide) { return Alert.alert('Occupied', `Slot ${slotLabel} is taken.`); }
    setSelectedStall(prev => prev === slotLabel ? null : slotLabel);
  };

  const availableCount = 30 - occupiedStalls.length;

  if (showLogin) {
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
            <View style={{padding: 10, alignItems: 'flex-start'}}>
                <Button mode="text" icon="arrow-left" onPress={() => setShowLogin(false)} textColor='black'>
                    Back to Stalls
                </Button>
            </View>
            <AuthScreen onLoginSuccess={handleLoginSuccess} />
        </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (viewIndex === -1) {
        return (
           <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 125 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
                <Card style={styles.floorCard} mode="elevated"><Card.Content><Text variant="titleMedium" style={styles.sectionTitle}>Select Location</Text><SegmentedButtons value={selectedFloor} onValueChange={(val) => { setSelectedFloor(val); setSelectedStall(null); }} theme={{colors: {secondaryContainer: colors.black, onSecondaryContainer: colors.white }}} buttons={[{ value: 'Permanent', label: 'Permanent', uncheckedColor: colors.black}, { value: 'Night Market', label: 'Night Market', uncheckedColor: colors.black }]} /></Card.Content></Card>
                {loading ? <ActivityIndicator animating={true} color={colors.primary} style={{marginTop: 20}} /> : (
                <View> 
                    <View style={styles.summaryContainer}><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: colors.white, borderWidth:1, borderStyle:'dashed'}]}/><Text style={{color: colors.textMedium}}> Available ({availableCount})</Text></View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: colors.occupied}]}/><Text style={{color: colors.textMedium}}>Occupied</Text>
                    <View style={styles.summaryItem}>
                        <View style={[styles.legendDot, {backgroundColor: colors.warning}]}/> 
                        <Text style={{color: colors.textMedium}}>Under Review</Text>
                    </View>
                    </View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: colors.primaryLight}]}/><Text style={{color: colors.textMedium}}>Selected</Text></View></View>
                    <Card style={[styles.layoutCard]}>
                      <Card.Content>
                        <StallGrid 
                          selectedFloor={selectedFloor}
                          occupiedStalls={occupiedStalls}
                          pendingStalls={pendingStalls}
                          selectedStall={selectedStall}
                          onStallPress={handleStallPress}
                        />
                      </Card.Content>
                    </Card>
                    {selectedStall && (<Card style={styles.infoCard}><Card.Content><Text style={{color: colors.black}} variant="titleMedium">Slot Selected: {selectedStall}</Text>
                    
                  <Button 
                    mode="contained" 
                    onPress={() => { 
                        if (!user || !user.id) {
                            Alert.alert("Login Required", "You must log in to apply for a stall.",
                                [{ text: "Cancel", style: "cancel" }, { text: "Log In", onPress: () => { setModalVisible(false); setShowLogin(true); } }]
                            );
                            return; 
                        }
                        setModalStep('form'); 
                        setModalVisible(true); 
                    }} 
                    style={{ marginTop: 15, backgroundColor: colors.primary}}
                  > 
                     <Text> Apply for {selectedStall}</Text> 
                  </Button>
                    
                    </Card.Content></Card>)}
                </View> 
                )}
            </ScrollView>
        );
    }

    if (!currentApp) return <ActivityIndicator color={colors.primary} style={{marginTop: 50}} />;
    
    const appStatus = (currentApp.status || "VERIFICATION_PENDING").toUpperCase();
    
    if (appStatus === "VERIFICATION_PENDING" || appStatus === "PENDING") return <VerificationPendingView currentApp={currentApp} />;
    
    if (appStatus === "CONTRACT_REVIEW") return <ContractReviewView currentApp={currentApp} />;

    if (appStatus === "CONTRACT_PENDING") {
        return (
            <ContractPendingView 
                currentApp={currentApp} 
                generateContractPDF={generateContractPDF} 
                submitContract={submitContract} 
                applying={applying}
                files={files}
                uploadProgress={uploadProgress}
                onPickFile={pickFile}
            />
        );
    }
    
    if (appStatus === "PAYMENT_REVIEW") return <PaymentReviewView currentApp={currentApp} />;

    if (appStatus === "PAYMENT_UNLOCKED") {
        return (
            <PaymentUnlockedView 
                currentApp={currentApp} 
                currentBilling={currentBilling} 
                paymentData={paymentData} 
                setPaymentData={setPaymentData} 
                submitPaymentReceipt={submitPaymentReceipt} 
                applying={applying} 
                files={files}
                uploadProgress={uploadProgress}
                onPickFile={pickFile}
            />
        );
    }

    if (appStatus === "TENANT") {
        return (
            <TenantView 
                currentApp={currentApp} 
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                submitRenewal={submitRenewalPayment}
                applying={applying}
                files={files}
                uploadProgress={uploadProgress}
                onPickFile={pickFile}
            />
        );
    }

    if (appStatus === "REJECTED") {
        return <RejectedView currentApp={currentApp} />;
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
            <Text variant="headlineMedium" style={styles.headerTitle}>Stall Management</Text>
        </View>
        <TouchableOpacity onPress={() => setGuidelinesVisible(true)}>
            <Icon name="information-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {user && myApplications.length > 0 && (   
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: '#f0f0f0' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => setViewIndex(-1)} style={{ paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: viewIndex === -1 ? colors.primary : colors.white, borderWidth: 1, borderColor: colors.primary, marginRight: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="plus" size={16} color={viewIndex === -1 ? colors.white : colors.primary} style={{ marginRight: 5 }} />
                    <Text style={{ color: viewIndex === -1 ? colors.white : colors.primary, fontWeight: 'bold' }}>New Slot</Text>
                </TouchableOpacity>
                {myApplications.map((app, index) => {
   
    if (!app.targetSlot) return null; 

    const isActive = viewIndex === index;
    const isTenant = app.status === 'TENANT';

    return (
        <TouchableOpacity 
            key={index} 
            onPress={() => setViewIndex(index)} 
            style={{ 
                paddingHorizontal: 15, 
                paddingVertical: 8, 
                borderRadius: 20, 
                backgroundColor: isActive ? colors.primary : colors.white, 
                borderWidth: 1, 
                borderColor: colors.primary, 
                marginRight: 10, 
                flexDirection: 'row', 
                alignItems: 'center' 
            }}
        >
            <Icon 
                name={isTenant ? "store" : "clock-outline"} 
                size={16} 
                color={isActive ? colors.white : colors.primary} 
                style={{ marginRight: 5 }} 
            />
            <Text style={{ color: isActive ? colors.white : colors.primary, fontWeight: 'bold' }}>
                {app.targetSlot}
            </Text>
        </TouchableOpacity>
    );
})}
            </ScrollView>
        </View>
      )}

      <View style={{flex: 1}}>{renderContent()}</View>
            
      <GuidelinesModal visible={guidelinesVisible} onDismiss={() => setGuidelinesVisible(false)} />

      <ApplicationModal 
        visible={modalVisible}
        step={modalStep}
        setStep={setModalStep}
        formData={formData}
        setFormData={setFormData}
        phone={phone}
        handlePhoneChange={handlePhoneChange}
        selectedStall={selectedStall}
        selectedFloor={selectedFloor}
        modalBilling={modalBilling}
        files={files}
        uploadProgress={uploadProgress}
        onPickFile={pickFile}
        onDismiss={() => setModalVisible(false)}
        onReview={handleReview}
        onSubmit={submitApplication}
        loading={applying}
      />

    </SafeAreaView>
  );
}