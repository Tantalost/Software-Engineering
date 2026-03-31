import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet,  
  View, 
  Image as RNImage, 
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList
} from 'react-native';

import { Avatar, Card, Text, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import API_URL from '@/src/config'; 

const { width, height } = Dimensions.get('window');
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

interface Attachment {
  type: 'image' | 'video';
  uri: string;
}

interface NewsItem {
  id?: string;
  _id?: string;
  title: string;
  message: string;
  source?: string;
  date: string;
  attachments?: Attachment[];
}

const getMediaUrl = (uri: string) => {
  if (!uri) return '';
  return uri.startsWith('http') ? uri : `${BASE_URL}${uri}`;
};

const FeedVideo = ({ videoUri }: { videoUri: string }) => {
  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
  });

  return (
    <VideoView
      style={styles.mediaItem}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 

  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<{uri: string}[]>([]);
  
  const scale = useSharedValue(1);

  const fetchBroadcasts = async () => {
    try {
      const cleanUrl = API_URL.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/broadcasts`);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        setNewsItems(data);
      } else {
        const errorText = await response.text();
        console.error("CRITICAL: Backend returned HTML instead of JSON. Here is the response:", errorText.substring(0, 150));
        setNewsItems([]); 
      }
    } catch (error) {
      console.error("Network error fetching broadcasts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBroadcasts();
    setRefreshing(false);
  }, []);

  const openImageViewer = (attachments: Attachment[], tappedMediaUri: string) => {
    const imagesOnly = attachments.filter(a => a.type === 'image');
    
    const formattedImages = imagesOnly.map(img => ({
      uri: getMediaUrl(img.uri)
    }));
    
    const clickedIndex = imagesOnly.findIndex(img => img.uri === tappedMediaUri);
    
    setViewerImages(formattedImages);
    setCurrentImageIndex(clickedIndex !== -1 ? clickedIndex : 0);
    scale.value = 1; 
    setIsViewerVisible(true);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>

        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.headerTitle}>News Feed</Text>

          <Searchbar
            placeholder="Search announcements..."
            style={styles.searchBar} 
            inputStyle={styles.searchInput} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            iconColor="#1B5E20"
            cursorColor={'#0000008e'}
          />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#1B5E20']} 
              tintColor="#1B5E20" 
            />
          }
        >
          {loading ? (
             <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 50 }} />
          ) : (
            newsItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
              <Card key={item.id || item._id || index} style={styles.newsCard}>
                <Card.Content>
                  <View style={styles.postHeader}>
                    <View style={styles.avatarBorder}>
                      <Avatar.Image
                        size={32}
                        source={require('../../assets/images/newLogo.png')}
                        style={styles.postAvatar}
                      />
                    </View>
                    <View>
                      <Text style={styles.sourceText}>{item.source || 'IBT Management'}</Text>
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
                        {item.attachments.map((media, idx) => (
                          <View key={idx} style={styles.mediaWrapper}>
                            {media.type === 'image' ? (
                              <TouchableOpacity 
                                style={styles.mediaItem} 
                                activeOpacity={0.9} 
                                onPress={() => openImageViewer(item.attachments!, media.uri)}
                              >
                                <RNImage 
                                  source={{ uri: getMediaUrl(media.uri) }} 
                                  style={styles.mediaItem} 
                                  resizeMode="cover" 
                                />
                              </TouchableOpacity>
                            ) : (
                              <FeedVideo videoUri={getMediaUrl(media.uri)} />
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
        
        <Modal visible={isViewerVisible} transparent={true} animationType="fade">
          <View style={styles.modalBackground}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsViewerVisible(false)}>
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>

            <FlatList
              data={viewerImages}
              horizontal
              pagingEnabled
              initialScrollIndex={currentImageIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              keyExtractor={(item, index) => index.toString()}
              onScrollBeginDrag={() => (scale.value = withSpring(1))} 
              renderItem={({ item }) => (
                <GestureDetector gesture={pinchGesture}>
                  <Animated.View style={[styles.imageContainer, animatedStyle]}>
                    <ExpoImage 
                      source={{ uri: item.uri }} 
                      style={styles.fullImage} 
                      contentFit="contain" 
                    />
                  </Animated.View>
                </GestureDetector>
              )}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  feedTitle: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 20, marginTop: 10 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 15, marginBottom: 30, height: 48 },
  searchBar: { backgroundColor: '#F0F4F8', elevation: 0, borderRadius: 12, height: 48 },
  searchInput: { fontSize: 14, alignSelf: 'center', color: 'black' },
  newsCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0', elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarBorder: { borderWidth: 1, borderColor: '#1B5E20', borderRadius: 20, padding: 2, marginRight: 12 },
  postAvatar: { backgroundColor: '#FFF' },
  sourceText: { fontWeight: 'bold', fontSize: 13, color: '#000' },
  dateText: { fontSize: 11, color: '#666', marginTop: 1 },
  postTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  postBody: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 15 },
  headerContainer: { backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  mediaCarouselContainer: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  mediaWrapper: { width: width - 75, height: 200, backgroundColor: '#000', marginRight: 10, borderRadius: 12, overflow: 'hidden' },
  mediaItem: { width: '100%', height: '100%' },
  swipeIndicatorText: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' },
  
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  closeButton: { position: 'absolute', top: 50, right: 25, zIndex: 20 },
  imageContainer: { width, height, justifyContent: 'center' },
  fullImage: { width, height: height * 0.75 },
});