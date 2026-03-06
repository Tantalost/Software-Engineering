import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { Card, Text, Button, Divider, TextInput } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import styles from '@/src/styles/stallsStyle'; 
import { colors } from '@/src/themes/stallsColors'; 
import { ApplicationData} from '@/src/types/StallTypes';
import FileUploadButton from '@/src/components/FileUploadButton';
import API_URL from '@/src/config';

export const VerificationPendingView = ({ currentApp }: { currentApp: ApplicationData }) => (
    <View style={styles.centerContent}>
        <Icon name="timer-sand" size={80} color={colors.warning} style={{ marginBottom: 10, marginTop: 50 }} />
        <Text variant="headlineMedium" style={styles.statusTitle}>Under Review</Text>
        <Card style={styles.statusCard} mode="elevated">
            <Card.Content>
                <Text style={styles.statusText}>Applying for Slot: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.targetSlot}</Text></Text>
                <Text style={[styles.statusText, {marginTop: 5}]}>Section: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.floor}</Text></Text>
                <Divider style={{ marginVertical: 15 }} />
                <Text style={[styles.statusText, {fontSize: 14, color: colors.textMedium, fontStyle: 'italic'}]}>"Our Admin is currently reviewing your submitted documents. Please check back later."</Text>
            </Card.Content>
        </Card>
    </View>
);

export const ContractReviewView = ({ currentApp }: { currentApp: ApplicationData }) => (
    <View style={styles.centerContent}>
        <Icon name="timer-sand" size={80} color={colors.warning} style={{marginBottom:10, marginTop:50}} />
        <Text variant="headlineMedium" style={styles.statusTitle}>Verifying Contract</Text>
        <Card style={styles.statusCard} mode="elevated">
            <Card.Content>
                <Text style={styles.statusText}>Contract for Slot: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.targetSlot}</Text></Text>
                <Divider style={{ marginVertical: 15 }} />
                <Text style={[styles.statusText, {fontSize: 14, color: colors.textMedium, fontStyle: 'italic'}]}>"We are currently reviewing your signed contract. Please wait for the final approval."</Text>
            </Card.Content>
        </Card>
    </View>
);

