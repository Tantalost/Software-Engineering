import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import styles from '@/src/styles/stallsStyle';
import { colors } from '@/src/themes/stallsColors';

interface StallGridProps {
  selectedFloor: string;
  occupiedStalls: string[];
  pendingStalls: string[];
  selectedStall: string | null;
  onStallPress: (slot: string) => void;
}

export default function StallGrid({ selectedFloor, occupiedStalls, pendingStalls, selectedStall, onStallPress }: StallGridProps) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: 30 }).map((_, i) => { 
        const slotLabel = selectedFloor === 'Permanent' ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`; 
        
        const occupied = occupiedStalls.includes(slotLabel);
        const isPending = pendingStalls.includes(slotLabel); 
        const selected = selectedStall === slotLabel; 
        
        let buttonStyle = styles.stallAvailable;
        let textStyle = styles.stallTextAvailable;

        if (occupied) {
            buttonStyle = { ...styles.stallOccupied, borderWidth: 0, borderColor: 'transparent', borderStyle: 'dashed' as const };
            textStyle = styles.stallTextWhite;
        } else if (isPending) {
            buttonStyle = { backgroundColor: colors.warning, borderWidth: 0, borderColor: 'transparent', borderStyle: 'dashed' as const };
            textStyle = styles.stallTextWhite;
        } else if (selected) {
            buttonStyle = { ...styles.stallSelected, borderWidth: 0, borderColor: 'transparent', borderStyle: 'dashed' as const };
            textStyle = styles.stallTextWhite;
        }

        return (
            <TouchableOpacity 
                key={slotLabel} 
                style={[styles.stallBase, buttonStyle]} 
                onPress={() => onStallPress(slotLabel)} 
                disabled={occupied || isPending}
            >
                <Text style={[styles.slotLabelMain, textStyle]}>{slotLabel}</Text>
            </TouchableOpacity>
        ); 
      })}
    </View>
  );
}