import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator'; 
import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY } from '../constants/StallConstants';

export const convertPdfToText = async (uri: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:application/pdf;base64,${base64}`;
  } catch (error) { throw new Error("PDF processing failed"); }
};

export const convertImageToText = async (uri: string) => {
  try {
      const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      return `data:image/jpeg;base64,${manipulated.base64}`;
  } catch (error) { throw new Error("Image processing failed"); }
};

export const encryptFile = (base64String: string) => {
  try {
    if (!base64String) return "";
    return CryptoJS.AES.encrypt(base64String, ENCRYPTION_KEY).toString();
  } catch (error) { throw new Error("Failed to secure document"); }
};