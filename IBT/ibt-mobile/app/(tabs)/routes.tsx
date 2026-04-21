import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  type ListRenderItemInfo,
} from 'react-native';
import { Text, Card, Searchbar, Avatar, Divider, Menu } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/themes/theme';

import API_URL from '../../src/config';
import { fetchTerminalBoardFromLegacyApi } from '../../src/services/terminalBoardFromLegacyApi';
import type { PredefinedEntry, DispatchTrip, PredefinedStatus } from '../../src/types/terminalBoard.types';

const POLL_MS = 45000;

type BoardRow = PredefinedEntry | DispatchTrip;

const PREDEFINED_BADGE: Record<PredefinedStatus, { label: string; dot: string; bg: string; fg: string; border: string }> = {
  scheduled: { label: 'Scheduled',   dot: '#F59E0B', bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A' },
  arrived:   { label: 'Arrived',     dot: '#10B981', bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0' },
  not_arrived: { label: 'Not Arrived', dot: '#EF4444', bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA' },
};

function dispatchBadge(displayStatus: string) {
  const s = (displayStatus || '').trim();
  if (s === 'Departed')         return { dot: '#10B981', bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0' };
  if (s === 'Not Departed')     return { dot: '#EF4444', bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA' };
  if (s === 'Under Maintenance')return { dot: '#F97316', bg: '#FFF7ED', fg: '#9A3412', border: '#FDBA74' };
  if (s === 'Arrived')          return { dot: '#3B82F6', bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE' };
  return { dot: '#9CA3AF', bg: '#F9FAFB', fg: '#374151', border: '#E5E7EB' };
}

function getStopsLabel(item: DispatchTrip) {
  if (item.stopsLabel && item.stopsLabel.trim()) return item.stopsLabel;
  if (item.stopType === 'Other' && (item.customStopCount ?? 0) > 0) return `${item.customStopCount}-stop`;
  return item.stopType || 'Regular Trip';
}

function isPredefinedRow(item: BoardRow): item is PredefinedEntry {
  return typeof (item as PredefinedEntry).rowKey === 'string' && (item as PredefinedEntry).rowKey.length > 0;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--:--';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${parts[1]} ${ampm}`;
};

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try { return JSON.parse(text) as unknown; }
  catch { return null; }
}

const StatusBadge = ({ label, dot, bg, fg, border }: { label: string; dot: string; bg: string; fg: string; border: string }) => (
  <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }]}>
    <View style={[styles.statusDot, { backgroundColor: dot }]} />
    <Text style={[styles.statusBadgeText, { color: fg }]}>{label}</Text>
  </View>
);


const InfoRow = ({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon as any} size={14} color="#9CA3AF" style={{ marginTop: 1 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  </View>
);


const PredefinedCard = React.memo(({ item, primaryColor }: { item: PredefinedEntry; primaryColor: string }) => {
  const badge = PREDEFINED_BADGE[item.status] || PREDEFINED_BADGE.scheduled;
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>

        
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            <Avatar.Icon size={42} icon="calendar-clock" style={styles.avatarScheduled} color={primaryColor} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="bus" size={12} color="#6B7280" />
              <Text style={styles.metaText}>{item.plateNumber}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{item.busType || 'Regular'}</Text>
            </View>
          </View>
          <StatusBadge {...badge} />
        </View>

        <View style={styles.cardDivider} />

       
        <View style={styles.detailsGrid}>
          <InfoRow icon="map-marker-path" label="Route" value={item.route} />
          <InfoRow icon="clock-outline" label="Scheduled Time" value={`${item.scheduleTime}  (${item.timeWindowLabel})`} />
          {item.notArrivalRemark ? (
            <InfoRow icon="note-text-outline" label="Remark" value={item.notArrivalRemark} valueColor="#6B7280" />
          ) : null}
        </View>

      </Card.Content>
    </Card>
  );
});


const DispatchCard = React.memo(({ item }: { item: DispatchTrip }) => {
  const label = (item.displayStatus ?? item.status ?? '').trim();
  const b = dispatchBadge(label);
  const isDeparted = label === 'Departed';

  const timeLabel    = isDeparted ? 'Departed At' : 'Arrived At';
  const timeValue    = isDeparted
    ? (item.departureTime ? formatTime(item.departureTime) : formatTime(item.time))
    : formatTime(item.time);

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>

        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            <Avatar.Icon size={42} icon="bus" style={styles.avatarDispatch} color="#065F46" />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="identifier" size={12} color="#6B7280" />
              <Text style={styles.metaText}>{item.templateNo}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{item.busType || 'Regular'}</Text>
            </View>
          </View>
          <StatusBadge label={label || item.status || '—'} {...b} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailsRow}>
            <View style={{ flex: 1 }}>
              <InfoRow icon="map-marker-path" label="Route" value={item.route} />
              <InfoRow icon="map-marker-multiple" label="Stops" value={getStopsLabel(item)} />
            </View>
            <View style={styles.timePill}>
              <Text style={styles.timePillLabel}>{timeLabel}</Text>
              <Text style={styles.timePillValue}>{timeValue}</Text>
              {!isDeparted && item.expectedDeparture && (
                <>
                  <Text style={[styles.timePillLabel, { marginTop: 8 }]}>Exp. Departure</Text>
                  <Text style={[styles.timePillValue, { color: '#D97706' }]}>
                    {formatTime(item.expectedDeparture)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

      </Card.Content>
    </Card>
  );
});

export default function RoutesPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; search?: string }>();
  
  const colorScheme = useColorScheme();
  const activeTheme = Colors[colorScheme ?? 'dark'];
  const primaryColor = activeTheme.tint;

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [predefinedEntries, setPredefinedEntries] = useState<PredefinedEntry[]>([]);
  const [dispatchTrips, setDispatchTrips]         = useState<DispatchTrip[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [fetchError, setFetchError]               = useState<string | null>(null);

  const [searchQuery, setSearchQuery]             = useState('');
  const [activeFilterId, setActiveFilterId]       = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany]     = useState('All');
  const [selectedBusType, setSelectedBusType]     = useState('All');
  const [selectedStatus, setSelectedStatus]       = useState('All');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const tripIdParam  = typeof params.tripId  === 'string' ? params.tripId  : undefined;
  const searchParam  = typeof params.search  === 'string' ? params.search  : undefined;

  const fetchBoardData = useCallback(async () => {
    const preUrl  = `${API_URL}/predefined-schedule/today`;
    const dispUrl = `${API_URL}/dispatch-board/today`;
    try {
      const [preRes, dispRes] = await Promise.all([fetch(preUrl), fetch(dispUrl)]);

      const shouldUseLegacyFallback =
        preRes.status === 404 || dispRes.status === 404 ||
        preRes.status >= 500  || dispRes.status >= 500;

      if (shouldUseLegacyFallback) {
        try {
          const { entries, trips } = await fetchTerminalBoardFromLegacyApi(API_URL);
          setPredefinedEntries(entries);
          setDispatchTrips(trips);
          setFetchError(null);
        } catch {
          setPredefinedEntries([]);
          setDispatchTrips([]);
          const errors: string[] = [];
          if (!preRes.ok)  errors.push(`Schedule (${preRes.status})`);
          if (!dispRes.ok) errors.push(`Dispatch (${dispRes.status})`);
          setFetchError(errors.length > 0 ? `Could not load: ${errors.join(', ')}. Fallback failed.` : 'Could not load routes. Fallback failed.');
        }
        return;
      }

      const errors: string[] = [];
      if (!preRes.ok) {
        errors.push(`Schedule (${preRes.status})`);
        setPredefinedEntries([]);
      } else {
        const preJson = await parseJsonSafe(preRes);
        const entries = preJson && typeof preJson === 'object' && 'entries' in preJson ? (preJson as any).entries : null;
        setPredefinedEntries(Array.isArray(entries) ? entries : []);
      }

      if (!dispRes.ok) {
        errors.push(`Dispatch (${dispRes.status})`);
        setDispatchTrips([]);
      } else {
        const dispJson = await parseJsonSafe(dispRes);
        const trips = dispJson && typeof dispJson === 'object' && 'trips' in dispJson ? (dispJson as any).trips : null;
        setDispatchTrips(Array.isArray(trips) ? trips : []);
      }

      setFetchError(errors.length > 0 ? `Could not load: ${errors.join(', ')}` : null);
    } catch {
      setFetchError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (tripIdParam) setActiveFilterId(tripIdParam);
      else if (searchParam) setSearchQuery(searchParam);
      fetchBoardData();
      const refreshInterval = setInterval(fetchBoardData, POLL_MS);
      return () => clearInterval(refreshInterval);
    }, [fetchBoardData, tripIdParam, searchParam])
  );

  const onRefresh = () => { setRefreshing(true); fetchBoardData(); };

  const companies    = useMemo(() => {
    const fromPre  = predefinedEntries.map((e) => e.company);
    const fromDisp = dispatchTrips.map((t) => t.company);
    return ['All', ...Array.from(new Set([...fromPre, ...fromDisp]))];
  }, [predefinedEntries, dispatchTrips]);

  const busTypes     = ['All', 'Aircon', 'Regular'];
  const statusFilters = ['All', 'Scheduled', 'Arrived', 'Not Arrived', 'Departed', 'Under Maintenance'];

  const filteredPredefined = useMemo(() => {
    if (['Arrived', 'Under Maintenance', 'Departed'].includes(selectedStatus)) return [];
    let data = predefinedEntries.filter((item) => item.status !== 'arrived');
    if (selectedStatus === 'Scheduled')   data = data.filter((i) => i.status === 'scheduled');
    else if (selectedStatus === 'Not Arrived') data = data.filter((i) => i.status === 'not_arrived');
    if (activeFilterId && searchQuery === '') data = data.filter((i) => i.rowKey === activeFilterId);
    if (selectedCompany !== 'All') data = data.filter((i) => i.company === selectedCompany);
    if (selectedBusType !== 'All') data = data.filter((i) => (i.busType || 'Regular') === selectedBusType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(i => i.route.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || String(i.plateNumber).toLowerCase().includes(q));
    }
    return data;
  }, [predefinedEntries, searchQuery, activeFilterId, selectedCompany, selectedBusType, selectedStatus]);

  const filteredDispatch = useMemo(() => {
    if (['Scheduled', 'Not Arrived'].includes(selectedStatus)) return [];
    let data = [...dispatchTrips];
    if (selectedStatus === 'Arrived')          data = data.filter((i) => (i.displayStatus ?? i.status ?? '').trim() === 'Arrived');
    else if (selectedStatus === 'Departed')    data = data.filter((i) => (i.displayStatus ?? i.status ?? '').trim() === 'Departed');
    else if (selectedStatus === 'Under Maintenance') data = data.filter((i) => (i.displayStatus ?? i.status ?? '').trim() === 'Under Maintenance');
    if (activeFilterId && searchQuery === '') data = data.filter((i) => i._id === activeFilterId);
    if (selectedCompany !== 'All') data = data.filter((i) => i.company === selectedCompany);
    if (selectedBusType !== 'All') data = data.filter((i) => (i.busType || 'Regular') === selectedBusType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(i => i.route.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || String(i.templateNo).toLowerCase().includes(q));
    }
    return data;
  }, [dispatchTrips, searchQuery, activeFilterId, selectedCompany, selectedBusType, selectedStatus]);

  const combinedBoardData = useMemo(() => [...filteredPredefined, ...filteredDispatch], [filteredPredefined, filteredDispatch]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilterId(null);
    setSelectedCompany('All');
    setSelectedBusType('All');
    setSelectedStatus('All');
    router.setParams({ tripId: '', search: '' });
  };

  const hasActiveDropdownFilters = selectedStatus !== 'All' || selectedBusType !== 'All';

  const renderBoardItem = useCallback(({ item }: ListRenderItemInfo<BoardRow>) => {
    if (isPredefinedRow(item)) return <PredefinedCard item={item} primaryColor={primaryColor} />;
    return <DispatchCard item={item as DispatchTrip} />;
  }, [primaryColor]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading bus trips…</Text>
        </View>
      </View>
    );
  }

 
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.headerContainer}>

        <View style={styles.titleBar}>
          <View>
            <Text style={styles.headerTitle}>Bus Schedules</Text>
            <Text style={styles.headerSubtitle}>{todayDate}</Text>
          </View>
          <View style={[styles.totalBadge, { borderColor: primaryColor, backgroundColor: 'transparent' }]}>
            <Text style={[styles.totalBadgeText, { color: primaryColor }]}>{combinedBoardData.length}</Text>
            <Text style={[styles.totalBadgeLabel, { color: primaryColor }]}>trips</Text>
          </View>
        </View>

        {fetchError && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#991B1B" />
            <Text style={styles.errorBannerText}>{fetchError}</Text>
          </View>
        )}

        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search route, company, bus no…"
            onChangeText={(text) => { setSearchQuery(text); if (activeFilterId) setActiveFilterId(null); }}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#6B7280"
            clearIcon="close-circle"
            theme={{ colors: { primary: '#4B5563' } }}
            cursorColor="#4B5563"
            selectionColor="#4B5563"
          />
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchorPosition="bottom"
            anchor={
              <TouchableOpacity
                onPress={() => setFilterMenuVisible(true)}
                style={[
                  styles.filterButton, 
                  hasActiveDropdownFilters && [styles.filterButtonActive, { backgroundColor: primaryColor, borderColor: primaryColor }]
                ]}
              >
                <MaterialCommunityIcons
                  name={hasActiveDropdownFilters ? 'filter' : 'filter-variant'}
                  size={20}
                  color={hasActiveDropdownFilters ? '#FFFFFF' : '#374151'}
                />
                {hasActiveDropdownFilters && <View style={styles.filterDot} />}
              </TouchableOpacity>
            }
          >
            <Text style={styles.menuSectionTitle}>Trip Status</Text>
            {statusFilters.map(status => (
              <Menu.Item
                key={`status-${status}`}
                onPress={() => { setSelectedStatus(status); setFilterMenuVisible(false); }}
                title={status}
                leadingIcon={selectedStatus === status ? 'check-circle' : 'circle-outline'}
              />
            ))}
            <Divider style={{ marginVertical: 6 }} />
            <Text style={styles.menuSectionTitle}>Bus Type</Text>
            {busTypes.map(type => (
              <Menu.Item
                key={`type-${type}`}
                onPress={() => { setSelectedBusType(type); setFilterMenuVisible(false); }}
                title={type}
                leadingIcon={selectedBusType === type ? 'check-circle' : 'circle-outline'}
              />
            ))}
          </Menu>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 8 }}>
          {companies.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedCompany(c)}
              style={[
                styles.chip, 
                selectedCompany === c && [styles.chipActive, { backgroundColor: primaryColor, borderColor: primaryColor }]
              ]}
            >
              <Text style={[styles.chipText, selectedCompany === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeFilterId && (
          <View style={styles.filterBanner}>
            <MaterialCommunityIcons name="filter-check" size={15} color={primaryColor} />
            <Text style={[styles.filterBannerText, { color: primaryColor }]}>Showing a specific trip</Text>
            <TouchableOpacity onPress={clearFilters} style={[styles.clearBtn, { backgroundColor: primaryColor }]}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList<BoardRow>
        data={combinedBoardData}
        keyExtractor={(item, index) =>
          isPredefinedRow(item) ? `pre-${item.rowKey}` : `disp-${String((item as DispatchTrip)._id ?? index)}`
        }
        renderItem={renderBoardItem}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bus-stop" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyBody}>No buses match the current filters. Try adjusting your search or filter options.</Text>
            <TouchableOpacity onPress={clearFilters} style={[styles.emptyBtn, { backgroundColor: primaryColor }]}>
              <Text style={styles.emptyBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  centerContent:   { justifyContent: 'center', alignItems: 'center' },

  loadingCard:     { alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  loadingText:     { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  headerContainer: { backgroundColor: '#FFFFFF', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10 },
  titleBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  headerSubtitle:  { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  totalBadge:      { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  totalBadgeText:  { fontSize: 20, fontWeight: '800' }, 
  totalBadgeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorBannerText: { flex: 1, fontSize: 13, color: '#991B1B', fontWeight: '500' },

  searchRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  searchBar:       { flex: 1, backgroundColor: '#F9FAFB', elevation: 0, borderRadius: 12, height: 46, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput:     { fontSize: 14, color: '#111827', alignSelf: 'center' },
  filterButton:    { height: 46, width: 46, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  filterButtonActive: { }, 
  filterDot:       { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },
  menuSectionTitle:{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 3, fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },

  chipScroll:      { flexGrow: 0, marginBottom: 2 },
  chip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F9FAFB', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:      { }, 
  chipText:        { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive:  { color: '#FFFFFF' },

  filterBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 9, borderRadius: 9, marginTop: 10, gap: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  filterBannerText:{ flex: 1, fontSize: 13, fontWeight: '600' },
  clearBtn:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }, 
  clearBtnText:    { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  listContent:     { padding: 14, paddingBottom: 140 },

  emptyState:      { paddingVertical: 52, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle:      { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 6 },
  emptyBody:       { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  emptyBtn:        { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }, 
  emptyBtnText:    { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

  card:            { backgroundColor: '#FFFFFF', marginBottom: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardContent:     { paddingTop: 14, paddingBottom: 14 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrapper:   { flexShrink: 0 },
  avatarScheduled: { backgroundColor: '#EFF6FF' },
  avatarDispatch:  { backgroundColor: '#ECFDF5' },
  cardTitleBlock:  { flex: 1 },
  companyName:     { fontSize: 15, fontWeight: '700', color: '#111827' },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:        { fontSize: 12, color: '#6B7280' },
  metaDot:         { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  cardDivider:     { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, flexShrink: 0, maxWidth: 140 },
  statusDot:       { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  detailsGrid:     { gap: 8 },
  detailsRow:      { flexDirection: 'row', gap: 8 },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoLabel:       { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700', marginBottom: 1 },
  infoValue:       { fontSize: 14, color: '#111827', fontWeight: '600', lineHeight: 20 },

  timePill:        { alignItems: 'flex-end', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 110 },
  timePillLabel:   { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  timePillValue:   { fontSize: 20, fontWeight: '800', color: '#065F46', marginTop: 2 },
});