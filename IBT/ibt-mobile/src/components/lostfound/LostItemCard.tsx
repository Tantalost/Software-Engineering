import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { LostItem } from '@/src/types/lostfound.types'; 

interface Props {
  item: LostItem;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Unclaimed': return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' }; 
    case 'Claimed': return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
    default: return { bg: '#ECEFF1', text: '#546E7A', border: '#CFD8DC' };
  }
};

export default function LostItemCard({ item }: Props) {
  const statusStyle = getStatusColor(item.status);
  const dateObj = new Date(item.dateTime);

  return (
    <Card style={styles.card} mode="elevated">
      <View style={styles.cardContent}>
        
        <View style={styles.cardHeaderRow}>
          <View style={styles.trackingContainer}>
            <Icon name="barcode" size={16} color="#555" style={{marginRight: 4}} />
            <Text variant="titleSmall" style={styles.trackingText}>#{item.trackingNo}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
            <Icon name="calendar-clock" size={14} color="#888" />
            <Text variant="bodySmall" style={styles.dateText}>
              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>

        <View style={styles.divider} />

        <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.locationContainer}>
          <View style={styles.locationIconBg}>
            <Icon name="map-marker-radius" size={16} color="#1B5E20" />
          </View>
          <Text variant="bodySmall" style={styles.locationText}>{item.location}</Text>
        </View>

      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackingText: {
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 2,
  },
  dateText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  description: {
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
    fontSize: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    padding: 10,
    borderRadius: 10,
  },
  locationIconBg: {
    marginRight: 10,
  },
  locationText: {
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
});