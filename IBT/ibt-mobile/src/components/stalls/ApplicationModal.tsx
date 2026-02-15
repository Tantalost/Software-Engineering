import React from 'react';
import { ScrollView, View } from 'react-native';
import { Modal, Portal, Text, TextInput, Divider, RadioButton, Button } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import styles from '@/src/styles/stallsStyle'; 
import { colors } from '@/src/themes/stallsColors'; 
import { FormData, FileState } from '@/src/types/StallTypes';
import FileUploadButton from '@/src/components/FileUploadButton';

interface ApplicationModalProps {
  visible: boolean;
  step: 'form' | 'review';
  formData: FormData;
  setFormData: (data: FormData) => void;
  phone: string;
  handlePhoneChange: (text: string) => void;
  selectedStall: string | null;
  selectedFloor: string;
  modalBilling: any;
  files: FileState;
  uploadProgress: Record<string, number>;
  onPickFile: (key: keyof FileState) => void;
  onDismiss: () => void;
  onReview: () => void;
  onSubmit: () => void;
  setStep: (step: 'form' | 'review') => void;
  loading: boolean;
}

export default function ApplicationModal({ 
  visible, step, formData, setFormData, phone, handlePhoneChange, 
  selectedStall, selectedFloor, modalBilling, files, uploadProgress, onPickFile,
  onDismiss, onReview, onSubmit, setStep, loading 
}: ApplicationModalProps) {
  
  return (
    <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 'form' ? (
              <View>
                <View style={styles.modalHeader}>
                    <Icon name="store-plus" size={28} color={colors.primary} />
                    <Text variant="headlineSmall" style={styles.modalTitle}>New Application</Text>
                </View>
                <Text style={{textAlign:'center', marginBottom: 15, color: 'grey'}}>Applying for Slot: <Text style={{fontWeight:'bold', color: colors.primary}}>{selectedStall}</Text></Text>

                <Divider style={{marginBottom: 15}} />
                
                <Text variant="titleMedium" style={styles.sectionHeader}>1. Personal Information</Text>
                <TextInput label="First Name" value={formData.firstName} onChangeText={(text) => setFormData({ ...formData, firstName: text })} mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} />
                <TextInput label="Middle Name (Optional)" value={formData.middleName} onChangeText={(text) => setFormData({ ...formData, middleName: text })} mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} />
                <TextInput label="Last Name" value={formData.lastName} onChangeText={(text) => setFormData({ ...formData, lastName: text })} mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} />
                
                <View style={styles.phoneRow}>
                  <View style={styles.prefixContainer}><Text style={styles.prefixText}>+63</Text></View>
                  <TextInput label="Mobile Number" value={phone} onChangeText={handlePhoneChange} keyboardType="numeric" maxLength={10} mode="outlined" style={styles.phoneInput} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} placeholder="9XX XXX XXXX" />
                </View>

                <TextInput label="Email Address" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} textColor='black' outlineColor={colors.textMedium} activeOutlineColor={colors.primary} />

                <Text variant="titleMedium" style={styles.sectionHeader}>2. Business Details</Text>
                <Text style={{marginBottom: 5, color: '#555'}}>Product Type:</Text>
                
                <RadioButton.Group onValueChange={value => setFormData({ ...formData, productType: value })} value={formData.productType}>
                  <View style={styles.radioRow}><RadioButton value="food" color={colors.primary} /><Text style={{color: colors.black}}>Food & Beverages</Text></View>
                  <View style={styles.radioRow}><RadioButton value="dry_goods" color={colors.primary} /><Text style={{color: colors.black}}>Dry Goods (Clothes, etc.)</Text></View>
                  <View style={styles.radioRow}><RadioButton value="accessories" color={colors.primary} /><Text style={{color: colors.black}}>Accessories / Gadgets</Text></View>
                  <View style={styles.radioRow}><RadioButton value="other" color={colors.primary} /><Text style={{color: colors.black}}>Others</Text></View>
                </RadioButton.Group>

                {formData.productType === 'other' && (
                  <TextInput label="Please specify product" value={formData.otherProduct} onChangeText={(text) => setFormData({ ...formData, otherProduct: text })} mode="outlined" outlineColor={colors.textMedium} activeOutlineColor={colors.primary} style={styles.input} textColor='black' />
                )}

                <Text variant="titleMedium" style={styles.sectionHeader}>3. Requirements</Text>
                <Text style={{fontSize: 12, color:'grey', marginBottom: 10}}>Tap to upload images (JPG/PNG)</Text>

                <FileUploadButton label="Business Permit" fileKey="permit" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <FileUploadButton label="Valid ID" fileKey="validId" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <FileUploadButton label="Brgy Clearance" fileKey="clearance" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />

                <View style={styles.billingSummary}>
                    <Text style={[{fontWeight:'bold', color: colors.black }]}>Initial Payment:</Text>
                    <Text variant="titleLarge" style={{color: colors.primary, fontWeight:'bold'}}>{modalBilling.amountLabel}</Text>
                    <Text style={{fontSize:11, color:'grey'}}>Good for {modalBilling.periodLabel}</Text>
                </View>

                <View style={styles.modalActions}>
                  <Button onPress={onDismiss} textColor="grey">Cancel</Button>
                  <Button mode="contained" onPress={onReview} buttonColor={colors.primary} textColor='white'>Review Application</Button>
                </View>
              </View>
            ) : (
              <View>
                <Text variant="headlineSmall" style={[styles.modalTitle, {textAlign:'center'}]}>Review Application</Text>
                <Divider style={{marginVertical: 15}} />

                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Applicant:</Text><Text style={styles.reviewValue}>{formData.firstName} {formData.lastName}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Contact:</Text><Text style={styles.reviewValue}>{phone}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Email:</Text><Text style={styles.reviewValue}>{formData.email}</Text></View>
                <Divider style={{marginVertical: 10}} />
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Target Slot:</Text><Text style={styles.reviewValue}>{selectedStall} ({selectedFloor})</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Product:</Text><Text style={styles.reviewValue}>{formData.productType === 'other' ? formData.otherProduct : formData.productType}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Fee:</Text><Text style={styles.reviewValue}>{modalBilling.amountLabel}</Text></View>

                <View style={{marginTop: 20, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 5}}>
                    <Text style={{color: '#2e7d32', fontSize: 12, fontStyle:'italic'}}><Icon name="check-circle" /> Requirements attached: Permit, Valid ID, Clearance.</Text>
                </View>

                <View style={styles.modalActions}>
                  <Button mode="outlined" onPress={() => setStep('form')} textColor="grey" style={{borderColor:'grey'}}>Edit</Button>
                  <Button mode="contained" onPress={onSubmit} loading={loading} buttonColor={colors.primary} textColor='white'>Confirm & Submit</Button>
                </View>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
  );
}