export const ContractPendingView = ({ currentApp, generateContractPDF, submitContract, applying, files, uploadProgress, onPickFile }: any) => (
    <ScrollView contentContainerStyle={{padding: 20, alignItems:'center'}}>
        <Icon name="pen" size={64} color={colors.primary} />
        <Text variant="headlineSmall" style={{color: colors.primary, fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>Contract Signing</Text>
        <Card style={[styles.statusCard, {marginTop: 20, width: '100%'}]}>
            <Card.Content>
                <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 1: Download & Sign</Text>
                <Button mode="contained" icon="download" onPress={generateContractPDF} style={{marginBottom: 25, backgroundColor: colors.primary}} textColor='white'>Download Contract PDF</Button>
                <Divider style={{marginBottom: 20}} />
                <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 2: Upload Signed PDF</Text>
                <FileUploadButton label="Signed PDF" fileKey="contract" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <Button mode="contained" onPress={submitContract} loading={applying} style={{backgroundColor: colors.primary, marginTop: 10}} textColor={colors.white}>Submit Contract</Button>
            </Card.Content>
        </Card>
    </ScrollView>
);

export const PaymentReviewView = ({ currentApp }: { currentApp: ApplicationData }) => (
    <View style={styles.centerContent}>
        <Icon name="timer-sand" size={80} color={colors.warning} style={{ marginBottom: 10, marginTop: 50 }} />
        <Text variant="headlineMedium" style={styles.statusTitle}>Verifying Payment</Text>
        <Card style={styles.statusCard} mode="elevated">
            <Card.Content>
                <Text style={styles.statusText}>Payment for Slot: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.targetSlot}</Text></Text>
                <Divider style={{ marginVertical: 15 }} />
                <Text style={[styles.statusText, {fontSize: 14, color: colors.textMedium, fontStyle: 'italic'}]}>"The Treasurer is verifying your receipt. This may take a moment."</Text>
            </Card.Content>
        </Card>
    </View>
);

export const PaymentUnlockedView = ({ currentApp, currentBilling, paymentData, setPaymentData, submitPaymentReceipt, applying, files, uploadProgress, onPickFile }: any) => {
    const PAYMENT_INFO = {
        billerName: "MUNICIPAL TREASURER",
        project: "MARKET STALL RENTALS"
    };

    return (
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
            <View style={{alignItems:'center', marginBottom: 20}}>
                <Icon name="file-document-outline" size={50} color={colors.primary} />
                <Text variant="headlineSmall" style={styles.pageTitle}>STALL ORDER OF PAYMENT</Text>
            </View>
            <Card style={styles.paymentCard} mode="elevated">
                <View style={styles.paymentHeaderBg}>
                    <Text style={styles.paymentHeaderTitle}>{PAYMENT_INFO.billerName}</Text>
                    <Text style={styles.paymentHeaderSub}>{PAYMENT_INFO.project}</Text>
                </View>
                <Card.Content style={{paddingTop: 20, paddingBottom: 20}}>
                    <View style={styles.paymentRow}><Text style={styles.paymentLabel}>STALL NUMBER</Text><Text style={styles.paymentValue}>{currentApp.targetSlot}</Text></View>
                    <View style={styles.paymentRow}><Text style={styles.paymentLabel}>REGISTERED OWNER</Text><Text style={[styles.paymentValue, { textTransform: 'uppercase' }]}>{currentApp.name}</Text></View>
                    <View style={styles.paymentRow}><Text style={styles.paymentLabel}>RENTAL PERIOD</Text><Text style={[styles.paymentValue, {color: colors.primary}]}>{currentBilling.periodLabel}</Text></View>
                    <View style={styles.divider} /><View style={styles.totalBlock}><Text style={styles.totalLabel}>TOTAL AMOUNT TO BE PAID IN FULL</Text><Text style={styles.totalAmount}>{currentBilling.amountLabel}</Text><Text style={styles.totalNote}>(NO PARTIAL PAYMENT)</Text></View>
                </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.sectionHeader}>Verification Details</Text>
            <TextInput label="OR / Reference No." value={paymentData.referenceNo} onChangeText={(t: string) => setPaymentData({...paymentData, referenceNo: t})} mode="outlined" style={styles.input} activeOutlineColor={colors.primary} textColor={colors.black} />
            <FileUploadButton label="Receipt Photo" fileKey="receipt" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
            <Button mode="contained" onPress={submitPaymentReceipt} loading={applying} style={styles.submitButton} textColor={colors.white}>Submit Payment</Button>
        </ScrollView>
    );
};


