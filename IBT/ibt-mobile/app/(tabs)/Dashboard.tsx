import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState} from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  View, 
  TouchableOpacity,
  Image 
} from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const newsItems = [
    {
      id: '1',
      title: 'Rent Payment Deadline Reminder',
      message: 'This is a friendly reminder to all current tenants that the deadline for February Stall Rentals and Utility Dues is on the 5th of next month.',
      source: 'INTEGRATED BUS TERMINAL ZC',
      date: 'Feb 15, 2026 • 10:30 AM', // Added date indication
      attachment: { type: 'image', uri: 'https://via.placeholder.com/300x150/5D9351/FFFFFF?text=Rent+Statement+Preview' }
    },
    {
      id: '2',
      title: 'Monthly Stall Inspection Schedule',
      message: 'To ensure the safety and cleanliness of our terminal, the IBT Management will conduct its monthly facility inspection on February 20, 2026.',
      source: 'INTEGRATED BUS TERMINAL ZC',
      date: 'Feb 14, 2026 • 09:00 AM', // Added date indication
      attachment: { type: 'pdf', name: 'Inspection_Schedule.pdf' }
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.feedTitle}>NEWS FEED</Text>

        <View style={styles.searchSection}>
          <TextInput 
            style={styles.searchBar} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            placeholder="Search announcements..." 
          />
          <Icon name="magnify" size={24} color="#333" />
        </View>

        {newsItems.map((item) => (
          <Card key={item.id} style={styles.newsCard}>
            <Card.Content>
              {/* Header with Source and Date Indication */}
              <View style={styles.postHeader}>
                <View style={styles.avatarBorder}>
                  <Avatar.Icon size={28} icon="bus" style={styles.postAvatar} color="#1B5E20" />
                </View>
                <View>
                  <Text style={styles.sourceText}>{item.source}</Text>
                  <Text style={styles.dateText}>{item.date}</Text> 
                </View>
              </View>
              
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postBody}>{item.message}</Text>

              {/* Media Preview Aligned with Broadcast Uploads */}
              {item.attachment && (
                <TouchableOpacity style={styles.mediaWrapper} activeOpacity={0.9}>
                  {item.attachment.type === 'image' ? (
                    <Image source={{ uri: item.attachment.uri }} style={styles.imagePreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.pdfPreview}>
                      <Icon name="file-pdf-box" size={32} color="#FFF" />
                      <Text style={styles.pdfText}>{item.attachment.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  feedTitle: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 20, marginTop: 10 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 15, marginBottom: 30, height: 48 },
  searchBar: { flex: 1, fontSize: 16 },
  newsCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0', elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarBorder: { borderWidth: 1, borderColor: '#1B5E20', borderRadius: 20, padding: 2, marginRight: 12 },
  postAvatar: { backgroundColor: '#FFF' },
  sourceText: { fontWeight: 'bold', fontSize: 13, color: '#000' },
  dateText: { fontSize: 11, color: '#666', marginTop: 1 }, // Styling for the date indication
  postTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  postBody: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 15 },
  mediaWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#5D9351', // Matching green brand color
  },
  imagePreview: { width: '100%', height: '100%' },
  pdfPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  pdfText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});