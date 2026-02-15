import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Icon.glyphMap;
  color: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card style={styles.card} mode="elevated" elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={30} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="bodyMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="headlineSmall" style={[styles.value, { color }]}>
            {value}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
    width: '100%',
  },
  title: {
    color: '#666666',
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
});