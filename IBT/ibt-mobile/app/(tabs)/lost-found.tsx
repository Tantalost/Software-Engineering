import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/themes/theme';

import API_URL from '../../src/config';
import { LostItem } from '@/src/types/lostfound.types';
import LostItemCard from '@/src/components/lostfound/LostItemCard';
import EmptyState from '@/src/components/lostfound/EmptyState';

const formatDisplayDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const SectionLabel = ({ count }: { count: number }) => (
  <View style={styles.sectionLabelRow}>
    <View style={styles.sectionLabelLine} />
    <Text style={styles.sectionLabelText}>
      {count} UNCLAIMED RECORD{count !== 1 ? 'S' : ''}
    </Text>
    <View style={styles.sectionLabelLine} />
  </View>
);

export default function LostFoundPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();

  const colorScheme = useColorScheme();
  const activeTheme = Colors[colorScheme ?? 'dark'];
  const primaryColor = activeTheme.tint;

  const [searchQuery, setSearchQuery]   = useState('');
  const [lostItems, setLostItems]       = useState<LostItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
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
        console.error('Parse error', e);
      }
    } catch (error) {
      console.error('Fetch error:', error);
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
    let data = lostItems.filter(
      (item) => item.status === 'Unclaimed' && !item.isArchived
    );

    if (activeItemId) return data.filter((item) => item._id === activeItemId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
    
      data = data.filter(
        (item) =>
          (item.trackingNo?.toLowerCase() || '').includes(q) ||
          (item.location?.toLowerCase() || '').includes(q) ||
          (item.itemType?.toLowerCase() || '').includes(q) ||
          (item.description?.toLowerCase() || '').includes(q)
      );
    }

    return [...data].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [lostItems, searchQuery, activeItemId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading records…</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.headerContainer}>

        <View style={styles.titleBar}>
          <View style={styles.titleLeft}>
            <View>
              <Text style={styles.headerTitle}>Lost &amp; Found</Text>
              <Text style={styles.headerSubtitle}>{formatDisplayDate()}</Text>
            </View>
          </View>
          
          <View style={[styles.countBadge, { borderColor: primaryColor, backgroundColor: 'transparent' }]}>
            <Text style={[styles.countBadgeNumber, { color: primaryColor }]}>{filteredItems.length}</Text>
            <Text style={[styles.countBadgeLabel, { color: primaryColor }]}>items</Text>
          </View>
        </View>

        
        <Searchbar
          placeholder="Search by tracking no., location, type…"
          onChangeText={(text) => {
            setSearchQuery(text);
            if (activeItemId) setActiveItemId(null);
          }}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#6B7280"
          clearIcon="close-circle"
          theme={{ colors: { primary: '#4B5563' } }}
          cursorColor="#4B5563"
          selectionColor="#4B5563"
        />

        {activeItemId && (
          <View style={[styles.filterBanner, { borderColor: primaryColor }]}>
            <Icon name="filter-check" size={15} color={primaryColor} />
            <Text style={[styles.filterBannerText, { color: primaryColor }]}>Showing a specific item</Text>
            <TouchableOpacity onPress={clearFilter} style={[styles.clearBtn, { backgroundColor: primaryColor }]}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      >
        {filteredItems.length > 0 && <SectionLabel count={filteredItems.length} />}

        {filteredItems.map((item) => (
          <LostItemCard key={item._id} item={item} />
        ))}

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="briefcase-off-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyBody}>
              {activeItemId || searchQuery
                ? 'No items match your current search or filter.'
                : 'There are no unclaimed lost items at this time.'}
            </Text>
            {(activeItemId || searchQuery) && (
              <TouchableOpacity onPress={clearFilter} style={[styles.emptyBtn, { backgroundColor: primaryColor }]}>
                <Text style={styles.emptyBtnText}>Reset Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container:          { flex: 1, backgroundColor: '#F3F4F6' },
  centerContent:      { justifyContent: 'center', alignItems: 'center' },

  loadingCard:        { alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  loadingText:        { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  headerContainer:    { backgroundColor: '#FFFFFF', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10 },
  titleBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  titleLeft:          { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  titleIconWrapper:   { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  headerTitle:        { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  headerSubtitle:     { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  countBadge:         { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  countBadgeNumber:   { fontSize: 20, fontWeight: '800' },
  countBadgeLabel:    { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  searchBar:          { backgroundColor: '#F9FAFB', elevation: 0, borderRadius: 12, height: 46, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput:        { fontSize: 14, color: '#111827', alignSelf: 'center' },

  filterBanner:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 9, borderRadius: 9, marginTop: 10, gap: 8, borderWidth: 1 },
  filterBannerText:   { flex: 1, fontSize: 13, fontWeight: '600' },
  clearBtn:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  clearBtnText:       { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  scrollContent:      { padding: 14, paddingBottom: 140 },

  sectionLabelRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionLabelLine:   { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  sectionLabelText:   { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },

  emptyState:         { paddingVertical: 52, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle:         { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 6 },
  emptyBody:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  emptyBtn:           { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText:       { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
});