export const RejectedView = ({ currentApp }: { currentApp: any }) => {
  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center', paddingTop: 80 }}> 
       
      <Icon name="close-circle-outline" size={80} color="#ef4444" />
      <Text variant="headlineSmall" style={{ marginTop: 20, fontWeight: 'bold', color: '#ef4444' }}>
        Application Rejected
      </Text>
      
      <Card style={{ width: '100%', marginTop: 20, backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Icon name="alert-circle" size={20} color="#dc2626" style={{ marginRight: 8 }} />
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#991b1b' }}>
              Admin Remarks:
            </Text>
          </View>
          <Text variant="bodyLarge" style={{ color: '#7f1d1d', lineHeight: 24 }}>
            {currentApp.rejectionReason || "Your application did not meet the requirements or had incomplete documentation. Please contact administration."}
          </Text>
        </Card.Content>
      </Card>

      <Text style={{ marginTop: 30, textAlign: 'center', color: 'gray' }}>
        You may select a different slot or switch tabs to submit a new application with corrected documents.
      </Text>
    </View>
  );
};


export const TenantView = ({ 
  currentApp, 
  paymentData, 
  setPaymentData, 
  submitRenewal, 
  applying, 
  files, 
  uploadProgress, 
  onPickFile 
}: any) => {
  
  const receiptImageUri = currentApp.receiptUrl 
    ? `${API_URL}/stalls/doc/${currentApp.receiptUrl}` 
    : null;

  const dueDate = currentApp.due 
    ? new Date(currentApp.due).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) 
    : "Not Set";

  const totalAmount = currentApp.totalAmount ? Number(currentApp.totalAmount).toLocaleString() : "0.00";

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Card style={[styles.card, { borderColor: colors.success, borderWidth: 1, marginBottom: 20 }]}>
        <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Icon name="check-decagram" size={80} color={colors.success} />
          <Text variant="headlineSmall" style={{ marginTop: 15, fontWeight: 'bold', color: colors.success }}>
            Active Tenant
          </Text>
          <Text variant="titleMedium" style={{ marginTop: 5, color: colors.textDark, fontWeight: 'bold' }}>
            Slot: {currentApp.targetSlot}
          </Text>
          <Text style={{ color: colors.textDark, marginTop: 5 }}>
            Floor: {currentApp.floor}
          </Text>
          
        </Card.Content>
      </Card>

     
      <Card style={{ marginBottom: 20, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Icon name="calendar-clock" size={24} color={colors.success} style={{ marginRight: 10 }} />
            <Text variant="titleMedium" style={{ fontWeight: 'medium', color: '#166534' }}>Next Payment Due</Text>
          </View>
          <Text variant="headlineSmall" style={{ color: colors.success, fontWeight: 'bold', marginLeft: 34 }}>{dueDate}</Text>
          <Text variant="titleMedium" style={{ color: '#166534', fontWeight: 'bold', marginLeft: 34, marginTop: 5 }}>
            Amount Due: ₱{totalAmount}
          </Text>

          <Divider style={{ marginVertical: 15 }} />
          
          <Text variant="titleSmall" style={{ color: '#166534', fontWeight: 'bold', marginBottom: 10 }}>Submit Next Payment</Text>
          <TextInput 
            label="OR / Reference No." 
            value={paymentData.referenceNo} 
            onChangeText={(t: string) => setPaymentData({...paymentData, referenceNo: t})} 
            mode="outlined" style={styles.input} activeOutlineColor={colors.success} textColor={colors.black} 
          />
          <FileUploadButton label="Receipt Photo" fileKey="receipt" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
          
          <Button mode="contained" onPress={submitRenewal} loading={applying} style={{ backgroundColor: colors.success, marginTop: 10 }} textColor={colors.white}>
            Send Payment Receipt
          </Button>
        </Card.Content>
      </Card>

   
      <Card style={{ marginBottom: 20, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Icon name="receipt" size={24} color="#166534" style={{ marginRight: 10 }} />
            <Text variant="titleMedium" style={{ fontWeight: 'medium', color: '#166534' }}>
             Payment Record History
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#ffffff', 
            padding: 15, 
            borderRadius: 10, 
            marginBottom: 15,
            borderWidth: 1, 
            borderColor: colors.success 
          }}>
            
            <Text variant="bodyMedium" style={{ marginBottom: 5, color: '#121213', fontWeight: 'bold'  }}>
              <Text style={{ fontWeight: 'medium', color: '#121213' }}>Reference No: </Text> 
              {currentApp.paymentReference || "N/A"}  
            </Text>
            
            <Text variant="bodyMedium" style={{ color: '#121213', fontWeight: 'bold' }}>
              <Text style={{ fontWeight: 'medium', color: '#121213' }}>Amount Paid: </Text> 
              ₱{currentApp.paymentAmount ? Number(currentApp.paymentAmount).toLocaleString() : "0.00"}
            </Text>

          </View>
         
          {receiptImageUri ? (
            <View style={{ marginTop: 5 }}>
              <Text variant="labelLarge" style={{ color: '#166534', marginBottom: 10 }}>
                <Icon name="image-outline" size={16} /> Attached Document:
              </Text>
              <Image 
                source={{ uri: receiptImageUri }} 
                style={{ width: '100%', height: 350, borderRadius: 12, backgroundColor: '#e2e8f0' }} 
                resizeMode="contain" 
              />
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#f1f5f9', borderRadius: 10 }}>
              <Icon name="file-hidden" size={30} color="#000000" />
              <Text style={{ color: '#000000', fontStyle: 'italic', marginTop: 10 }}>
                No receipt document available.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};