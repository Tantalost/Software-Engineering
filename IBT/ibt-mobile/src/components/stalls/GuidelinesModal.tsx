import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Modal, Portal, Text, Button, Divider } from 'react-native-paper';
import { colors } from '@/src/themes/stallsColors'; 
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import RenderHtml from 'react-native-render-html';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

const contractualHTML = `
  <h3>1. Lease Terms and Duration</h3>
  <ul>
    <li><strong>Contract Length:</strong> Lease agreements are valid for a maximum of two (2) years, renewable for another period not exceeding two years.</li>
    <li><strong>Approval Process:</strong> Rental fees are recommended on a per-square-meter basis and must be approved by the Sangguniang Panlungsod.</li>
    <li><strong>Types of Spaces:</strong> Includes eateries, gift shops, ticketing booths, office spaces, and other designated rentable areas.</li>
  </ul>
  
  <h3>2. Payment and Financial Obligations</h3>
  <ul>
    <li><strong>Due Date:</strong> Rent must be paid within the first five (5) calendar days of each month.</li>
    <li><strong>Late Penalties:</strong> A 25% surcharge is applied for payments made after the 5th of the month. An additional 2% monthly interest is charged on unpaid rentals and surcharges.</li>
    <li><strong>Default:</strong> Failing to pay for two (2) consecutive months is grounds for contract termination and may result in a lien on the tenant's property.</li>
  </ul>
  
  <h3>3. Strict Prohibitions</h3>
  <p>To maintain order, tenants are strictly prohibited from:</p>
  <ul>
    <li><strong>Unauthorized Changes:</strong> You cannot build structures or display signs/advertisements without prior official consent.</li>
    <li><strong>Subleasing:</strong> Subcontracting or assigning the lease to another party is forbidden without written permission.</li>
    <li><strong>Residential Use:</strong> Using the space for dwelling or sleeping is prohibited.</li>
    <li><strong>Disturbances:</strong> Using videoke/karaoke machines or making unreasonable noise is not allowed.</li>
    <li><strong>Illegal Acts:</strong> Gambling, hazardous materials (explosives/flammables), and "immoral transactions" (e.g., prostitution) are strictly banned.</li>
    <li><strong>Space Usage:</strong> You cannot use sidewalks or pathways as extensions of your business area.</li>
  </ul>
  
  <h3>4. Maintenance and Waste Management</h3>
  <ul>
    <li><strong>Waste Disposal:</strong> Tenants are responsible for segregating their trash (boxes, bottles, etc.) and placing it in provided bins.</li>
    <li><strong>City Support:</strong> The City provides 24-hour security and utility personnel to clean the general surroundings, with daily garbage collection.</li>
  </ul>
  
  <h3>5. Termination and Penalties</h3>
  <ul>
    <li><strong>Termination:</strong> The City can end the contract if the tenant violates the ordinance, fails to pay for two months, or engages in prohibited acts. Tenants must vacate immediately upon notice.</li>
    <li><strong>Fines:</strong> Administrative Fines: range from P300 to P1,000 depending on the frequency of the offense. Criminal Penalties: Serious violations can lead to a fine of up to P5,000 and/or imprisonment of 6 months to 1 year.</li>
  </ul>
`;

