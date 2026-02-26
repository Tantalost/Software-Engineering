import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

interface Props {
  showClearAction: boolean;
  onClear: () => void;
}

export default function EmptyState({ showClearAction, onClear }: Props) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
          <Icon name="magnify-remove-outline" size={48} color="#9E9E9E" />
      </View>
      <Text variant="titleMedium" style={styles.emptyTitle}>No Records Found</Text>
      <Text variant="bodyMedium" style={styles.emptySub}>Try adjusting your search criteria</Text>
      {showClearAction && (
            <TouchableOpacity onPress={onClear} style={{marginTop: 10}}>
              <Text style={{color: '#1B5E20', fontWeight: 'bold'}}>Clear Search</Text>
            </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 60,
    opacity: 0.8
  },
  emptyIconBg: {
    backgroundColor: '#ECEFF1',
    padding: 20,
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyTitle: { 
    color: '#333', 
    fontWeight: '700',
    marginBottom: 4
  },
  emptySub: {
    color: '#999',
  },
});