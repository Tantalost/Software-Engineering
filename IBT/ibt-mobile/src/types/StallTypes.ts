import * as DocumentPicker from 'expo-document-picker';

export type UserData = {
  id: string;
  name: string;
  email: string;
  contact: string;
};

export type FileState = {
  permit: DocumentPicker.DocumentPickerAsset | null;
  validId: DocumentPicker.DocumentPickerAsset | null;
  clearance: DocumentPicker.DocumentPickerAsset | null;
  receipt: DocumentPicker.DocumentPickerAsset | null;
  contract: DocumentPicker.DocumentPickerAsset | null;
};

export type ApplicationData = {
  status: 'VERIFICATION_PENDING' | 'PAYMENT_UNLOCKED' | 'PAYMENT_REVIEW' | 'CONTRACT_PENDING' | 'CONTRACT_REVIEW' | 'TENANT';
  targetSlot: string;
  floor: string; 
  contact: string;
  name: string;
  paymentReference?: string;
  [key: string]: any;
};

export type FormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  contact: string;
  email: string;
  productType: string;
  otherProduct: string;
};