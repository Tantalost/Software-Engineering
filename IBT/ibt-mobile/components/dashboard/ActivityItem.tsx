import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: keyof typeof Icon.glyphMap;
  iconColor: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  description,
  time,
  icon,
  iconColor,
}) => {
  return (
    <List.Item
      title={title}
      description={description}
      left={(props) => (
        <List.Icon
          {...props}
          icon={() => <Icon name={icon} size={24} color={iconColor} />}
        />
      )}
      right={() => (
        <Text variant="bodySmall" style={styles.time}>
          {time}
        </Text>
      )}
      titleStyle={styles.title}
      descriptionStyle={styles.description}
      style={styles.item}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  time: {
    color: '#999999',
    fontSize: 11,
  },
});