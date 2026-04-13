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
  
 
  const fullName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix].filter(Boolean).join(' ');

  return (
    <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 'form' ? (
              <View>
                <View style={styles.modalHeader}>
                    <Icon name="store-plus" size={28} color={colors.primary} />
                    <Text variant="headlineSmall" style={[styles.modalTitle, { marginLeft: 10 }]}>New Application</Text>
                </View>
                <Text style={{textAlign:'center', marginBottom: 15, color: 'grey'}}>
                  Applying for Slot: <Text style={{fontWeight:'bold', color: colors.primary}}>{selectedStall}</Text>
                </Text>

                <Divider style={{marginBottom: 15}} />
                
               
                <Text variant="titleMedium" style={styles.sectionHeader}>Applicant Details</Text>
                <View style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.textDark, marginBottom: 5 }}>
                      {fullName || 'Loading Profile...'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                        <Icon name="email-outline" size={16} color="grey" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'grey', fontSize: 14 }}>{formData.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="phone-outline" size={16} color="grey" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'grey', fontSize: 14 }}>{phone}</Text>
                    </View>
                </View>

                <Text variant="titleMedium" style={styles.sectionHeader}>1. Business Details</Text>
                <Text style={{marginBottom: 5, color: '#555'}}>Product Category:</Text>
                
                <RadioButton.Group onValueChange={value => setFormData({ ...formData, productType: value })} value={formData.productType}>
                  <View style={styles.radioRow}><RadioButton value="food_non_alcoholic" color={colors.primary} /><Text style={{color: colors.black}}>Food and non-alcoholic beverages</Text></View>
                  <View style={styles.radioRow}><RadioButton value="clothes_textiles" color={colors.primary} /><Text style={{color: colors.black}}>Clothes and textiles</Text></View>
                  <View style={styles.radioRow}><RadioButton value="accessories" color={colors.primary} /><Text style={{color: colors.black}}>Accessories</Text></View>
                  <View style={styles.radioRow}><RadioButton value="footwears" color={colors.primary} /><Text style={{color: colors.black}}>Footwears</Text></View>
                  <View style={styles.radioRow}><RadioButton value="kitchenwares" color={colors.primary} /><Text style={{color: colors.black}}>Kitchenwares</Text></View>
                  <View style={styles.radioRow}><RadioButton value="agricultural_produce" color={colors.primary} /><Text style={{color: colors.black}}>Fruits, vegetables and other agricultural produce</Text></View>
                  <View style={styles.radioRow}><RadioButton value="other" color={colors.primary} /><Text style={{color: colors.black}}>Others, please specify</Text></View>
                </RadioButton.Group>

                {formData.productType === 'other' && (
                  <TextInput label="Please specify product category" value={formData.otherProduct} onChangeText={(text) => setFormData({ ...formData, otherProduct: text })} mode="outlined" outlineColor={colors.textMedium} activeOutlineColor={colors.primary} style={styles.input} textColor='black' />
                )}

                <Text variant="titleMedium" style={styles.sectionHeader}>2. Requirements</Text>
                <Text style={{fontSize: 12, color:'grey', marginBottom: 10}}>Tap to upload images (JPG/PNG)</Text>

                <FileUploadButton label="Business Permit" fileKey="permit" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <FileUploadButton label="Valid ID" fileKey="validId" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                <FileUploadButton label="Brgy Clearance" fileKey="clearance" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                
                {selectedFloor === 'Night Market' && (
                  <>
                    <FileUploadButton label="Community Tax Certificate" fileKey="communityTax" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                    <FileUploadButton label="Police Clearance" fileKey="policeClearance" files={files} uploadProgress={uploadProgress} onPickFile={onPickFile} />
                  </>
                )}

                <View style={styles.billingSummary}>
                    <Text style={[{fontWeight:'bold', color: colors.black }]}>Initial Payment:</Text>
                    {modalBilling.isPermanent && (
                       <Text style={{fontSize: 12, color: colors.primary, marginBottom: 2, fontWeight: 'bold', textAlign: 'center'}}>
                          ₱{modalBilling.baseRent.toLocaleString()} (Advance) + ₱{modalBilling.proratedRent.toLocaleString()} (Prorated) {"\n"}
                          <Text style={{fontSize: 10, fontStyle: 'italic', color: 'grey'}}>
                            *Prorated rent is {modalBilling.diffDays} days @ ₱{Number(modalBilling.dailyRate || 0).toLocaleString()}/day until due date.
                          </Text>
                       </Text>
                    )}
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

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Applicant:</Text>
                  <Text style={styles.reviewValue}>{fullName}</Text>
                </View>

                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Contact:</Text><Text style={styles.reviewValue}>{phone}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Email:</Text><Text style={styles.reviewValue}>{formData.email}</Text></View>
                <Divider style={{marginVertical: 10}} />
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Target Slot:</Text><Text style={styles.reviewValue}>{selectedStall} ({selectedFloor})</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Product:</Text><Text style={styles.reviewValue}>{formData.productType === 'other' ? formData.otherProduct : formData.productType}</Text></View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Total Fee:</Text>
                  <View style={{alignItems: 'flex-end'}}>
                     <Text style={styles.reviewValue}>{modalBilling.amountLabel}</Text>
                     {modalBilling.isPermanent && (
                       <Text style={{fontSize: 12, color: colors.primary, marginBottom: 2, fontWeight: 'bold', textAlign: 'center'}}>
                          ₱{modalBilling.baseRent.toLocaleString()} (Advance) + ₱{modalBilling.proratedRent.toLocaleString()} (Prorated) {"\n"}
                          <Text style={{fontSize: 10, fontStyle: 'italic', color: 'grey'}}>
                            *Prorated rent is {modalBilling.diffDays} days @ ₱{Number(modalBilling.dailyRate || 0).toLocaleString()}/day until due date.
                          </Text>
                       </Text>
                    )}
                  </View>
                </View>

                <View style={{marginTop: 20, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 5}}>
                    <Text style={{color: '#2e7d32', fontSize: 12, fontStyle:'italic'}}>
                        <Icon name="check-circle" size={14} /> Requirements attached: Permit, Valid ID, Clearance{selectedFloor === 'Night Market' ? ', Community Tax, Police Clearance' : ''}.
                    </Text>
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