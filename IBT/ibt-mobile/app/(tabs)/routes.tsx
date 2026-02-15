import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Searchbar, Chip, Avatar, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import API_URL from '../../src/config'; 

// --- Interface ---
interface BusTrip {
  _id: string;
  templateNo: string;
  route: string;
  time: string;
  date: string;
  company: string;
  status: string;
  busType?: string; 
  price?: number;   
  seats?: number;   
}

export default function RoutesPage() {
  const router = useRouter();
  
  const params = useLocalSearchParams<{ tripId?: string; search?: string }>();
  
  const [routes, setRoutes] = useState<BusTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (params.tripId) {
        setActiveFilterId(params.tripId);
      } else if (params.search) {
        setSearchQuery(params.search);
      }
      fetchRoutes();
    }, [params])
  );

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${API_URL}/bus-routes`);
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  // --- NEW HELPER: Convert 24h to 12h AM/PM ---
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    // Splits "14:30" into ["14", "30"]
    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    // Convert 24h to 12h
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    
    return `${hour}:${minuteStr} ${ampm}`;
  };

  // --- Filtering Logic ---
  const filteredRoutes = useMemo(() => {
    let data = routes;

    if (activeFilterId && searchQuery === '') {
      return data.filter(item => item._id === activeFilterId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.route.toLowerCase().includes(query) ||
          item.company.toLowerCase().includes(query) ||
          item.templateNo.toLowerCase().includes(query)
      );
    }

    return data;
  }, [routes, searchQuery, activeFilterId]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilterId(null);
    router.setParams({ tripId: '', search: '' }); 
  };

  // --- Render Individual Route Card ---
  const renderItem = ({ item }: { item: BusTrip }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.companyContainer}>
             <Avatar.Icon 
                size={36} 
                icon="bus" 
                style={{backgroundColor: '#E8F5E9'}} 
                color="#1B5E20"
             />
             <View>
                <Text variant="titleMedium" style={styles.companyName}>{item.company}</Text>
                <Text variant="bodySmall" style={styles.busType}>{item.busType || 'Standard Class'}</Text>
             </View>
          </View>
         
        </View>

        <Divider style={styles.divider} />

        <View style={styles.routeRow}>
           <View style={{flex: 1}}>
              <Text style={styles.label}>Route</Text>
              <Text variant="titleMedium" style={styles.value}>{item.route}</Text>
           </View>
           <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.label}>Departure</Text>
              
              {/* ✅ UPDATED: Now uses formatTime() */}
              <Text variant="titleMedium" style={styles.timeValue}>{formatTime(item.time)}</Text>
              
              <Text variant="bodySmall" style={styles.dateValue}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
           </View>
        </View>

        <View style={styles.footerRow}>
           <Text style={styles.templateId}>ID: {item.templateNo}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Bus Schedules</Text>
        
        <Searchbar
          placeholder="Search location, company..."
          onChangeText={(text) => {
            setSearchQuery(text);
            if (activeFilterId) setActiveFilterId(null); 
          }}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#1B5E20"
        />

        {activeFilterId && (
          <View style={styles.filterBanner}>
            <MaterialCommunityIcons name="filter" size={16} color="#155724" />
            <Text style={styles.filterText}>Showing selected route</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main List */}
      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bus-alert" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No schedules found.</Text>
            {(searchQuery || activeFilterId) && (
               <Button mode="text" onPress={clearFilters} textColor="#1B5E20">Clear Search</Button>
            )}
          </View>
        }
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
    marginBottom: 12,
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
  },
  companyName: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  busType: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    backgroundColor: '#E0F7EC',
    height: 30,
    alignItems: 'center',
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
  dateValue: {
    color: '#666',
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    alignItems: 'center',
  },
  templateId: {
    color: '#999',
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});