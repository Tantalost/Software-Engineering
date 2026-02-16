import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, RefreshControl, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Searchbar, Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'; // Added Imports
import API_URL from '../../src/config';

interface LostItem {
  _id: string;
  trackingNo: string;
  description: string;
  location: string;
  dateTime: string;
  status: 'Claimed' | 'Unclaimed' | 'Archived';
  isArchived: boolean;
}

export default function LostFoundPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>(); // Capture params
  
  const [searchQuery, setSearchQuery] = useState('');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for active filter from Dashboard
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // --- 1. Handle Incoming Params via useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      if (params.itemId) {
        setActiveItemId(params.itemId);
        setSearchQuery(''); // Clear search text if we are filtering by ID
      }
      fetchItems();
    }, [params])
  );

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/lost-found`);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setLostItems(data);
      } catch (e) {
        console.error("Parse error", e);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, []);

  const clearFilter = () => {
    setActiveItemId(null);
    setSearchQuery('');
    router.setParams({ itemId: '' }); // Clear URL params
  };

  // --- 2. Updated Filtering Logic ---
  const filteredItems = useMemo(() => {
    let data = lostItems;

    // Priority 1: Filter by Specific ID (from Dashboard click)
    if (activeItemId) {
      return data.filter(item => item._id === activeItemId);
    }

    // Priority 2: Standard Text Search
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.trackingNo.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower)
      );
    }

    return data;
  }, [lostItems, searchQuery, activeItemId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unclaimed': return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' }; // Orange
      case 'Claimed': return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' }; // Green
      default: return { bg: '#ECEFF1', text: '#546E7A', border: '#CFD8DC' }; // Grey
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text variant="bodyMedium" style={{ marginTop: 16, color: '#666' }}>Updating records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Modern Header */}
      <Surface style={styles.header} elevation={0}>
        <View>
          <Text variant="headlineMedium" style={styles.headerTitle}>Lost & Found</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Monitor reported items</Text>
        </View>
       
      </Surface>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search items..."
          onChangeText={(text) => {
            setSearchQuery(text);
            // If user types, clear the specific ID filter
            if (activeItemId) setActiveItemId(null);
          }}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#666"
        />

        {/* --- 3. Filter Banner (Show only if activeItemId is present) --- */}
        {activeItemId && (
          <View style={styles.filterBanner}>
            <Icon name="filter" size={16} color="#155724" />
            <Text style={styles.filterText}>Showing selected item</Text>
            <TouchableOpacity onPress={clearFilter}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />
        }
      >
        <Text variant="labelMedium" style={styles.resultsText}>
          FOUND {filteredItems.length} RECORD{filteredItems.length !== 1 ? 'S' : ''}
        </Text>

        {filteredItems.map((item) => {
          const statusStyle = getStatusColor(item.status);
          const dateObj = new Date(item.dateTime);
          
          return (
            <Card key={item._id} style={styles.card} mode="elevated">
              <View style={styles.cardContent}>
                
                {/* Header Row: Tracking & Status */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.trackingContainer}>
                    <Icon name="barcode" size={16} color="#555" style={{marginRight: 4}} />
                    <Text variant="titleSmall" style={styles.trackingText}>#{item.trackingNo}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Date Row */}
                <View style={styles.dateRow}>
                   <Icon name="calendar-clock" size={14} color="#888" />
                   <Text variant="bodySmall" style={styles.dateText}>
                      {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Description */}
                <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>

                {/* Location Footer */}
                <View style={styles.locationContainer}>
                  <View style={styles.locationIconBg}>
                    <Icon name="map-marker-radius" size={16} color="#1B5E20" />
                  </View>
                  <Text variant="bodySmall" style={styles.locationText}>{item.location}</Text>
                </View>

              </View>
            </Card>
          );
        })}

        {filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Icon name="magnify-remove-outline" size={48} color="#9E9E9E" />
            </View>
            <Text variant="titleMedium" style={styles.emptyTitle}>No Records Found</Text>
            <Text variant="bodyMedium" style={styles.emptySub}>Try adjusting your search criteria</Text>
            {(activeItemId || searchQuery) && (
                 <TouchableOpacity onPress={clearFilter} style={{marginTop: 10}}>
                    <Text style={{color: '#1B5E20', fontWeight: 'bold'}}>Clear Search</Text>
                 </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F7F9FC'
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { 
    fontWeight: '800', 
    color: '#1A1A1A',
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    color: '#666666', 
    marginTop: 2 
  },
  headerIconBg: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 12,
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F7F9FC',
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    height: 48,
  },
  searchInput: {
    minHeight: 0, 
  },
  // New Filter Banner Styles
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  filterText: {
    flex: 1,
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  clearFilterText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  
  // List Styles
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 32 
  },
  resultsText: { 
    color: '#888', 
    marginBottom: 12, 
    marginLeft: 4, 
    fontWeight: '600',
    letterSpacing: 0.5
  },
  
  // Card Styles
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

  // Empty State Styles
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