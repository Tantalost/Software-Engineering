import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, View, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Searchbar, Text} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'; 
import API_URL from '../../src/config';

import { LostItem } from '@/src/types/lostfound.types';
import LostItemCard from '@/src/components/lostfound/LostItemCard';
import EmptyState from '@/src/components/lostfound/EmptyState';
import styles from '@/src/styles/lostfoundStyle';

export default function LostFoundPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>(); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  

  const [activeItemId, setActiveItemId] = useState<string | null>(null);


  useFocusEffect(
    useCallback(() => {
      if (params.itemId) {
        setActiveItemId(params.itemId);
        setSearchQuery(''); 
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
    router.setParams({ itemId: '' }); 
  };


  const filteredItems = useMemo(() => {
    // Start from unclaimed, non-archived items only
    let data = lostItems.filter(
      (item) => item.status === 'Unclaimed' && !item.isArchived
    );

    if (activeItemId) {
      return data.filter((item) => item._id === activeItemId);
    }

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.trackingNo.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower) ||
        item.itemType?.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort newest first by dateTime (descending)
    return [...data].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [lostItems, searchQuery, activeItemId]);

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

      
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Lost & Found</Text>

        <Searchbar
          placeholder="Search location, company..."
          onChangeText={(text) => {
            setSearchQuery(text);

            if (activeItemId) setActiveItemId(null);
          }}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput} 
          iconColor="#1B5E20"
          cursorColor={'#0000008e'}
        />


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

        {filteredItems.map((item) => (
          <LostItemCard key={item._id} item={item} />
        ))}

        {filteredItems.length === 0 && (
          <EmptyState 
            showClearAction={!!(activeItemId || searchQuery)} 
            onClear={clearFilter} 
          />
        )}
      </ScrollView>

    </SafeAreaView>

  );
}