import React, { useState, useEffect } from 'react';
import { ScrollView, View, Modal, Linking, RefreshControl } from 'react-native';
import { Card, Text, Button, Divider, TextInput } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import styles from '@/src/styles/stallsStyle'; 
import { colors } from '@/src/themes/stallsColors'; 

import FileUploadButton from '@/src/components/FileUploadButton';
import API_URL from '@/src/config';

export const VerificationPendingView = ({ currentApp, refreshing, onRefresh }: any) => (
    <ScrollView 
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
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
    </ScrollView>
);

export const ContractReviewView = ({ currentApp, refreshing, onRefresh }: any) => (
    <ScrollView 
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
        <Icon name="timer-sand" size={80} color={colors.warning} style={{marginBottom:10, marginTop:50}} />
        <Text variant="headlineMedium" style={styles.statusTitle}>Verifying Contract</Text>
        <Card style={styles.statusCard} mode="elevated">
            <Card.Content>
                <Text style={styles.statusText}>Contract for Slot: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.targetSlot}</Text></Text>
                <Divider style={{ marginVertical: 15 }} />
                <Text style={[styles.statusText, {fontSize: 14, color: colors.textMedium, fontStyle: 'italic'}]}>"We are currently reviewing your signed contract. Please wait for the final approval."</Text>
            </Card.Content>
        </Card>
    </ScrollView>
);

