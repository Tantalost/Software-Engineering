import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  type SectionListRenderItemInfo,
} from 'react-native';
import { Text, Card, Searchbar, Avatar, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import API_URL from '../../src/config';
import { fetchTerminalBoardFromLegacyApi } from '../../src/services/terminalBoardFromLegacyApi';
import type { PredefinedEntry, DispatchTrip, PredefinedStatus } from '../../src/types/terminalBoard.types';

const POLL_MS = 45000;

type BoardRow = PredefinedEntry | DispatchTrip;

interface BoardSection {
  key: 'pre' | 'disp';
  title: string;
  data: BoardRow[];
}

const PREDEFINED_BADGE: Record<PredefinedStatus, { emoji: string; label: string; bg: string; fg: string }> = {
  scheduled: { emoji: '🟡', label: 'Scheduled', bg: '#FFF8E1', fg: '#F57F17' },
  arrived: { emoji: '🟢', label: 'Arrived', bg: '#E8F5E9', fg: '#1B5E20' },
  not_arrived: { emoji: '🔴', label: 'Not Arrived', bg: '#FFEBEE', fg: '#C62828' },
};

function dispatchBadge(displayStatus: string) {
  const s = (displayStatus || '').trim();
  if (s === 'Departed') return { emoji: '🟢', bg: '#E8F5E9', fg: '#1B5E20' };
  if (s === 'Not Departed') return { emoji: '🔴', bg: '#FFEBEE', fg: '#C62828' };
  if (s === 'To Be Fixed') return { emoji: '🔧', bg: '#FFF3E0', fg: '#E65100' };
  if (s === 'Arrived') return { emoji: '🟢', bg: '#E3F2FD', fg: '#1565C0' };
  return { emoji: '⚪', bg: '#F5F5F5', fg: '#424242' };
}

function getStopsLabel(item: DispatchTrip) {
  if (item.stopsLabel && item.stopsLabel.trim()) return item.stopsLabel;
  if (item.stopType === 'Other' && (item.customStopCount ?? 0) > 0) {
    return `${item.customStopCount}-stop`;
  }
  return item.stopType || 'Regular Trip';
}

function isPredefinedRow(item: BoardRow): item is PredefinedEntry {
  return typeof (item as PredefinedEntry).rowKey === 'string' && (item as PredefinedEntry).rowKey.length > 0;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export default function RoutesPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; search?: string }>();
  const todayDate = new Date().toLocaleDateString();

  const [predefinedEntries, setPredefinedEntries] = useState<PredefinedEntry[]>([]);
  const [dispatchTrips, setDispatchTrips] = useState<DispatchTrip[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedBusType, setSelectedBusType] = useState('All');

  const tripIdParam = typeof params.tripId === 'string' ? params.tripId : undefined;
  const searchParam = typeof params.search === 'string' ? params.search : undefined;

  const fetchBoardData = useCallback(async () => {
    const preUrl = `${API_URL}/predefined-schedule/today`;
    const dispUrl = `${API_URL}/dispatch-board/today`;
    try {
      const [preRes, dispRes] = await Promise.all([fetch(preUrl), fetch(dispUrl)]);

      /** New routes not deployed yet — same data via /companies, /bustrips, /schedule-not-arrivals */
      if (preRes.status === 404 || dispRes.status === 404) {
        try {
          const { entries, trips } = await fetchTerminalBoardFromLegacyApi(API_URL);
          setPredefinedEntries(entries);
          setDispatchTrips(trips);
          setFetchError(null);
        } catch (legacyErr) {
          console.error('Legacy terminal board fallback failed:', legacyErr);
          setPredefinedEntries([]);
          setDispatchTrips([]);
          setFetchError(
            'Schedule API returned 404 (not deployed). Fallback failed: check /companies, /bustrips, and /schedule-not-arrivals on your server.'
          );
        }
        return;
      }

      const errors: string[] = [];
      if (!preRes.ok) {
        errors.push(`Schedule (${preRes.status})`);
        setPredefinedEntries([]);
      } else {
        const preJson = await parseJsonSafe(preRes);
        const entries =
          preJson && typeof preJson === 'object' && preJson !== null && 'entries' in preJson
            ? (preJson as { entries: unknown }).entries
            : null;
        setPredefinedEntries(Array.isArray(entries) ? (entries as PredefinedEntry[]) : []);
      }

      if (!dispRes.ok) {
        errors.push(`Dispatch (${dispRes.status})`);
        setDispatchTrips([]);
      } else {
        const dispJson = await parseJsonSafe(dispRes);
        const trips =
          dispJson && typeof dispJson === 'object' && dispJson !== null && 'trips' in dispJson
            ? (dispJson as { trips: unknown }).trips
            : null;
        setDispatchTrips(Array.isArray(trips) ? (trips as DispatchTrip[]) : []);
      }

      if (errors.length > 0) {
        setFetchError(
          `Could not load: ${errors.join(', ')}. Deploy the latest API or check the server.`
        );
      } else {
        setFetchError(null);
      }
    } catch (error) {
      console.error('Error fetching terminal boards:', error);
      setPredefinedEntries([]);
      setDispatchTrips([]);
      setFetchError('Network error. Check your connection and API URL in src/config.js.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (tripIdParam) {
        setActiveFilterId(tripIdParam);
      } else if (searchParam) {
        setSearchQuery(searchParam);
      }

      fetchBoardData();

      const refreshInterval = setInterval(fetchBoardData, POLL_MS);

      return () => clearInterval(refreshInterval);
    }, [fetchBoardData, tripIdParam, searchParam])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBoardData();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minuteStr = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minuteStr} ${ampm}`;
  };

  const companies = useMemo(() => {
    const fromPre = predefinedEntries.map((e) => e.company);
    const fromDisp = dispatchTrips.map((t) => t.company);
    return ['All', ...Array.from(new Set([...fromPre, ...fromDisp]))];
  }, [predefinedEntries, dispatchTrips]);

  const busTypes = ['All', 'Aircon', 'Regular'];

  const filteredPredefined = useMemo(() => {
    let data = [...predefinedEntries];

    if (activeFilterId && searchQuery === '') {
      data = data.filter((item) => item.rowKey === activeFilterId);
    }

    if (selectedCompany !== 'All') {
      data = data.filter((item) => item.company === selectedCompany);
    }

    if (selectedBusType !== 'All') {
      data = data.filter((item) => (item.busType || 'Regular') === selectedBusType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.route.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          String(item.plateNumber).toLowerCase().includes(q)
      );
    }

    return data;
  }, [predefinedEntries, searchQuery, activeFilterId, selectedCompany, selectedBusType]);

  const filteredDispatch = useMemo(() => {
    let data = [...dispatchTrips];

    if (activeFilterId && searchQuery === '') {
      data = data.filter((item) => item._id === activeFilterId);
    }

    if (selectedCompany !== 'All') {
      data = data.filter((item) => item.company === selectedCompany);
    }

    if (selectedBusType !== 'All') {
      data = data.filter((item) => (item.busType || 'Regular') === selectedBusType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.route.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          String(item.templateNo).toLowerCase().includes(q)
      );
    }

    return data;
  }, [dispatchTrips, searchQuery, activeFilterId, selectedCompany, selectedBusType]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilterId(null);
    setSelectedCompany('All');
    setSelectedBusType('All');
    router.setParams({ tripId: '', search: '' });
  };

  const renderPredefinedItem = ({ item }: { item: PredefinedEntry }) => {
    const badge = PREDEFINED_BADGE[item.status] || PREDEFINED_BADGE.scheduled;
    return (
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.companyContainer}>
              <Avatar.Icon size={40} icon="calendar-clock" style={{ backgroundColor: '#E3F2FD' }} color="#1565C0" />
              <View>
                <Text style={styles.companyName}>{item.company}</Text>
                <Text style={styles.busType}>
                  {item.plateNumber} • {item.busType || 'Regular'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusChip, { backgroundColor: badge.bg }]}>
              <Text style={{ color: badge.fg, fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10 }}>
                {badge.emoji} {badge.label}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.routeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Route</Text>
              <Text variant="titleMedium" style={styles.value}>
                {item.route}
              </Text>

              <Text style={[styles.label, { marginTop: 12 }]}>Expected Scheduled Time</Text>
              <Text variant="bodyMedium" style={styles.value}>
                {item.scheduleTime} ({item.timeWindowLabel})
              </Text>

              {item.notArrivalRemark ? (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>Remark</Text>
                  <Text variant="bodyMedium" style={[styles.value, { color: '#546E7A' }]}>
                    {item.notArrivalRemark}
                  </Text>
                </>
              ) : null}

              {item.blockedByOtherSlot ? (
                <Text style={{ marginTop: 8, fontSize: 12, color: '#78909C', fontStyle: 'italic' }}>
                  Another trip for this bus was marked not arriving today.
                </Text>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDispatchItem = ({ item }: { item: DispatchTrip }) => {
    const label = (item.displayStatus ?? item.status ?? '').trim();
    const b = dispatchBadge(label);
    return (
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.companyContainer}>
              <Avatar.Icon size={40} icon="bus" style={{ backgroundColor: '#E8F5E9' }} color="#1B5E20" />
              <View>
                <Text style={styles.companyName}>{item.company}</Text>
                <Text style={styles.busType}>
                  {item.templateNo} • {item.busType || 'Regular'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusChip, { backgroundColor: b.bg }]}>
              <Text style={{ color: b.fg, fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10 }}>
                {b.emoji} {label || item.status || '—'}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.routeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Route</Text>
              <Text variant="titleMedium" style={styles.value}>
                {item.route}
              </Text>

              <Text style={[styles.label, { marginTop: 10 }]}>Stops</Text>
              <Text style={styles.value}>{getStopsLabel(item)}</Text>

              {item.ticketReferenceNo ? (
                <>
                  <Text style={[styles.label, { marginTop: 10 }]}>Ticket ref</Text>
                  <Text style={styles.value}>{item.ticketReferenceNo}</Text>
                </>
              ) : null}

              {item.seatingCapacity != null ? (
                <>
                  <Text style={[styles.label, { marginTop: 10 }]}>Seats</Text>
                  <Text style={styles.value}>{item.seatingCapacity}</Text>
                </>
              ) : null}

              {item.parkingEstimation ? (
                <>
                  <Text style={[styles.label, { marginTop: 10 }]}>Park est.</Text>
                  <Text style={[styles.value, { color: '#555' }]}>{item.parkingEstimation}</Text>
                </>
              ) : null}
            </View>

            <View style={{ alignItems: 'flex-end', minWidth: 120 }}>
              <Text style={[styles.label, { color: '#1B5E20', fontWeight: 'bold' }]}>Time (arrived)</Text>
              <Text variant="titleLarge" style={[styles.timeValue, { color: '#1B5E20' }]}>
                {formatTime(item.time)}
              </Text>

              {item.expectedDeparture ? (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>Exp. dep.</Text>
                  <Text variant="titleMedium" style={[styles.timeValue, { color: '#D35400' }]}>
                    {formatTime(item.expectedDeparture)}
                  </Text>
                </>
              ) : null}

              {item.departureTime ? (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>Actual dep.</Text>
                  <Text variant="bodyLarge" style={{ fontWeight: '700', color: '#333' }}>
                    {item.departureTime}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const boardSections: BoardSection[] = useMemo(
    () => [
      { key: 'pre', title: 'Expected Schedule', data: filteredPredefined },
      { key: 'disp', title: 'Dispatch Board', data: filteredDispatch },
    ],
    [filteredPredefined, filteredDispatch]
  );

  const renderBoardItem = ({ item, section }: SectionListRenderItemInfo<BoardRow, BoardSection>) => {
    if (section.key === 'pre' && isPredefinedRow(item)) {
      return renderPredefinedItem({ item });
    }
    return renderDispatchItem({ item: item as DispatchTrip });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Bus terminal
        </Text>

        <Text style={styles.dateHeader}>Today: {todayDate}</Text>
      
        {fetchError ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B71C1C" />
            <Text style={styles.errorBannerText}>{fetchError}</Text>
          </View>
        ) : null}

        <Searchbar
          placeholder="Search route, company, bus no…"
          onChangeText={(text) => {
            setSearchQuery(text);
            if (activeFilterId) setActiveFilterId(null);
          }}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#1B5E20"
          cursorColor={'#0000008e'}
        />

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {companies.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCompany(c)}
                style={[styles.filterChip, selectedCompany === c && styles.activeFilterChip]}
              >
                <Text style={[styles.filterChipText, selectedCompany === c && styles.activeFilterChipText]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.segmentedControl}>
            {busTypes.map((type, index) => {
              const isActive = selectedBusType === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBusType(type)}
                  style={[styles.segmentButton, isActive && styles.activeSegmentButton, index !== 0 && !isActive && styles.segmentBorder]}
                >
                  <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {activeFilterId && (
          <View style={styles.filterBanner}>
            <MaterialCommunityIcons name="filter" size={16} color="#155724" />
            <Text style={styles.filterText}>Showing selected item</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilterText}>Show all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SectionList<BoardRow, BoardSection>
        sections={boardSections}
        keyExtractor={(item, index) =>
          isPredefinedRow(item)
            ? `pre-${item.rowKey}`
            : `disp-${String((item as DispatchTrip)._id ?? index)}`
        }
        renderItem={renderBoardItem}
        renderSectionHeader={({ section }: { section: BoardSection }) => (
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionHeaderTitle}>
              {section.title}
            </Text>
          </View>
        )}
        renderSectionFooter={({ section }: { section: BoardSection }) =>
          section.data.length > 0 ? null : (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyText}>
                {section.key === 'pre'
                  ? 'No buses scheduled yet for today.'
                  : 'No buses on the dispatch board yet today.'}
              </Text>
            </View>
          )
        }
        SectionSeparatorComponent={() => <View style={styles.sectionSpacer} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  dateHeader: {
    fontSize: 16,
    color: '#1B5E20',
    marginBottom: 6,
    fontWeight: '800',
  },
  hint: {
    fontSize: 11,
    color: '#78909C',
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#B71C1C',
    lineHeight: 18,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  sectionHeaderTitle: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  sectionEmpty: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionEmptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  sectionSpacer: {
    height: 8,
  },
  searchBar: {
    backgroundColor: '#F0F4F8',
    elevation: 0,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    fontSize: 14,
    alignSelf: 'center',
    color: 'black',
  },
  filtersContainer: {
    marginTop: 12,
    gap: 10,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilterChip: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 8,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  companyName: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  busType: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  statusChip: {
    maxWidth: '48%',
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#F0F0F0',
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: '600',
  },
  value: {
    color: '#333',
    fontWeight: '700',
  },
  timeValue: {
    color: '#1B5E20',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    marginTop: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  activeSegmentButton: {
    backgroundColor: '#1B5E20',
  },
  segmentText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  activeSegmentText: {
    color: '#FFFFFF',
  },
});
