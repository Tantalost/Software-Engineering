import React from 'react';
import { View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { colors } from '@/src/themes/stallsColors'; 
import styles from '@/src/styles/stallsStyle'; 
import { FileState } from '@/src/types/StallTypes';

interface FileUploadButtonProps {
    label: string;
    fileKey: keyof FileState;
    files: FileState;
    uploadProgress: Record<string, number>;
    onPickFile: (key: keyof FileState) => void;
}

export default function FileUploadButton({ label, fileKey, files, uploadProgress, onPickFile }: FileUploadButtonProps) {
    const isFileSelected = !!files[fileKey];
    const progress = uploadProgress[fileKey] || 0;
    const isLoading = progress > 0 && progress < 1;

    return (
      <View style={{ marginBottom: 15 }}>
        <Button 
            mode={isFileSelected ? "contained" : "outlined"} 
            onPress={() => onPickFile(fileKey)} 
            icon={isFileSelected ? "check" : "upload"} 
            style={styles.uploadBtn}
            buttonColor={isFileSelected ? colors.success : undefined}
            textColor={isFileSelected ? 'white' : colors.primary}
            disabled={isLoading}
        >
            {isFileSelected ? `${label} Uploaded` : `Upload ${label}`}
        </Button>
        
        {progress > 0 && (
          <View style={{ marginTop: 5 }}>
            <ProgressBar 
              progress={progress} 
              color={progress === 1 ? colors.success : colors.primary} 
              style={{ height: 6, borderRadius: 4 }} 
            />
            <Text style={{ fontSize: 10, textAlign: 'right', color: 'grey', marginTop: 2 }}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    );
}