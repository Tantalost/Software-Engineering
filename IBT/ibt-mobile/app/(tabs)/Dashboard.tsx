import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  View, 
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Video, ResizeMode } from 'expo-av';

import  API_URL  from '@/src/config'; 

const { width } = Dimensions.get('window');

interface Attachment {
  type: 'image' | 'video';
  uri: string;
}

interface NewsItem {
  id: string;
  title: string;
  message: string;
  source: string;
  date: string;
  attachments?: Attachment[];
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
 
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/broadcasts`);
        const data = await response.json();
        setNewsItems(data);
      } catch (error) {
        console.error("Error fetching broadcasts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBroadcasts();
  }, []);

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

        {loading ? (
           <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 50 }} />
        ) : (
          newsItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
            <Card key={item.id} style={styles.newsCard}>
              <Card.Content>
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

                {item.attachments && item.attachments.length > 0 && (
                  <View style={styles.mediaCarouselContainer}>
                    <ScrollView 
                      horizontal 
                      pagingEnabled 
                      showsHorizontalScrollIndicator={false}
                    >
                      {item.attachments.map((media, index) => (
                        <View key={index} style={styles.mediaWrapper}>
                          {media.type === 'image' ? (
                            <Image 
                              source={{ uri: `${API_URL}${media.uri}` }} 
                              style={styles.mediaItem} 
                              resizeMode="cover" 
                            />
                          ) : (
                            <Video
                              source={{ uri: `${API_URL}${media.uri}` }}
                              style={styles.mediaItem}
                              useNativeControls

                              resizeMode={ResizeMode.CONTAIN}
                              isLooping
                            />
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    {item.attachments.length > 1 && (
                      <Text style={styles.swipeIndicatorText}>
                        Swipe to see more ({item.attachments.length})
                      </Text>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
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
  dateText: { fontSize: 11, color: '#666', marginTop: 1 },
  postTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  postBody: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 15 },
  mediaCarouselContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaWrapper: {
    width: width - 75, 
    height: 200,
    backgroundColor: '#000', 
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaItem: { 
    width: '100%', 
    height: '100%' 
  },
  swipeIndicatorText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  }
});