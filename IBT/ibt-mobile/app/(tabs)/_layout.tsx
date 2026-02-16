import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { HapticTab } from '@/src/components/ui/haptic-tab'; 
import { useColorScheme } from '@/src/hooks/use-color-scheme'; 
import { Colors } from '@/src/themes/theme'; 

const CustomCenterButton = ({ children, onPress, buttonColor }: any) => (
  <TouchableOpacity
    style={styles.centerButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.centerButton, { backgroundColor: buttonColor }]}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  const activeTheme = Colors[colorScheme ?? 'dark'];
  
  const centerButtonColor = Colors.light.tint; 

  return (
    <Tabs
       screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, 
      
        tabBarActiveTintColor: activeTheme.tint,    
        tabBarInactiveTintColor: activeTheme.tabIconDefault, 
        
        tabBarStyle: styles.tabBar,
        tabBarButton: HapticTab,
        
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 5, 
        },
      }}
    >
     
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color }) => <Icon name="map-marker-path" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="lost-found"
        options={{
          title: 'Lost & Found',
          tabBarIcon: ({ color }) => <Icon name="bag-personal-outline" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabelStyle: { marginBottom: 5 },
          tabBarButton: (props) => (
            <CustomCenterButton {...props} buttonColor={centerButtonColor}>
              <Icon name="home" size={32} color="white" /> 
            </CustomCenterButton>
          ),
        }}
      />

      <Tabs.Screen
        name="stalls"
        options={{
          title: 'Stalls',
          tabBarIcon: ({ color }) => <Icon name="store-outline" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="account-outline" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="Dashboard" 
        options={{
          href: null,
        }}
      />

    </Tabs>

    
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    backgroundColor: 'white', 
    borderTopColor: '#eee',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 5,
  },
  centerButtonContainer: {
    top: -25, 
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 4,
    borderColor: '#f2f2f2',
  },
});