const nightMarketHTML = `
  <h3>1. Vendor Admissions & Space Allocation</h3>
  <p>To ensure fairness and variety, the following rules apply to stall assignments:</p>
  <ul>
    <li><strong>Permit Primacy:</strong> No vendor shall set up without a validated Business Permit from the City Treasurer's Office.</li>
    <li><strong>Designated Zoning:</strong> Vendors must stay strictly within their painted demarcation lines.</li>
    <li><strong>Penalty:</strong> P1,000 for encroachment or operating in unassigned areas.</li>
    <li><strong>Product Consistency:</strong> Vendors may only sell the items listed on their application. Switching from "Clothing" to "Street Food" without Committee approval is prohibited.</li>
    <li><strong>Non-Transferability:</strong> Sub-leasing or "selling" your slot to another person is grounds for permanent blacklisting.</li>
  </ul>
  
  <h3>2. Standardized "Clean & Green" Protocol</h3>
  <p>Building on Article VII of your ordinance, every stall must follow this setup:</p>
  <ul>
    <li><strong>The 3-Bin System:</strong> Every stall must have three clearly labeled bins:
      <ol>
        <li>Biodegradable (Food scraps, paper).</li>
        <li>Non-Biodegradable (Plastics, cans).</li>
        <li>Liquid Waste: A sealed, labeled container for oils or wash-water (No pouring in street gutters!).</li>
      </ol>
    </li>
    <li><strong>Daily Clean-out:</strong> Vendors must "sweep-out" their 1-meter radius before leaving. The City/Barangay will collect the segregated bags at the end of the shift.</li>
  </ul>
  
  <h3>3. Public Safety & Electrical Code</h3>
  <p>Since night markets rely on lighting, safety is the priority:</p>
  <ul>
    <li><strong>Emergency Lighting:</strong> Every vendor must have a charged emergency LED lamp or battery-operated light. Use of candles or open-flame torches for lighting is strictly prohibited.</li>
    <li><strong>Electrical Load:</strong> No "octopus connections." All high-wattage appliances (fryers, coolers) must be declared during application to prevent circuit overloads.</li>
    <li><strong>Hazardous Materials:</strong> No storage of excess LPG tanks or flammable chemicals inside the stall area.</li>
  </ul>
  
  <h3>4. Code of Conduct & "Night Market Ethics"</h3>
  <ul>
    <li><strong>Prohibited Goods:</strong> Absolute zero-tolerance for: Alcoholic beverages (consumption or sale), Cigarettes and Vaping products, Military/Police tactical gear and uniforms.</li>
    <li><strong>Staffing:</strong> All stall attendants must wear a City-issued ID and maintain a "Customer First" attitude.</li>
    <li><strong>Noise Control:</strong> While music is allowed, it must not interfere with the business of neighboring stalls.</li>
  </ul>
  
 <h3>5. Enforcement & Fines Matrix</h3>
  
  <div style="margin-bottom: 12px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left-width: 4px; border-left-color: #d32f2f; border-left-style: solid; border-width: 1px; border-color: #e0e0e0; border-style: solid;">
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Category:</strong> Legal</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Violation:</strong> No Permit</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Immediate Action:</strong> Immediate Closure</p>
    <p style="margin-top: 0; margin-bottom: 0; color: #d32f2f;"><strong>Fine:</strong> P5,000</p>
  </div>

  <div style="margin-bottom: 12px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left-width: 4px; border-left-color: #f57c00; border-left-style: solid; border-width: 1px; border-color: #e0e0e0; border-style: solid;">
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Category:</strong> Sanitation</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Violation:</strong> Improper Setup/Disposal</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Immediate Action:</strong> Verbal Warning + Cleanup</p>
    <p style="margin-top: 0; margin-bottom: 0; color: #d32f2f;"><strong>Fine:</strong> P1,000</p>
  </div>

  <div style="margin-bottom: 12px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left-width: 4px; border-left-color: #fbc02d; border-left-style: solid; border-width: 1px; border-color: #e0e0e0; border-style: solid;">
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Category:</strong> Safety</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Violation:</strong> No Emergency Lamp</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Immediate Action:</strong> Purchase requirement</p>
    <p style="margin-top: 0; margin-bottom: 0; color: #d32f2f;"><strong>Fine:</strong> P1,000</p>
  </div>

  <div style="margin-bottom: 12px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left-width: 4px; border-left-color: #1976d2; border-left-style: solid; border-width: 1px; border-color: #e0e0e0; border-style: solid;">
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Category:</strong> Conduct</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Violation:</strong> Public Disorder / Vandalism</p>
    <p style="margin-top: 0; margin-bottom: 4px;"><strong style="color: #555;">Immediate Action:</strong> Removal from premises</p>
    <p style="margin-top: 0; margin-bottom: 0; color: #d32f2f;"><strong>Fine:</strong> P1,000 + Damages</p>
  </div>
`;


export default function GuidelinesModal({ visible, onDismiss }: Props) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'contractual' | 'nightMarket' | null>(null);

  // Styles injected into the HTML renderer to make it match the app
  const baseStyle = { color: '#444', fontSize: 13, lineHeight: 20 };
  const tagsStyles = {
    h3: { color: colors.primary, fontSize: 16, marginTop: 15, marginBottom: 5 },
    p: { marginVertical: 5 },
    ul: { marginTop: 5, marginBottom: 10, paddingLeft: 20 },
    li: { marginBottom: 5 },
    table: { marginTop: 10, fontSize: 12 },
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={[styles.headerTitle, { color: colors.black }]}>Application Guidelines</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Icon name="close" size={24} color={colors.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={styles.content}>
          
          <Text variant="titleMedium" style={styles.sectionTitle}>Operations & Management Policies</Text>
          <Text style={[styles.subText, { color: colors.primaryLight }]}>Select a policy below to view details:</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'contractual' && styles.activeTab]} 
              onPress={() => setActiveTab(activeTab === 'contractual' ? null : 'contractual')}
            >
              <Icon name="file-document-outline" size={20} color={activeTab === 'contractual' ? 'white' : colors.primary} />
              <Text style={[styles.tabText, activeTab === 'contractual' && {color: 'white'}]}>Contractual Concessionaires</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'nightMarket' && styles.activeTab]} 
              onPress={() => setActiveTab(activeTab === 'nightMarket' ? null : 'nightMarket')}
            >
              <Icon name="file-document-outline" size={20} color={activeTab === 'nightMarket' ? 'white' : colors.primary} />
              <Text style={[styles.tabText, activeTab === 'nightMarket' && {color: 'white'}]}>Night Market Operations</Text>
            </TouchableOpacity>
          </View>

          {activeTab && (
            <View style={styles.htmlContainer}>
              <RenderHtml
                contentWidth={width - 80}
                source={{ html: activeTab === 'contractual' ? contractualHTML : nightMarketHTML }}
                baseStyle={baseStyle}
                tagsStyles={tagsStyles}
              />
            </View>
          )}
          
          <Divider style={styles.divider} />

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
    maxHeight: '85%', 
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
  tabContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 5,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    marginLeft: 10,
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
    flexShrink: 1,
  },
  htmlContainer: {
    backgroundColor: '#fafafa',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    fontWeight: '500', 
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