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

const ExpandableText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 150; 

  if (!text) return null;

  if (text.length <= maxLength) {
    return <Text style={styles.postBody}>{text}</Text>;
  }

  return (
    <Text style={styles.postBody}>
      {expanded ? text : `${text.substring(0, maxLength)}... `}
      <Text 
        style={{ color: '#1B5E20', fontWeight: 'bold' }} 
        onPress={() => setExpanded(!expanded)}
      >
        {expanded ? ' Show Less' : 'More..'}
      </Text>
    </Text>
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
          <View style={styles.headerRow}>
            <Text variant="headlineMedium" style={styles.headerTitle}>News Feed</Text>
           
          </View>
          <Searchbar
            placeholder="Search announcements..."
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconColor="#6B7280"
            cursorColor={'#4B5563'}
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1B5E20" />
              <Text style={styles.loadingText}>Loading announcements…</Text>
            </View>
          ) : newsItems.filter(item =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#C8D5C8" />
              <Text style={styles.emptyText}>No announcements found</Text>
              <Text style={styles.emptySubText}>Try a different search keyword</Text>
            </View>
          ) : (
            newsItems
              .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <Card key={item.id || item._id || index} style={styles.newsCard}>
                  <Card.Content style={styles.cardContent}>

                    <View style={styles.postHeader}>
                      <View style={styles.avatarBorder}>
                        <Avatar.Image
                          size={34}
                          source={require('../../assets/images/newLogo.png')}
                          style={styles.postAvatar}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sourceText}>{item.source || 'IBT Management'}</Text>
                        <View style={styles.dateRow}>
                          <Ionicons name="time-outline" size={11} color="#9AA5B4" />
                          <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                      </View>
                      
                    </View>

                    
                    <View style={styles.cardDivider} />

                    <Text style={styles.postTitle}>{item.title}</Text>
                    <ExpandableText text={item.message} />

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
                                  <View style={styles.imageOverlayHint}>
                                    <Ionicons name="expand-outline" size={16} color="#fff" />
                                  </View>
                                </TouchableOpacity>
                              ) : (
                                <FeedVideo videoUri={getMediaUrl(media.uri)} />
                              )}
                            </View>
                          ))}
                        </ScrollView>
                        {item.attachments.length > 1 && (
                          <View style={styles.swipeIndicator}>
                            <Ionicons name="arrow-forward" size={11} color="#1B5E20" />
                            <Text style={styles.swipeIndicatorText}>
                              Swipe for more · {item.attachments.length} media
                            </Text>
                          </View>
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
            <View style={styles.modalTopBar}>
              <Text style={styles.modalCounter}>
                {currentImageIndex + 1} / {viewerImages.length}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsViewerVisible(false)}>
                <View style={styles.closeButtonInner}>
                  <Ionicons name="close" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>

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
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(newIndex);
              }}
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

            <View style={styles.modalDotsRow}>
              {viewerImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.modalDot,
                    i === currentImageIndex && styles.modalDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  searchBar: {
    backgroundColor: '#F0F4F8',
    elevation: 0,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    fontSize: 13,
    alignSelf: 'center',
    color: '#1A2332',
  },

  loadingContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#9AA5B4',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 70,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7A8D',
    marginTop: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#A0AABA',
  },

  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderColor: '#1B5E20',
    borderRadius: 22,
    padding: 2,
  },
  postAvatar: {
    backgroundColor: '#FFF',
  },
  sourceText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1A2332',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#9AA5B4',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: 0.2,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginBottom: 12,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  postBody: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 14,
  },

  mediaCarouselContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaWrapper: {
    width: width - 80,
    height: 210,
    backgroundColor: '#0D1117',
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaItem: {
    width: '100%',
    height: '100%',
  },
  imageOverlayHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    padding: 5,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  swipeIndicatorText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: '600',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  modalTopBar: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalCounter: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeButton: {
    zIndex: 20,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
  },
  fullImage: {
    width,
    height: height * 0.75,
  },
  modalDotsRow: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  modalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  modalDotActive: {
    backgroundColor: '#fff',
    width: 18,
  },

  feedTitle: { fontSize: 28, fontWeight: '900', color: '#000' },
  searchSection: { flexDirection: 'row', alignItems: 'center' },
});