export const ContractPendingView = ({ currentApp, generateContractPDF, submitContract, applying, files, uploadProgress, onPickFile, refreshing, onRefresh }: any) => (
    <ScrollView 
        contentContainerStyle={{padding: 20, alignItems:'center'}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
        <Icon name="pen" size={64} color={colors.primary} />
        <Text variant="headlineSmall" style={{color: colors.primary, fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>Contract Signing</Text>
        <Card style={[styles.statusCard, {marginTop: 20, width: '100%'}]}>
            <Card.Content>
                <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 1: Download & Sign</Text>
                <Button mode="contained" icon="download" onPress={generateContractPDF} style={{marginBottom: 25, backgroundColor: colors.primary}} textColor='white'>Download Contract PDF</Button>
                <Divider style={{marginBottom: 20}} />
                <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>Step 2: Upload Signed PDF</Text>
                <FileUploadButton label="Signed PDF" fileKey="contract" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <Button mode={applying ? "contained" : "outlined"} onPress={submitContract} loading={applying} style={{marginTop: 10, borderColor: colors.primary, borderWidth: applying ? 0 : 1,backgroundColor: applying ? colors.primary : 'transparent' }} textColor={applying ? colors.white : colors.primary}
                >
                  Submit Contract
                </Button>
            </Card.Content>
        </Card>
    </ScrollView>
);

export const PaymentReviewView = ({ currentApp, refreshing, onRefresh }: any) => (
    <ScrollView 
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
        <Icon name="timer-sand" size={80} color={colors.warning} style={{ marginBottom: 10, marginTop: 50 }} />
        <Text variant="headlineMedium" style={styles.statusTitle}>Verifying Payment</Text>
        <Card style={styles.statusCard} mode="elevated">
            <Card.Content>
                <Text style={styles.statusText}>Payment for Slot: <Text style={{fontWeight:'bold', color: colors.textDark}}>{currentApp.targetSlot}</Text></Text>
                <Divider style={{ marginVertical: 15 }} />
                <Text style={[styles.statusText, {fontSize: 14, color: colors.textMedium, fontStyle: 'italic'}]}>"The Treasurer is verifying your receipt. This may take a moment."</Text>
            </Card.Content>
        </Card>
    </ScrollView>
);

export const PaymentUnlockedView = ({ currentApp, currentBilling, paymentData, setPaymentData, submitPaymentReceipt, applying, files, uploadProgress, onPickFile, refreshing, onRefresh }: any) => {
    const PAYMENT_INFO = {
        billerName: "MUNICIPAL TREASURER",
        project: "MARKET STALL RENTALS"
    };

    return (
        <ScrollView 
            contentContainerStyle={{padding: 20, paddingBottom: 100}}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
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
                    <View style={styles.divider} /><View style={styles.totalBlock}><Text style={styles.totalLabel}>TOTAL AMOUNT TO BE PAID IN FULL</Text><Text style={styles.totalAmount}>{currentBilling.amountLabel}</Text>
                    
                    {currentBilling.isPermanent && (
                        <Text style={{fontSize: 11, color: colors.primary, fontWeight: 'bold', marginBottom: 5, textAlign: 'center'}}>
                          (Includes ₱{currentBilling.baseRent.toLocaleString(undefined, {minimumFractionDigits: 2})} Advance Payment)
                        </Text>
                    )}
                    
                    <Text style={styles.totalNote}>(NO PARTIAL PAYMENT)</Text></View>
                </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.sectionHeader}>Verification Details</Text>
            <TextInput label="OR / Reference No." value={paymentData.referenceNo} onChangeText={(t: string) => setPaymentData({...paymentData, referenceNo: t})} mode="outlined" style={styles.input} activeOutlineColor={colors.primary} textColor={colors.black} />
            <FileUploadButton label="Receipt Photo" fileKey="receipt" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
            <Button mode={applying ? "contained" : "outlined"} onPress={submitPaymentReceipt} loading={applying} style={[styles.submitButton, { borderColor: colors.primary, borderWidth: applying ? 0 : 1,backgroundColor: applying ? colors.primary : 'transparent' }]} textColor={applying ? colors.white : colors.primary}>Submit Payment</Button>
         </ScrollView>
    );
};


export const RejectedView = ({ currentApp, refreshing, onRefresh }: any) => {
  return (
    <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 20, alignItems: 'center', paddingTop: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ef4444"]} />}
    > 
       
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
    </ScrollView>
  );
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const TenantView = ({ currentApp, clearPaymentData, paymentData, setPaymentData, submitRenewal, applying, files, uploadProgress, onPickFile, refreshing, onRefresh }: any) => {
  
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    if (!applying && paymentData?.referenceNo === '') {
        setPaymentModalVisible(false);
    }
  }, [applying, paymentData?.referenceNo]);

  const dueDate = currentApp.due 
    ? new Date(currentApp.due).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) 
    : "Not Set";

  const rentAmount = currentApp.rentAmount ? Number(currentApp.rentAmount).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00";
  const utilityAmount = currentApp.utilityAmount ? Number(currentApp.utilityAmount).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00";
  const totalAmount = currentApp.totalAmount ? Number(currentApp.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00";

  const chargeAmount = currentApp.chargeAmount ? Number(currentApp.chargeAmount) : 0;
  const interestAmount = currentApp.interestAmount ? Number(currentApp.interestAmount) : 0;
  const advanceBalance = currentApp.advancePaymentBalance ? Number(currentApp.advancePaymentBalance) : 0;
  const advanceUsed = currentApp.advanceUsedForPenalties ? Number(currentApp.advanceUsedForPenalties) : 0;
  const isPermanent = currentApp.floor === "Permanent" || currentApp.tenantType === "Permanent";

  const feeBreakdown = typeof currentApp.feeBreakdown === 'string' 
      ? JSON.parse(currentApp.feeBreakdown || '{}') 
      : (currentApp.feeBreakdown || {});

  const electricity = Number(feeBreakdown.electricity || 0);
  const otherAmount = Number(feeBreakdown.otherAmount || 0);
  const otherSpecify = feeBreakdown.otherSpecify || "Other Fees";

  const handleRenewalSubmit = () => {
      submitRenewal();
    
  };

  return (
    <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.success]} />}
    >
      
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
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#166534' }}>Next Payment Due</Text>
          </View>
          <Text variant="headlineSmall" style={{ color: colors.success, fontWeight: 'bold', marginLeft: 34 }}>{dueDate}</Text>
          
          <View style={{ marginLeft: 34, marginTop: 10, backgroundColor: '#dcfce7', padding: 12, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: '#166534' }}>Rent Amount:</Text>
              <Text style={{ color: '#166534', fontWeight: 'bold' }}>₱{rentAmount}</Text>
            </View>

            {/* --- NEW: Show Advance Balance (Only for Permanent) --- */}
            {isPermanent && (
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ color: '#166534' }}>Advance Balance:</Text>
                  <Text style={{ color: '#166534', fontWeight: 'bold' }}>₱{advanceBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
               </View>
            )}
            
            <View style={{ marginBottom: 5 }}>
              {/* Main Additional Fees Row (Shows for everyone) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#166534' }}>Additional Fees:</Text>
                <Text style={{ color: '#166534', fontWeight: 'bold' }}>₱{utilityAmount}</Text>
              </View>
              
             {/* Sub-breakdown (Only shows for Permanent tenants) */}
             {isPermanent && (
                <View style={{ paddingLeft: 10, marginTop: 4 }}>
                  {electricity > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ color: '#166534', fontSize: 12 }}>↳ Electricity:</Text>
                        <Text style={{ color: '#166534', fontSize: 12 }}>₱{electricity.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                      </View>
                  )}
                  {otherAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ color: '#166534', fontSize: 12 }}>↳ {otherSpecify}:</Text>
                        <Text style={{ color: '#166534', fontSize: 12 }}>₱{otherAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                      </View>
                  )}
                </View>
            )}
            </View>

            {currentApp.status === "Overdue" && (
                <View style={{ marginTop: 5, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#bbf7d0' }}>
                    <Text style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: 4 }}>Overdue Penalties:</Text>
                    
                    {chargeAmount > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, paddingLeft: 10 }}>
                            <Text style={{ color: '#dc2626', fontSize: 12 }}>↳ Penalty Surcharge:</Text>
                            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}>₱{chargeAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                        </View>
                    )}
                    
                    {interestAmount > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, paddingLeft: 10 }}>
                            <Text style={{ color: '#dc2626', fontSize: 12 }}>↳ Accumulated Interest:</Text>
                            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}>₱{interestAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                        </View>
                    )}
                </View>
            )}
            
            <Divider style={{ marginVertical: 8, backgroundColor: '#bbf7d0' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#166534', fontWeight: 'bold' }}>Total Due:</Text>
              <Text style={{ color: '#166534', fontWeight: 'bold', fontSize: 16 }}>₱{totalAmount}</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 15 }} />
          
          <Button 
            mode="contained" icon="upload"
            onPress={() => {
              clearPaymentData(); 
              setPaymentModalVisible(true); 
            }} 
            style={{ backgroundColor: currentApp.tenantDbStatus === 'Payment Review' ? '#ffbf49' : colors.success }} 
            labelStyle={{ 
            color: colors.white, 
            fontWeight: 'bold',
            fontSize: 16 
            }} 
            disabled={currentApp.tenantDbStatus === 'Payment Review'} 
          >
          {currentApp.tenantDbStatus === 'Payment Review' ? 'Payment Under Review' : 'Submit Next Payment'}
        </Button>
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 20, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Icon name="receipt" size={24} color="#166534" style={{ marginRight: 10 }} />
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#166534' }}>
             Payment Record History
            </Text>
          </View>
          
           {currentApp.paymentHistory && currentApp.paymentHistory.length > 0 ? (
            [...currentApp.paymentHistory]
            .sort((a: any, b: any) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime())
            .map((payment: any, index: number) => {

            const rawReceipt = payment.receiptUrl || payment.receipt || "";
            const isValidReceipt = rawReceipt && rawReceipt.trim() !== "" && rawReceipt !== "undefined" && rawReceipt !== "null";
      
            const specificReceiptUri = isValidReceipt 
            ? (rawReceipt.startsWith('http') ? rawReceipt : `${API_URL}/stalls/doc/${rawReceipt}`)
            : null;

            return (
              <View key={index} style={{ backgroundColor: '#ffffff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: colors.success }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="calendar-check" size={18} color={colors.success} style={{ marginRight: 5 }} />
              <Text variant="bodySmall" style={{ color: 'grey', fontWeight: 'bold' }}>
                Paid on: {new Date(payment.datePaid).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
                })}
      
                <Text style={{ color: colors.success, fontStyle: 'italic' }}> ({getTimeAgo(payment.datePaid)})</Text>
              </Text>
            </View>

            <Text variant="bodyMedium" style={{ marginBottom: 5, color: '#121213', fontWeight: 'bold' }}>
              <Text style={{ fontWeight: 'normal', color: '#121213' }}>Reference No: </Text> 
              {payment.referenceNo || "N/A"}  
            </Text>

            <Text variant="bodyMedium" style={{ color: '#121213', fontWeight: 'bold', marginBottom: 10 }}>
            <Text style={{ fontWeight: 'normal', color: '#121213' }}>Amount Paid: </Text> 
              ₱{payment.amount ? Number(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2}) : (currentApp.totalAmount ? Number(currentApp.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00")}
            </Text>

            {specificReceiptUri ? (
              <Button 
              mode="contained-tonal" 
              icon="file-eye" 
              onPress={() => Linking.openURL(specificReceiptUri)} 
              style={{ marginTop: 5, backgroundColor: '#f0fdf4' }} 
              textColor={colors.success}
            >
              View Receipt
            </Button>
            ) : (
            <Text style={{ color: '#ef4444', fontStyle: 'italic', fontSize: 12 }}>
              Receipt image not found
            </Text>
          )}
        </View>
      );
    })
) : (
  <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 15 }}>
    <Icon name="file-hidden" size={30} color="#000000" />
    <Text style={{ color: '#000000', fontStyle: 'italic', marginTop: 10 }}>
      No payment records found.
    </Text>
  </View>
)}
           
        </Card.Content>
      </Card>

      <Modal animationType="fade" transparent={true} visible={paymentModalVisible} onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 25, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 }}>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
               <Icon name="cash-register" size={28} color={colors.success} style={{ marginRight: 10 }} />
               <Text variant="titleLarge" style={{ color: '#166534', fontWeight: 'bold' }}>Upload Receipt</Text>
            </View>
            
            <Text style={{ marginBottom: 20, color: '#444', lineHeight: 20 }}>
              Please provide the reference number and attach a photo of your receipt for the upcoming due amount of <Text style={{fontWeight:'bold'}}>₱{totalAmount}</Text>.
            </Text>

            <TextInput 
              label="OR / Reference No." 
              value={paymentData?.referenceNo || ''} 
              onChangeText={(t: string) => setPaymentData({...paymentData, referenceNo: t})} 
              mode="outlined" 
              style={[styles.input, { marginBottom: 15 }]} 
              activeOutlineColor={colors.success} 
              textColor={colors.black} 
            />
            
            <FileUploadButton label="Receipt Photo" fileKey="receipt" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 10 }}>
              <Button onPress={() => setPaymentModalVisible(false)} textColor="grey">
                Cancel
              </Button>
              <Button mode="contained" onPress={handleRenewalSubmit} loading={applying} style={{ backgroundColor: colors.success }} textColor={colors.white}>
                Send Payment
              </Button>
            </View>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};