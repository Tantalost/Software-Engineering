import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, Platform, RefreshControl, KeyboardAvoidingView } from 'react-native';
import { Card, SegmentedButtons, Text, Button, ActivityIndicator, Modal, Portal, TextInput, RadioButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../src/config';

// 1. LEGACY IMPORT FIX FOR EXPO 52+
// @ts-ignore 
import * as FileSystem from 'expo-file-system/legacy'; 

// 2. IMPORT PRINT & SHARING FOR CONTRACT GENERATION
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// 3. IMPORT AUTH COMPONENT
import AuthScreen from '../../src/components/AuthScreen';

// --- CONFIGURATION ---
const BILLING_CONFIG = {
  Permanent: { amountLabel: "₱ 6,000.00", periodLabel: "30 DAYS", rawAmount: 6000 },
  NightMarket: { amountLabel: "₱ 1,120.00", periodLabel: "7 DAYS", rawAmount: 1120 }
};

const PAYMENT_INFO = {
  billerName: "OFFICE OF THE CITY ADMINISTRATOR",
  project: "ZC-IBT PERMANENT / NIGHT MARKET STALLS",
  note: "NO PARTIAL PAYMENT! NO PAYMENT - NO ENTRY / NO OPERATION OF STALL.",
  contactInfo: "(062) 991-1630 / (062) 991-4985"
};

// --- TYPES ---
type UserData = {
  id: string;
  name: string;
  email: string;
  contact: string;
};

type FileState = {
  permit: DocumentPicker.DocumentPickerAsset | null;
  validId: DocumentPicker.DocumentPickerAsset | null;
  clearance: DocumentPicker.DocumentPickerAsset | null;
  receipt: DocumentPicker.DocumentPickerAsset | null;
  contract: DocumentPicker.DocumentPickerAsset | null;
};

type ApplicationData = {
  status: 'VERIFICATION_PENDING' | 'PAYMENT_UNLOCKED' | 'PAYMENT_REVIEW' | 'CONTRACT_PENDING' | 'CONTRACT_REVIEW' | 'TENANT';
  targetSlot: string;
  floor: string; 
  contact: string;
  name: string;
  paymentReference?: string;
  [key: string]: any;
} | null;

export default function StallsPage() {
  // --- AUTH STATE ---
  const [user, setUser] = useState<UserData | null>(null);

  // --- APP STATE ---
  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<string | null>(null);
  const [occupiedStalls, setOccupiedStalls] = useState<string[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'form' | 'review'>('form'); 
  const [myApplication, setMyApplication] = useState<ApplicationData>(null);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contact: '',
    email: '',
    productType: 'food', 
    otherProduct: '',
  });

  const handleContactChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, contact: digits }));
  };

  const [paymentData, setPaymentData] = useState({
    referenceNo: ''
  });

  const [files, setFiles] = useState<FileState>({
    permit: null, validId: null, clearance: null, receipt: null, contract: null
  });

  // --- BILLING LOGIC ---

  // 1. For Payment Screen (Prioritizes existing application data)
  const currentBilling = useMemo(() => {
    const floorType = myApplication ? myApplication.floor : selectedFloor;
    return floorType === 'Night Market' ? BILLING_CONFIG.NightMarket : BILLING_CONFIG.Permanent;
  }, [selectedFloor, myApplication]);

  // 2. For Application Modal (Prioritizes current SELECTION, ignoring old app history)
  const modalBilling = useMemo(() => {
    return selectedFloor === 'Night Market' ? BILLING_CONFIG.NightMarket : BILLING_CONFIG.Permanent;
  }, [selectedFloor]);

  // --- 1. INITIALIZATION & AUTH CHECK ---
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('ibt_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        handleLoginSuccess(parsedUser); 
      }
    } catch (e) {
      console.error("Auth Load Error", e);
    }
  };

  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    setFormData(prev => ({
        ...prev,
        firstName: userData.name.split(' ')[0] || '',
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        contact: userData.contact || ''
    }));
    fetchData(userData.id);
  };

  const handleLogout = async () => {
      await AsyncStorage.removeItem('ibt_user');
      setUser(null);
      setMyApplication(null);
  };

  const fetchData = async (userId: string | undefined, isBackgroundRefresh = false) => {
    // Only show spinner if it's NOT a background refresh
    if (!isBackgroundRefresh) setLoading(true);
    
    try {
      // 1. Fetch Occupied Slots
      const stallsRes = await fetch(`${API_URL}/stalls/occupied?floor=${selectedFloor}`);
      const stallsData = await stallsRes.json();
      setOccupiedStalls(stallsData);

      // 2. Fetch Application
      if (userId) {
          const myAppRes = await fetch(`${API_URL}/stalls/my-application/${userId}`);
          const myAppData = await myAppRes.json();
          setMyApplication(myAppData);
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      // Turn off loading indicators
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // --- POLL FOR UPDATES (Every 3 seconds) ---
  useEffect(() => {
    // 1. Initial Fetch (Shows Spinner)
    if (user) fetchData(user.id);
    else fetchData(undefined);

    // 2. Background Interval (Silent - No Spinner)
    const interval = setInterval(() => {
        if (user) fetchData(user.id, true); // true = isBackgroundRefresh
        else fetchData(undefined, true);
    }, 3000); 

    return () => clearInterval(interval);
  }, [user, selectedFloor]);


  // --- 3. FILE HANDLING ---
  const pickFile = async (fileType: keyof FileState) => {
    try {
      const docType = fileType === 'contract' ? 'application/pdf' : ['image/*'];
      const result = await DocumentPicker.getDocumentAsync({ type: docType, copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFiles(prev => ({ ...prev, [fileType]: result.assets[0] }));
      }
    } catch (err) {
      console.log("Error picking file: ", err);
    }
  };

  const convertPdfToText = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      throw new Error("PDF processing failed");
    }
  };

  const convertImageToText = async (uri: string) => {
    try {
        const manipulated = await ImageManipulator.manipulateAsync(
            uri, [{ resize: { width: 800 } }], 
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        return `data:image/jpeg;base64,${manipulated.base64}`;
    } catch (error) { throw new Error("Image processing failed"); }
  };

  // --- 4. PDF GENERATOR ---
  const generateContractPDF = async () => {
    try {
      setApplying(true);
      const currentName = myApplication?.name || user?.name || "________";
      const currentAddress = "Zamboanga City"; 
      const currentSlot = myApplication?.targetSlot || "________";
      const currentRent = currentBilling.amountLabel;
      const currentDate = new Date().toLocaleDateString();

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
              h1 { text-align: center; font-size: 18px; text-transform: uppercase; margin-bottom: 20px; }
              .section { margin-top: 15px; font-weight: bold; text-transform: uppercase; }
              .content { margin-left: 20px; }
              .center { text-align: center; }
              .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
              .sig-line { border-top: 1px solid black; width: 45%; text-align: center; padding-top: 5px; }
            </style>
          </head>
          <body>
            <h1>COMMERCIAL LEASE AND STALL MANAGEMENT AGREEMENT</h1>
            <p><strong>THIS LEASE AGREEMENT</strong> is made and entered into this <u>${currentDate}</u>, by and between:</p>
            <p><strong>LESSOR:</strong><br/><strong>IBT COMPANY</strong>, with principal office at Zamboanga City, represented by the City Administrator.</p>
            <p class="center"><strong>- AND -</strong></p>
            <p><strong>LESSEE:</strong><br/><strong>${currentName}</strong>, of legal age, with address at <u>${currentAddress}</u>.</p>
            <hr/>
            <div class="section">1. PREMISES</div>
            <div class="content">The LESSOR hereby leases to the LESSEE the commercial stall described as:<br/><strong>Stall Number:</strong> ${currentSlot}<br/><strong>Location:</strong> ZC-IBT Terminal</div>
            <div class="section">2. RENT</div>
            <div class="content">The LESSEE agrees to pay a monthly rent of <strong>${currentRent}</strong>.</div>
            <div class="section">3. RULES AND REGULATIONS</div>
            <div class="content">The LESSEE agrees to abide by all rules set forth by IBT Company regarding fire safety, waste disposal, and noise control.</div>
            <div class="signature-block">
              <div class="sig-line"><strong>IBT Representative</strong><br/>LESSOR</div>
              <div class="sig-line"><strong>${currentName}</strong><br/>LESSEE</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
    } finally {
      setApplying(false);
    }
  };

  // --- 5. SUBMISSION HANDLERS ---
  const handleReview = () => {
    if (!formData.firstName || !formData.contact || !selectedStall) { return Alert.alert("Incomplete", "Please fill in Name, Contact & Select a Stall."); }
    if (!files.permit || !files.validId || !files.clearance) { return Alert.alert("Missing Photos", "Please upload Permit, Valid ID, and Barangay Clearance."); }
    setModalStep('review');
  };

  const submitApplication = async () => {
    if (!user) return;
    setApplying(true);
    try {
      const permitBase64 = await convertImageToText(files.permit!.uri);
      const idBase64 = await convertImageToText(files.validId!.uri);
      const clearanceBase64 = await convertImageToText(files.clearance!.uri);
      const fullCombinedName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`;

      const payload = {
        userId: user.id, 
        name: fullCombinedName,
        contact: formData.contact,
        email: formData.email,
        product: formData.productType === 'other' ? formData.otherProduct : formData.productType,
        targetSlot: selectedStall, 
        floor: selectedFloor, 
        permitUrl: permitBase64, 
        validIdUrl: idBase64,
        clearanceUrl: clearanceBase64,
        devicePlatform: Platform.OS
      };

      const res = await fetch(`${API_URL}/stalls/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Server rejected application");
      }

      setModalVisible(false); setModalStep('form'); 
      Alert.alert("Success", "Application Submitted!"); fetchData(user.id); setSelectedStall(null);
    } catch (error: any) { 
        Alert.alert("Submission Failed", error.message); 
    } finally { setApplying(false); }
  };

  const submitPaymentReceipt = async () => {
    if (!user || !files.receipt) { return Alert.alert("Missing Receipt", "Please upload the receipt."); }
    if (!paymentData.referenceNo) { return Alert.alert("Missing Details", "Please enter the Reference Number."); }

    setApplying(true);
    try {
      const receiptBase64 = await convertImageToText(files.receipt.uri);
      // Use currentBilling for payment processing
      const payload = { userId: user.id, receiptUrl: receiptBase64, paymentReference: paymentData.referenceNo, paymentAmount: currentBilling.rawAmount };

      const res = await fetch(`${API_URL}/stalls/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Server payment error");
      Alert.alert("Sent", "Payment submitted for review."); fetchData(user.id);
    } catch (error) { Alert.alert("Error", "Could not process receipt."); } finally { setApplying(false); }
  };

  const submitContract = async () => {
    if (!user || !files.contract) { return Alert.alert("Missing Contract", "Please upload the signed contract PDF."); }
    setApplying(true);
    try {
        const contractBase64 = await convertPdfToText(files.contract.uri);
        const res = await fetch(`${API_URL}/stalls/upload-contract`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, contractUrl: contractBase64 })
        });

        if (!res.ok) { const errText = await res.text(); throw new Error(errText || "Server contract error"); }
        Alert.alert("Success", "Contract PDF submitted for final approval."); fetchData(user.id);
    } catch (error: any) { Alert.alert("Upload Failed", error.message); } finally { setApplying(false); }
  };

  const isStallOccupied = (slotLabel: string) => occupiedStalls.includes(slotLabel);
  const handleStallPress = (slotLabel: string) => {
    if (isStallOccupied(slotLabel)) { return Alert.alert('Occupied', `Slot ${slotLabel} is taken.`); }
    setSelectedStall(prev => prev === slotLabel ? null : slotLabel);
  };
  const availableCount = 30 - occupiedStalls.length;


  // ============================
  //      RENDER LOGIC
  // ============================

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 1. VERIFICATION PENDING
 // 1. VERIFICATION PENDING (Adjusted Layout)
  if (myApplication?.status === "VERIFICATION_PENDING") {
    return (
      <SafeAreaView style={styles.container}>
        
        {/* Header - Consistent with Payment Screen */}
        <View style={styles.header}>
            <Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>
                Application Status
            </Text>
            <TouchableOpacity onPress={handleLogout}>
                <Icon name="logout" size={24} color="#D32F2F" />
            </TouchableOpacity>
        </View>

        {/* Centered Content */}
        <View style={styles.centerContent}>
            
            <Icon name="timer-sand" size={80} color="#FFA000" style={{ marginBottom: 10, marginTop: 50 }} />
            
            <Text variant="headlineMedium" style={styles.statusTitle}>
                Under Review
            </Text>
            
            <Card style={styles.statusCard} mode="elevated">
                <Card.Content>
                    <Text style={styles.statusText}>
                        Applying for Slot: <Text style={{fontWeight:'bold', color:'#333'}}>{myApplication.targetSlot}</Text>
                    </Text>
                    
                    <Text style={[styles.statusText, {marginTop: 5}]}>
                        Section: <Text style={{fontWeight:'bold', color:'#333'}}>{myApplication.floor}</Text>
                    </Text>
                    
                    <Divider style={{ marginVertical: 15 }} />
                    
                    <Text style={[styles.statusText, {fontSize: 14, color: '#666', fontStyle: 'italic'}]}>
                        "Our Admin is currently reviewing your submitted documents. Please check back later."
                    </Text>
                </Card.Content>
            </Card>
            
          

        </View>
      </SafeAreaView>
    );
  }

  // 2. CONTRACT UPLOAD PHASE 
  if (myApplication?.status === "CONTRACT_PENDING" || myApplication?.status === "CONTRACT_REVIEW") {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>Contract</Text>
                <TouchableOpacity onPress={handleLogout}><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 20, alignItems:'center'}}>
                <Icon name="pen" size={64} color="#1B5E20" />
                <Text variant="headlineSmall" style={{color: '#1B5E20', fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>Contract Signing</Text>
                <Card style={[styles.statusCard, {marginTop: 20}]}>
                    <Card.Content>
                        <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 1: Download & Sign</Text>
                        <Button mode="contained" icon="download" onPress={generateContractPDF} style={{marginBottom: 25, backgroundColor: '#0288D1'}}>Download Contract PDF</Button>
                        <Divider style={{marginBottom: 20}} />
                        <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 2: Upload Signed PDF</Text>
                        <Button mode="outlined" onPress={() => pickFile('contract')} icon="file-pdf-box" textColor="green" style={{marginBottom: 20, borderColor: 'green'}}>
                            {files.contract ? "File Attached" : "Upload Signed PDF"}
                        </Button>
                        <Button mode="contained" onPress={submitContract} loading={applying} disabled={myApplication.status === "CONTRACT_REVIEW"} style={{backgroundColor: '#1B5E20'}} textColor='#ffffffff'>
                            {myApplication.status === "CONTRACT_REVIEW" ? "Under Review..." : "Submit Contract"}
                        </Button>
                    </Card.Content>
                </Card>
               
            </ScrollView>
        </SafeAreaView>
    );
  }

  // 3. PAYMENT PHASE (LAYOUT FIXED)
  if (myApplication?.status === "PAYMENT_UNLOCKED" || myApplication?.status === "PAYMENT_REVIEW") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>Payment</Text>
            <TouchableOpacity onPress={handleLogout}><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{padding: 20}}>
            <View style={{alignItems:'center', marginBottom: 20}}>
                <Icon name="file-document-outline" size={50} color="#1B5E20" />
                <Text variant="headlineSmall" style={styles.pageTitle}>STALL ORDER OF PAYMENT</Text>
            </View>
            <Card style={styles.paymentCard} mode="elevated">
              <View style={styles.paymentHeaderBg}><Text style={styles.paymentHeaderTitle}>{PAYMENT_INFO.billerName}</Text><Text style={styles.paymentHeaderSub}>{PAYMENT_INFO.project}</Text></View>
              <Card.Content style={{paddingTop: 20, paddingBottom: 20}}>
                <View style={styles.paymentRow}><Text style={styles.paymentLabel}>STALL NUMBER</Text><Text style={styles.paymentValue}>{myApplication.targetSlot}</Text></View>
                <View style={styles.paymentRow}><Text style={styles.paymentLabel}>REGISTERED OWNER</Text><Text style={[styles.paymentValue, { textTransform: 'uppercase' }]}>{myApplication.name}</Text></View>
                <View style={styles.paymentRow}><Text style={styles.paymentLabel}>RENTAL PERIOD</Text><Text style={[styles.paymentValue, {color: '#1B5E20'}]}>{currentBilling.periodLabel}</Text></View>
                <View style={styles.divider} />
                <View style={styles.totalBlock}><Text style={styles.totalLabel}>TOTAL AMOUNT TO BE PAID IN FULL</Text><Text style={styles.totalAmount}>{currentBilling.amountLabel}</Text><Text style={styles.totalNote}>(NO PARTIAL PAYMENT)</Text></View>
              </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.sectionHeader}>Verification Details</Text>
            <TextInput label="OR / Reference No." value={paymentData.referenceNo} onChangeText={t => setPaymentData({...paymentData, referenceNo: t})} mode="outlined" style={styles.input} activeOutlineColor="#1B5E20" textColor="black" />
            <Button mode="outlined" onPress={() => pickFile('receipt')} icon="camera" textColor="green" style={{marginBottom: 15, borderColor: 'green'}}>{files.receipt ? "Receipt Attached" : "Upload Receipt Photo"}</Button>
            <Button mode="contained" onPress={submitPaymentReceipt} loading={applying} disabled={myApplication.status === "PAYMENT_REVIEW"} style={styles.submitButton} textColor="white">{myApplication.status === "PAYMENT_REVIEW" ? "Verifying..." : "Submit Payment"}</Button>
          
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. DEFAULT: STALL SELECTION MAP
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Stall Availability</Text>
        <TouchableOpacity onPress={handleLogout} style={{flexDirection:'row', alignItems:'center', gap:5}}>
            
            <Icon name="logout" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(user.id)} colors={['#1B5E20']} />}>
        <Card style={styles.floorCard} mode="elevated"><Card.Content><Text variant="titleMedium" style={styles.sectionTitle}>Select Location</Text><SegmentedButtons value={selectedFloor} onValueChange={(val) => { setSelectedFloor(val); setSelectedStall(null); }} theme={{colors: {secondaryContainer: 'black', onSecondaryContainer: 'white', }}} buttons={[{ value: 'Permanent', label: 'Permanent', uncheckedColor: 'black'}, { value: 'Night Market', label: 'Night Market', uncheckedColor: 'black' }]} /></Card.Content></Card>
        {loading ? <ActivityIndicator animating={true} color="#1B5E20" style={{marginTop: 20}} /> : (
          <View> 
            <View style={styles.summaryContainer}><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#fff', borderWidth:1, borderStyle:'dashed'}]}/><Text style= {{color: "#504e4eff"}}> Available ({availableCount})</Text></View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#F44336'}]}/><Text style= {{color: "#504e4eff"}}>Occupied</Text></View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]}/><Text style= {{color: "#504e4eff"}}>Selected</Text></View></View>
            <Card style={styles.layoutCard}><Card.Content><View style={styles.gridContainer}>{Array.from({ length: 30 }).map((_, i) => { const slotLabel = selectedFloor === 'Permanent' ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`; const occupied = isStallOccupied(slotLabel); const selected = selectedStall === slotLabel; return (<TouchableOpacity key={slotLabel} style={[styles.stallBase, occupied ? styles.stallOccupied : selected ? styles.stallSelected : styles.stallAvailable]} onPress={() => handleStallPress(slotLabel)} disabled={occupied}><Text style={[styles.slotLabelMain, occupied || selected ? styles.stallTextWhite : styles.stallTextAvailable]}>{slotLabel}</Text></TouchableOpacity>); })}</View></Card.Content></Card>
            {selectedStall && (<Card style={styles.infoCard}><Card.Content><Text style={{color: "#0a0a0aff"}} variant="titleMedium">Slot Selected: {selectedStall}</Text><Button mode="contained" onPress={() => { setModalStep('form'); setModalVisible(true); }} style={{ marginTop: 15, backgroundColor: '#1B5E20'}}> <Text> Apply for {selectedStall}</Text> </Button></Card.Content></Card>)}
          </View> 
        )}
      </ScrollView>

      {/* MODAL FOR NEW APPLICATIONS */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <ScrollView>
            {modalStep === 'form' ? (
              <View>
                <Text variant="headlineSmall" style={{marginBottom: 15, fontWeight:'bold', color: '#1B5E20'}}>New Application</Text>
                <View style={{marginBottom: 15, padding: 10, backgroundColor: '#E8F5E9', borderRadius: 8}}>
                    <Text style={{fontSize: 12, color: '#444'}}>Selected Section:</Text>
                    <Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{selectedFloor}</Text>
                    
                    <Text style={{fontSize: 12, color: '#444', marginTop: 5}}>Applicable Rent:</Text>
                    {/* UPDATED: Uses modalBilling to ensure Night Market rent is shown correctly */}
                    <Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{modalBilling.amountLabel} / {modalBilling.periodLabel}</Text>
                </View>

                <TextInput label="First Name" value={formData.firstName} onChangeText={t => setFormData({...formData, firstName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" />
                <TextInput label="Middle Name" value={formData.middleName} onChangeText={t => setFormData({...formData, middleName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" />
                <TextInput label="Last Name" value={formData.lastName} onChangeText={t => setFormData({...formData, lastName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" />
                <TextInput label="Contact (09XXXXXXXXX)" value={formData.contact} onChangeText={handleContactChange} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" keyboardType="number-pad" maxLength={11} right={<TextInput.Affix text="/11" />} />
                <TextInput label="Email" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} style={styles.input} textColor='black'mode="outlined" outlineColor="grey" activeOutlineColor="black" keyboardType="email-address" />
                <Text variant="titleMedium" style={{marginTop:10, color: "#000" }}>Product Type</Text>
                <RadioButton.Group onValueChange={val => setFormData({...formData, productType: val})} value={formData.productType}><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="food"/><Text style={{color: "#292525ff"}} >Food</Text></View><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="clothing"/><Text style={{color: "#292525ff"}}>Clothing</Text></View><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="other"/><Text style={{color: "#292525ff"}}>Others, please specify</Text></View></RadioButton.Group>{formData.productType === 'other' && (<TextInput label="Specify Product" value={formData.otherProduct} onChangeText={t => setFormData({...formData, otherProduct: t})} style={[styles.input, {marginTop: 5}]} textColor='black' mode="outlined" activeOutlineColor="black" />)}<Text variant="titleMedium" style={{marginTop:15, marginBottom: 5, color: "#000"}}>Required Documents</Text><Button mode="outlined" onPress={() => pickFile('permit')} style={styles.fileButton} icon={files.permit ? "check" : "file-document-outline"} textColor={files.permit ? "green" : "grey"}>{files.permit ? "Business Permit Attached" : "Upload Business Permit"}</Button><Button mode="outlined" onPress={() => pickFile('validId')} style={styles.fileButton} icon={files.validId ? "check" : "card-account-details-outline"} textColor={files.validId ? "green" : "grey"}>{files.validId ? "Valid ID Attached" : "Upload Valid ID"}</Button><Button mode="outlined" onPress={() => pickFile('clearance')} style={styles.fileButton} icon={files.clearance ? "check" : "file-certificate-outline"} textColor={files.clearance ? "green" : "grey"}>{files.clearance ? "Barangay Clearance Attached" : "Upload Brgy. Clearance"}</Button>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20}}><Button onPress={() => setModalVisible(false)} textColor='grey'>Cancel</Button><Button mode="contained" onPress={handleReview} buttonColor="#1B5E20"><Text style= {{fontWeight: 'bold'}}>Review Application</Text></Button></View>
              </View>
            ) : (
              // REVIEW VIEW
              <View>
                <Text variant="headlineSmall" style={{marginBottom: 15, fontWeight:'bold', color: '#1B5E20', textAlign:'center'}}>Confirm Application</Text>
                <View style={styles.reviewSection}><Text style={styles.reviewLabel}>APPLICANT NAME:</Text><Text style={styles.reviewValue}>{formData.firstName} {formData.middleName} {formData.lastName}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>CONTACT NUMBER:</Text><Text style={styles.reviewValue}>{formData.contact}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>EMAIL:</Text><Text style={styles.reviewValue}>{formData.email || "N/A"}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>PRODUCT TYPE:</Text><Text style={styles.reviewValue}>{formData.productType === 'other' ? formData.otherProduct : formData.productType.toUpperCase()}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>TARGET SLOT:</Text><Text style={[styles.reviewValue, {color: '#1B5E20'}]}>{selectedStall} ({selectedFloor})</Text></View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}><Button mode="outlined" onPress={() => setModalStep('form')} textColor='grey' style={{borderColor:'grey'}}>Edit Details</Button><Button mode="contained" onPress={submitApplication} loading={applying} buttonColor="#1B5E20" textColor='#f3f0f0'>Confirm & Submit</Button></View>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // --- HEADER & TITLE ---
  header: { 
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 15, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
  },
  headerTitle: { fontWeight: '700', color: "#0a0a0aff"},
  pageTitle: { color: '#1B5E20', fontWeight: 'bold', marginTop: 10, textAlign: 'center', fontSize: 22 },

  // --- PAYMENT CARD (FIXED LAYOUT) ---
  paymentCard: { backgroundColor: 'white', marginBottom: 20, overflow: 'hidden', borderRadius: 12 },
  paymentHeaderBg: { backgroundColor: '#1B5E20', padding: 15 },
  paymentHeaderTitle: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  paymentHeaderSub: { color: 'white', textAlign: 'center', fontSize: 12, opacity: 0.9 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 8 },
  paymentLabel: { flex: 0.4, color: '#666', fontWeight: '600', fontSize: 12, marginTop: 2 },
  paymentValue: { flex: 0.6, textAlign: 'right', fontWeight: 'bold', fontSize: 14, color: "#333", flexWrap: 'wrap' },

  // --- TOTAL BLOCK ---
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 10 },
  totalBlock: { alignItems: 'center', marginVertical: 10, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 8 },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#C62828', marginVertical: 5 },
  totalNote: { fontSize: 10, color: '#C62828', fontWeight: 'bold' },

  // --- GENERAL ---
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionHeader: { marginBottom: 10, fontWeight: 'bold', marginTop: 10, color: "#333" },
  input: { marginBottom: 15, backgroundColor: 'white' },
  submitButton: { backgroundColor: '#1B5E20', paddingVertical: 5, borderRadius: 8 },
  fileButton: { marginTop: 10, borderColor: '#ccc' },
  
  // --- STATUS & MAP STYLES ---
  statusCard: { marginTop: 20, width: '100%', backgroundColor: 'white' },
  statusTitle: { marginTop: 20, fontWeight: 'bold',color: "#444"},
  statusText: { fontSize: 16, textAlign: 'center', color: "#666" },
  sectionTitle: { fontWeight: '600', marginBottom: 12, color: "#0a0a0aff"},
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  stallBase: { width: '23%', aspectRatio: 1, marginBottom: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stallAvailable: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  stallOccupied: { backgroundColor: '#F44336' },
  stallSelected: { backgroundColor: '#4CAF50' },
  slotLabelMain: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stallTextAvailable: { color: '#999', fontSize: 12 },
  stallTextWhite: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  floorCard: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  layoutCard: {  marginBottom: 10, backgroundColor: '#FFFFFF' },
  infoCard: { marginTop: 8, backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, maxHeight: '90%' },
  summaryContainer: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center'},
  reviewSection: { padding: 15, backgroundColor: '#FAFAFA', borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  reviewLabel: { fontSize: 11, color: '#777', fontWeight: '600', marginBottom: 2 },
  reviewValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 }
});