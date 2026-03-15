import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text, Card, Searchbar, Avatar, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import API_URL from '../../src/config'; 

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
  parkingEstimation?: string; 
  expectedDeparture?: string; 
}

export default function RoutesPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; search?: string }>();
  const todayDate = new Date().toLocaleDateString(); 
  const [routes, setRoutes] = useState<BusTrip[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);


  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedBusType, setSelectedBusType] = useState('All');

  useFocusEffect(
    useCallback(() => {
      if (params.tripId) {
        setActiveFilterId(params.tripId);
      } else if (params.search) {
        setSearchQuery(params.search);
      }
      
      fetchRoutes();

      const refreshInterval = setInterval(() => {
        fetchRoutes();
      }, 60000); 

      return () => clearInterval(refreshInterval);
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

  const isPastArrival = (dateString: string, timeString: string) => {
    if (!dateString || !timeString) return false;
    try {
      const scheduledDate = new Date(dateString);
      const [hours, minutes] = timeString.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
      return new Date() > scheduledDate; 
    } catch (error) {
      return false;
    }
  };


  const companies = ['All', ...Array.from(new Set(routes.map(r => r.company)))];
  const busTypes = ['All', 'Aircon', 'Regular'];

  const filteredRoutes = useMemo(() => {
   
    let data = routes.filter(item => 
      item.status === 'Pending' || 
      item.status === 'Arrived' || 
      item.status === 'Scheduled'
    );

    if (activeFilterId && searchQuery === '') {
      return data.filter(item => item._id === activeFilterId);
    }

    if (selectedCompany !== 'All') {
      data = data.filter(item => item.company === selectedCompany);
    }

    if (selectedBusType !== 'All') {
    
      data = data.filter(item => (item.busType || 'Regular') === selectedBusType);
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
  }, [routes, searchQuery, activeFilterId, selectedCompany, selectedBusType]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilterId(null);
    setSelectedCompany('All');
    setSelectedBusType('All');
    router.setParams({ tripId: '', search: '' }); 
  };

  const renderItem = ({ item }: { item: BusTrip }) => {
    const hasArrived = item.status === 'Arrived';
    const isScheduled = item.status === 'Scheduled';
    const isDelayed = !hasArrived && !isScheduled && isPastArrival(item.date, item.time);
    
    let statusText = 'Est. Arrival';
    let statusColor = '#E67E22'; 

    if (isScheduled) {
        statusText = 'Scheduled';
        statusColor = '#2980B9'; 
    } else if (hasArrived) {
        statusText = 'Arrived At';
        statusColor = '#27AE60'; 
    } else if (isDelayed) {
        statusText = 'Delayed';
        statusColor = '#C0392B'; 
    }

    return (
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          
          <View style={styles.cardHeader}>
            <View style={styles.companyContainer}>
              <Avatar.Icon size={40} icon="bus" style={{ backgroundColor: '#E8F5E9' }} color="#1B5E20" />
              <View>
                <Text style={styles.companyName}>{item.company}</Text>
               
                <Text style={styles.busType}>{item.templateNo} • {item.busType || 'Regular'}</Text>
              </View>
            </View>
            <View style={[styles.statusChip, { backgroundColor: isScheduled ? '#EBF5FB' : (hasArrived ? '#E0F7EC' : '#FFF3CD') }]}>
               <Text style={{ color: isScheduled ? '#2980B9' : (hasArrived ? '#1B5E20' : '#856404'), fontSize: 12, fontWeight: 'bold', paddingHorizontal: 12 }}>
                  {item.status}
               </Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <View style={styles.routeRow}>
            
             <View style={{flex: 1}}>
                <Text style={styles.label}>Route</Text>
                <Text variant="titleMedium" style={styles.value}>{item.route}</Text>

                {item.parkingEstimation && (
                  <>
                    <Text style={[styles.label, { marginTop: 12 }]}>Parking Est.</Text>
                    <Text variant="bodyMedium" style={[styles.value, { color: '#555' }]}>
                      {item.parkingEstimation}
                    </Text>
                  </>
                )}
             </View>
             
            
             <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.label, { color: statusColor, fontWeight: 'bold' }]}>
                  {statusText}
                </Text>
                <Text variant="titleLarge" style={[styles.timeValue, { color: statusColor }]}>
                  {formatTime(item.time)}
                </Text>

               
                {item.expectedDeparture && (
                  <>
                    <Text style={[styles.label, { marginTop: 12 }]}>Exp. Departure</Text>
                    <Text variant="titleMedium" style={[styles.timeValue, { color: '#D35400' }]}>
                      {formatTime(item.expectedDeparture)}
                    </Text>
                  </>
                )}
             </View>
          </View>
        </Card.Content>
      </Card>
    );
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
        <Text variant="headlineMedium" style={styles.headerTitle}>Bus Schedules</Text>
        
        <Text style={styles.dateHeader}>Today: {todayDate}</Text>

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
          cursorColor={'#0000008e'}
        />

       
        <View style={styles.filtersContainer}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {companies.map(c => (
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
                style={[
                  styles.segmentButton,
                  isActive && styles.activeSegmentButton,
                  index !== 0 && !isActive && styles.segmentBorder
                ]}
              >
                <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        </View>

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
            {(searchQuery || activeFilterId || selectedCompany !== 'All' || selectedBusType !== 'All') && (
               <Button mode="text" onPress={clearFilters} textColor="#1B5E20">Clear All Filters</Button>
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
  dateHeader: {
    fontSize: 16,
    color: '#1B5E20',
    marginBottom: 12,
    fontWeight: '800',
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
    backgroundColor: '#E0F7EC',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
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