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


const REQUIREMENTS = [
  { id: 1, label: 'Detailed list of products to be sold', icon: 'format-list-bulleted' },
  { id: 2, label: 'Business Permit', icon: 'briefcase-outline' },
  { id: 3, label: 'Government Issued Valid ID', icon: 'card-account-details-outline' },
  { id: 4, label: 'Barangay Clearance', icon: 'file-certificate-outline' },
  { id: 5, label: 'Signed Contract (Permanent Slot Application Only)', icon: 'pen' },
];

const CONTACT_ITEMS = [
  { icon: 'map-marker-outline', label: 'Address', value: '2nd Floor, Departure Building, ZC-IBT, Divisoria' },
  { icon: 'phone-outline', label: 'Phone', value: '(062) 955-7806 / (062) 975-2320' },
  { icon: 'email-outline', label: 'Email', value: 'zambocityibt@gmail.com' },
];

export default function GuidelinesModal({ visible, onDismiss }: Props) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'contractual' | 'nightMarket' | null>(null);

  const baseStyle = { color: '#4A5568', fontSize: 13, lineHeight: 21 };
  const tagsStyles = {
    h3: { color: colors.primary, fontSize: 15, fontWeight: '700' as const, marginTop: 16, marginBottom: 6 },
    p: { marginVertical: 4, color: '#4A5568' },
    ul: { marginTop: 4, marginBottom: 10, paddingLeft: 18 },
    li: { marginBottom: 6, color: '#4A5568' },
    strong: { color: '#1A2332' },
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Icon name="book-open-variant" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Application Guidelines</Text>
            <Text style={styles.headerSubtitle}>ZC-IBT Stall Management</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeIconBtn}>
            <Icon name="close" size={18} color="#5A6472" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Policy Accordion ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>OPERATIONS & MANAGEMENT POLICIES</Text>
            <Text style={styles.sectionHint}>Tap a policy card to expand its details</Text>

            <View style={styles.accordionGroup}>
              {/* Contractual */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.accordionBtn,
                  activeTab === 'contractual' && styles.accordionBtnActive,
                ]}
                onPress={() => setActiveTab(activeTab === 'contractual' ? null : 'contractual')}
              >
                <View style={[
                  styles.accordionIconWrap,
                  activeTab === 'contractual' && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}>
                  <Icon
                    name="file-sign"
                    size={18}
                    color={activeTab === 'contractual' ? '#fff' : colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.accordionTitle, activeTab === 'contractual' && { color: '#fff' }]}>
                    Contractual Concessionaires
                  </Text>
                  <Text style={[styles.accordionSub, activeTab === 'contractual' && { color: 'rgba(255,255,255,0.75)' }]}>
                    Lease terms, payments & penalties
                  </Text>
                </View>
                <Icon
                  name={activeTab === 'contractual' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={activeTab === 'contractual' ? '#fff' : '#8A95A3'}
                />
              </TouchableOpacity>

              {activeTab === 'contractual' && (
                <View style={styles.htmlContainer}>
                  <RenderHtml
                    contentWidth={width - 80}
                    source={{ html: contractualHTML }}
                    baseStyle={baseStyle}
                    tagsStyles={tagsStyles}
                  />
                </View>
              )}

              {/* Night Market */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.accordionBtn,
                  activeTab === 'nightMarket' && styles.accordionBtnActive,
                ]}
                onPress={() => setActiveTab(activeTab === 'nightMarket' ? null : 'nightMarket')}
              >
                <View style={[
                  styles.accordionIconWrap,
                  activeTab === 'nightMarket' && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}>
                  <Icon
                    name="weather-night"
                    size={18}
                    color={activeTab === 'nightMarket' ? '#fff' : colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.accordionTitle, activeTab === 'nightMarket' && { color: '#fff' }]}>
                    Night Market Operations
                  </Text>
                  <Text style={[styles.accordionSub, activeTab === 'nightMarket' && { color: 'rgba(255,255,255,0.75)' }]}>
                    Vendor rules, safety & conduct
                  </Text>
                </View>
                <Icon
                  name={activeTab === 'nightMarket' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={activeTab === 'nightMarket' ? '#fff' : '#8A95A3'}
                />
              </TouchableOpacity>

              {activeTab === 'nightMarket' && (
                <View style={styles.htmlContainer}>
                  <RenderHtml
                    contentWidth={width - 80}
                    source={{ html: nightMarketHTML }}
                    baseStyle={baseStyle}
                    tagsStyles={tagsStyles}
                  />
                </View>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* ── Requirements Checklist ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>REQUIREMENTS CHECKLIST</Text>
            <Text style={styles.sectionHint}>To be accomplished by the registered owner</Text>

            <View style={styles.checklistGroup}>
              {REQUIREMENTS.map((req) => (
                <View key={req.id} style={styles.checklistItem}>
                  <View style={styles.checklistBadge}>
                    <Icon name={req.icon as any} size={15} color={colors.primary} />
                  </View>
                  <Text style={styles.checklistText}>{req.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* ── Warning Box ── */}
          <View style={styles.warningBox}>
            <View style={styles.warningHeader}>
              <Icon name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.warningTitle}>IMPORTANT NOTICE</Text>
            </View>
            <Text style={styles.warningBody}>
              NO CERTIFICATION FROM ZC-IBT, NO PROCESSING OF MAYOR'S / BUSINESS PERMIT.
            </Text>
            <Text style={styles.warningNote}>
              Please process your request at ZC-IBT before going to the Business Process and Licensing Office at City Hall.
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* ── Contact Section ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>CONTACT & INQUIRIES</Text>

            <View style={styles.contactGroup}>
              {CONTACT_ITEMS.map((item) => (
                <View key={item.label} style={styles.contactRow}>
                  <View style={styles.contactIconWrap}>
                    <Icon name={item.icon as any} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>{item.label}</Text>
                    <Text style={styles.contactValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Close Button ── */}
          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.closeBtn}
            buttonColor={colors.primary}
            textColor="white"
            icon="check-circle-outline"
            contentStyle={{ paddingVertical: 4 }}
            labelStyle={{ fontWeight: '700', letterSpacing: 0.4, fontSize: 14 }}
          >
            Done
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 16,
    maxHeight: '88%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F5',
    backgroundColor: '#FAFBFD',
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8A95A3',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll content */
  content: {
    padding: 18,
    paddingBottom: 28,
  },

  /* Section blocks */
  sectionBlock: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A95A3',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: 12,
    color: '#A0AABA',
    marginBottom: 14,
    fontStyle: 'italic',
  },

  /* Accordion */
  accordionGroup: {
    gap: 10,
  },
  accordionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  accordionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accordionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2332',
  },
  accordionSub: {
    fontSize: 11,
    color: '#8A95A3',
    marginTop: 2,
  },
  htmlContainer: {
    backgroundColor: '#F9FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },

  /* Checklist */
  checklistGroup: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    gap: 12,
  },
  checklistBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistText: {
    flex: 1,
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '500',
    lineHeight: 18,
  },

  /* Warning */
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    padding: 16,
    marginBottom: 4,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  warningBody: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 19,
    marginBottom: 6,
  },
  warningNote: {
    fontSize: 11,
    color: '#B91C1C',
    lineHeight: 17,
    opacity: 0.85,
  },

  /* Contact */
  contactGroup: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    gap: 12,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A95A3',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '500',
    lineHeight: 18,
  },

  divider: {
    marginVertical: 18,
    backgroundColor: '#EDF0F5',
    height: 1,
  },

  /* Close button */
  closeBtn: {
    marginTop: 8,
    borderRadius: 12,
  },
});