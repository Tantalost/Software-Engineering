import React, { useRef } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
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

  const scrollViewRef = useRef<ScrollView>(null);
  
  const renderStall = (slotLabel: string, isNightMarket: boolean = false) => {
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
           
            style={[isNightMarket ? styles.stallBaseNightMarket : styles.stallBase, buttonStyle]} 
            onPress={() => onStallPress(slotLabel)} 
            disabled={occupied || isPending}
        >
            <Text style={[styles.slotLabelMain, textStyle]}>
            
              {isNightMarket ? slotLabel.replace('NM-', '') : slotLabel}
            </Text>
        </TouchableOpacity>
    );
  };

  
  if (selectedFloor === 'Permanent') {
    return (
      <View style={styles.gridContainer}>
        {Array.from({ length: 30 }).map((_, i) => renderStall(`A-${101 + i}`, false))}
      </View>
    );
  }

 
  const topBlock1 = [32, 31, 30, 29, 28, 27, 26];
  const topBlock2 = [25, 24, 23, 22, 21, 20, 19, 18];
  const topBlock3 = [17, 16, 15, 14, 12, 11, 10, 9];
  const topBlock4 = [8, 7, 6, 5, 4, 3, 2, 1];

  const bottomBlock1 = [33, 34, 35, 36, 37, 38, 39];
  const bottomBlock2 = [40, 41, 42, 43, 44, 45, 46, 47];
  const bottomBlock3 = [48, 49, 50, 51, 53, 54, 55, 56];
  const bottomBlock4 = [57, 58, 59, 60, 61, 62, 63, 64];

  return (
    <ScrollView 
      horizontal 
      ref={scrollViewRef} 

      onContentSizeChange={() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }}
      showsHorizontalScrollIndicator={true} 
      
      contentContainerStyle={{ paddingLeft: 20 }}
    >
      <View style={styles.nightMarketContainer}>
       
        <View style={styles.nmRow}>
          <View style={styles.nmBlock}>{topBlock1.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} />
          <View style={styles.nmBlock}>{topBlock2.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} />
          <View style={styles.nmBlock}>{topBlock3.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} />
          <View style={styles.nmBlock}>{topBlock4.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
        </View>

        <View style={styles.nmWalkwayHorizontal} />

        <View style={styles.nmRow}>
          <View style={styles.nmBlock}>{bottomBlock1.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} /> 
          <View style={styles.nmBlock}>{bottomBlock2.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} /> 
          <View style={styles.nmBlock}>{bottomBlock3.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
          <View style={styles.nmWalkwayVertical} /> 
          <View style={styles.nmBlock}>{bottomBlock4.map(num => renderStall(`NM-${num.toString().padStart(2, '0')}`, true))}</View>
        </View>
      </View>
    </ScrollView>
  );
}