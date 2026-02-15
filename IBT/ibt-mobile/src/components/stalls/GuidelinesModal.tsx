import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, Divider } from 'react-native-paper';
import { colors } from '@/src/themes/stallsColors'; 
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function GuidelinesModal({ visible, onDismiss }: Props) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={[styles.headerTitle, { color: colors.black }]}>Application Guidelines</Text>
          <Icon name="information" size={24} color={colors.primary} />
        </View>
        
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Requirements Checklist</Text>
          <Text style={[styles.subText, { color: colors.primaryLight }]}>To be accomplished by the registered owner:</Text>
          
          <View style={styles.listItem}>
            <Text style={[styles.bullet, {color: colors.black }]}>1.</Text>
            <Text style={[styles.listText, {color: colors.black}]}>Detailed list of products to be sold. </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={[styles.bullet, {color: colors.black }]}>2.</Text>
            <Text style={[styles.listText, {color: colors.black}]}>Business Permit </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={[styles.bullet, {color: colors.black }]}>3.</Text>
            <Text style={[styles.listText, {color: colors.black}]}>Government Issued Valid ID</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={[styles.bullet, {color: colors.black }]}>4.</Text>
            <Text style={[styles.listText, {color: colors.black}]}>Barangay Clearance </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={[styles.bullet, {color: colors.black }]}>5.</Text>
            <Text style={[styles.listText, {color: colors.black}]}>Signed Contract (Permanent Slot Application Only) </Text>
          </View>
          
          <Divider style={styles.divider} />

          <View style={styles.warningBox}>
            <Icon name="alert-circle" size={20} color={colors.error} style={{marginBottom: 5}}/>
            <Text style={[styles.warningText, {fontWeight: 'bold'}]}>IMPORTANT NOTICE:</Text>
            <Text style={styles.warningText}>
              NO CERTIFICATION FROM ZC-IBT, NO PROCESSING OF MAYOR'S / BUSINESS PERMIT.
            </Text>
            <Text style={[styles.warningText, {marginTop: 5, fontSize: 11}]}>
              Please process your request at ZC-IBT before going to the Business Process and Licensing Office at City Hall.
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>Contact & Inquiries</Text>
          <Text style={styles.contactText}>
            <Text style={[{fontWeight: 'bold'}, {color: colors.black}]}>Address:</Text> 2nd Floor, Departure Building, ZC-IBT, Divisoria.
          </Text>
          <Text style={styles.contactText}>
             <Text style={[{fontWeight: 'bold'}, {color: colors.black}]}>Phone:</Text> (062) 955-7806 / (062) 975-2320.
          </Text>
           <Text style={styles.contactText}>
             <Text style={[{fontWeight: 'bold'}, {color: colors.black}]}>Email:</Text> zambocityibt@gmail.com.
          </Text>

          <Button mode="contained" onPress={onDismiss} style={styles.closeBtn} buttonColor={colors.primary} textColor='white'>
            Close Guidelines
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subText: {
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 10,
  },
  bullet: {
    fontWeight: 'medium',
    marginRight: 8,
    color: colors.primary,
  },
  listText: {
    flex: 1,
    color: '#444',
  },
  divider: {
    marginVertical: 15,
  },
  warningBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 12,
  },
  contactText: {
    marginBottom: 5,
    color: '#444',
    fontSize: 13,
  },
  closeBtn: {
    marginTop: 20,
  }
});