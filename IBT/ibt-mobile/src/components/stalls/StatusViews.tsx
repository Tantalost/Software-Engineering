import React, { useState, useEffect } from 'react';
import { ScrollView, View, Modal, Linking, RefreshControl, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider, TextInput } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import styles from '@/src/styles/stallsStyle';
import { colors } from '@/src/themes/stallsColors';
import { getZeroAmountDisplay } from '@/src/utils/currency';

import FileUploadButton from '@/src/components/FileUploadButton';
import API_URL from '@/src/config';

const t = {
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  space: { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 },
  font: { xs: 11, sm: 12, md: 13, base: 14, lg: 15, xl: 16, xxl: 18, title: 22 },
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 6, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  },
};

const palette = {
  warning:  { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', text: '#92400E', badge: '#FEF3C7', badgeText: '#B45309' },
  success:  { bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A', text: '#166534', badge: '#DCFCE7', badgeText: '#15803D' },
  danger:   { bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626', text: '#991B1B', badge: '#FEE2E2', badgeText: '#B91C1C' },
  info:     { bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB', text: '#1E40AF', badge: '#DBEAFE', badgeText: '#1D4ED8' },
  cyan:     { bg: '#ECFEFF', border: '#A5F3FC', icon: '#0891B2', text: '#155E75', badge: '#CFFAFE', badgeText: '#0E7490' },
  neutral:  { bg: '#F8FAFC', border: '#E2E8F0', icon: '#64748B', text: '#334155', badge: '#F1F5F9', badgeText: '#475569' },
  slate:    { bg: '#F1F5F9', border: '#CBD5E1', icon: '#475569', text: '#1E293B', badge: '#E2E8F0', badgeText: '#334155' },
};


const StatusBanner = ({
  icon, title, subtitle, scheme, topAccent = true,
}: {
  icon: string; title: string; subtitle?: string;
  scheme: keyof typeof palette; topAccent?: boolean;
}) => {
  const p = palette[scheme];
  return (
    <View style={[
      uiStyles.statusBanner,
      { backgroundColor: p.bg, borderColor: p.border },
      topAccent && { borderTopWidth: 4, borderTopColor: p.icon },
    ]}>
      <View style={[uiStyles.iconCircle, { backgroundColor: p.badge }]}>
        <Icon name={icon as any} size={32} color={p.icon} />
      </View>
      <Text style={[uiStyles.bannerTitle, { color: p.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[uiStyles.bannerSubtitle, { color: p.icon }]}>{subtitle}</Text>
      )}
    </View>
  );
};

const StatusBadge = ({ label, scheme }: { label: string; scheme: keyof typeof palette }) => {
  const p = palette[scheme];
  return (
    <View style={[uiStyles.badge, { backgroundColor: p.badge, borderColor: p.border }]}>
      <Text style={[uiStyles.badgeText, { color: p.badgeText }]}>{label}</Text>
    </View>
  );
};

const InfoRow = ({
  label, value, valueStyle, labelStyle,
}: {
  label: string; value: string | React.ReactNode;
  valueStyle?: object; labelStyle?: object;
}) => (
  <View style={uiStyles.infoRow}>
    <Text style={[uiStyles.infoLabel, labelStyle]}>{label}</Text>
    {typeof value === 'string'
      ? <Text style={[uiStyles.infoValue, valueStyle]}>{value}</Text>
      : value}
  </View>
);

const AmountRow = ({
  label, amount, color = '#166534', small = false, bold = true,
}: {
  label: string; amount: string; color?: string; small?: boolean; bold?: boolean;
}) => (
  <View style={uiStyles.amountRow}>
    <Text style={{ color, fontSize: small ? t.font.sm : t.font.base, flex: 1 }}>{label}</Text>
    <Text style={{ color, fontSize: small ? t.font.sm : t.font.base, fontWeight: bold ? '700' : '400' }}>
      ₱{amount}
    </Text>
  </View>
);

const SectionCard = ({
  icon, title, iconColor, borderColor, bg, children,
}: {
  icon: string; title: string; iconColor: string;
  borderColor: string; bg: string; children: React.ReactNode;
}) => (
  <View style={[uiStyles.sectionCard, { backgroundColor: bg, borderColor }, t.shadow.sm]}>
    <View style={uiStyles.sectionCardHeader}>
      <Icon name={icon as any} size={20} color={iconColor} />
    <Text style={[uiStyles.sectionCardTitle, { color: iconColor }]}>{title}</Text>
  </View>
    <View style={uiStyles.sectionCardBody}>{children}</View>
  </View>
);

const uiStyles = StyleSheet.create({
  screen: { padding: t.space.base, paddingBottom: 100 },
  centerScreen: { flexGrow: 1, alignItems: 'center', padding: t.space.base, paddingTop: 40, paddingBottom: 60 },

  statusBanner: {
    width: '100%', alignItems: 'center', borderRadius: t.radius.lg,
    borderWidth: 1, padding: t.space.xl, marginBottom: t.space.lg,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: t.space.md,
  },
  bannerTitle: { fontSize: t.font.title, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  bannerSubtitle: { fontSize: t.font.base, textAlign: 'center', marginTop: t.space.xs, fontWeight: '500' },

  badge: {
    paddingHorizontal: t.space.md, paddingVertical: t.space.xs,
    borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: t.space.sm,
  },
  badgeText: { fontSize: t.font.sm, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: t.space.sm },
  infoLabel: { fontSize: t.font.sm, color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  infoValue: { fontSize: t.font.base, color: '#1E293B', fontWeight: '700', textAlign: 'right', flex: 1.5 },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.space.xs },

  sectionCard: { borderRadius: t.radius.md, borderWidth: 1, marginBottom: t.space.base, overflow: 'hidden' },
  sectionCardHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space.base,
    paddingVertical: t.space.md, gap: t.space.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sectionCardTitle: { fontSize: t.font.lg, fontWeight: '700', letterSpacing: 0.2 },
  sectionCardBody: { padding: t.space.base },

  detailCard: {
    backgroundColor: '#FFFFFF', borderRadius: t.radius.md,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: t.space.base,
    overflow: 'hidden',
  },
  detailCardInner: { padding: t.space.base },

  muted: { color: '#64748B', fontSize: t.font.sm, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },

  submitBtn: { borderRadius: t.radius.md, marginTop: t.space.md, paddingVertical: t.space.xs },

  historyItem: {
    backgroundColor: '#FFFFFF', borderRadius: t.radius.md,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: t.space.md,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space.base,
    paddingVertical: t.space.sm, backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: t.space.xs,
  },
  historyBody: { padding: t.space.base },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: t.space.lg },
  modalContainer: {
    backgroundColor: '#FFFFFF', borderRadius: t.radius.xl,
    overflow: 'hidden',
    ...t.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: t.space.sm,
    paddingHorizontal: t.space.xl, paddingTop: t.space.xl, paddingBottom: t.space.base,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalBody: { padding: t.space.xl },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: t.space.sm,
    paddingHorizontal: t.space.xl, paddingBottom: t.space.xl, paddingTop: t.space.sm,
  },

  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.space.xs },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginRight: t.space.sm },

  totalBlock: {
    borderRadius: t.radius.md, paddingVertical: t.space.md,
    paddingHorizontal: t.space.base, marginTop: t.space.sm,
  },
});

export const VerificationPendingView = ({ currentApp, refreshing, onRefresh }: any) => (
  <ScrollView
    contentContainerStyle={uiStyles.centerScreen}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
  >
    <StatusBanner
      icon="timer-sand"
      title="Under Review"
      subtitle="Your documents are being evaluated"
      scheme="warning"
    />

    <View style={[uiStyles.detailCard, { width: '100%' }]}>
      <View style={{ paddingHorizontal: t.space.base, paddingTop: t.space.base }}>
        <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: t.space.sm }}>
          APPLICATION DETAILS
        </Text>
      </View>
      <View style={uiStyles.detailCardInner}>
        <InfoRow label="Applied Slot" value={currentApp.targetSlot} />
        <Divider style={{ marginVertical: t.space.xs }} />
        <InfoRow label="Section / Floor" value={currentApp.floor} />
      </View>
      <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: t.space.base, paddingVertical: t.space.md, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm }}>
          <Icon name="information-outline" size={16} color="#D97706" style={{ marginTop: 2 }} />
          <Text style={{ color: '#92400E', fontSize: t.font.sm, lineHeight: 18, flex: 1 }}>
            Our admin team is currently reviewing your submitted documents. Pull down to refresh for updates.
          </Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

export const ContractReviewView = ({ currentApp, refreshing, onRefresh }: any) => (
  <ScrollView
    contentContainerStyle={uiStyles.centerScreen}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
  >
    <StatusBanner
      icon="file-clock-outline"
      title="Verifying Contract"
      subtitle="Your signed contract is under review"
      scheme="warning"
    />

    <View style={[uiStyles.detailCard, { width: '100%' }]}>
      <View style={{ paddingHorizontal: t.space.base, paddingTop: t.space.base }}>
        <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: t.space.sm }}>
          CONTRACT DETAILS
        </Text>
      </View>
      <View style={uiStyles.detailCardInner}>
        <InfoRow label="Contract Slot" value={currentApp.targetSlot} />
      </View>
      <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: t.space.base, paddingVertical: t.space.md, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm }}>
          <Icon name="information-outline" size={16} color="#D97706" style={{ marginTop: 2 }} />
          <Text style={{ color: '#92400E', fontSize: t.font.sm, lineHeight: 18, flex: 1 }}>
            We are currently reviewing your signed contract. Please wait for the final approval before proceeding.
          </Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

export const ContractPendingView = ({
  currentApp, submitContract, applying, files, uploadProgress, onPickFile, refreshing, onRefresh,
}: any) => (
  <ScrollView
    contentContainerStyle={uiStyles.screen}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
  >
    <StatusBanner
      icon="pen-plus"
      title="Contract Signing"
      subtitle="Upload your signed contract to proceed"
      scheme="info"
    />

    <View style={[uiStyles.sectionCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }, t.shadow.sm]}>
      <View style={[uiStyles.sectionCardHeader, { borderBottomColor: '#F1F5F9' }]}>
        <Icon name="file-upload-outline" size={20} color={colors.primary} />
        <Text style={[uiStyles.sectionCardTitle, { color: colors.primary }]}>Upload Signed PDF</Text>
      </View>
      <View style={uiStyles.sectionCardBody}>
        <Text style={{ color: '#64748B', fontSize: t.font.sm, marginBottom: t.space.base, lineHeight: 18 }}>
          Please upload a clear, signed copy of your contract document in PDF format.
        </Text>
        <FileUploadButton
          label="Signed PDF"
          fileKey="contract"
          files={files}
          uploadProgress={uploadProgress}
          onPickFile={onPickFile}
        />
        <Button
          mode="contained"
          onPress={submitContract}
          loading={applying}
          style={[uiStyles.submitBtn, { backgroundColor: colors.primary }]}
          labelStyle={{ fontWeight: '700', fontSize: t.font.lg, letterSpacing: 0.3 }}
          textColor="#FFFFFF"
        >
          Submit Contract
        </Button>
      </View>
    </View>
  </ScrollView>
);

export const PaymentReviewView = ({ currentApp, refreshing, onRefresh }: any) => (
  <ScrollView
    contentContainerStyle={uiStyles.centerScreen}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
  >
    <StatusBanner
      icon="receipt-clock-outline"
      title="Verifying Payment"
      subtitle="Your receipt is being reviewed"
      scheme="warning"
    />

    <View style={[uiStyles.detailCard, { width: '100%' }]}>
      <View style={{ paddingHorizontal: t.space.base, paddingTop: t.space.base }}>
        <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: t.space.sm }}>
          PAYMENT DETAILS
        </Text>
      </View>
      <View style={uiStyles.detailCardInner}>
        <InfoRow label="Payment for Slot" value={currentApp.targetSlot} />
      </View>
      <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: t.space.base, paddingVertical: t.space.md, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm }}>
          <Icon name="information-outline" size={16} color="#D97706" style={{ marginTop: 2 }} />
          <Text style={{ color: '#92400E', fontSize: t.font.sm, lineHeight: 18, flex: 1 }}>
            The Treasurer is currently verifying your submitted receipt. This process may take a moment.
          </Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

export const PaymentUnlockedView = ({
  currentApp, currentBilling, paymentData, setPaymentData,
  submitPaymentReceipt, applying, files, uploadProgress, onPickFile, refreshing, onRefresh,
}: any) => {
  const PAYMENT_INFO = {
    billerName: 'MUNICIPAL TREASURER',
    project: 'MARKET STALL RENTALS',
  };

  return (
    <ScrollView
      contentContainerStyle={uiStyles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={{
        backgroundColor: colors.primary, borderRadius: t.radius.lg,
        padding: t.space.xl, marginBottom: t.space.base, alignItems: 'center',
        ...t.shadow.md,
      }}>
        <Icon name="file-document-outline" size={36} color="rgba(255,255,255,0.9)" />
        <Text style={{ color: '#FFFFFF', fontSize: t.font.xl, fontWeight: '800', marginTop: t.space.sm, letterSpacing: 0.5, textAlign: 'center' }}>
          ORDER OF PAYMENT
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: t.font.sm, marginTop: t.space.xs, letterSpacing: 1, textTransform: 'uppercase' }}>
          STALL RENTAL
        </Text>
      </View>

      <View style={[uiStyles.detailCard, t.shadow.sm]}>
        <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: t.space.base, paddingVertical: t.space.md, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <Text style={{ fontSize: t.font.xl, fontWeight: '800', color: '#0F172A', letterSpacing: 0.3 }}>{PAYMENT_INFO.billerName}</Text>
          <Text style={{ fontSize: t.font.base, color: '#64748B', marginTop: 2, fontWeight: '500' }}>{PAYMENT_INFO.project}</Text>
        </View>
        <View style={uiStyles.detailCardInner}>
          <InfoRow label="Stall Number" value={currentApp.targetSlot} />
          <Divider style={{ marginVertical: t.space.xs }} />
          <InfoRow
            label="Registered Owner"
            value={<Text style={[uiStyles.infoValue, { textTransform: 'uppercase' }]}>{currentApp.name}</Text>}
          />
          <Divider style={{ marginVertical: t.space.xs }} />
          <InfoRow
            label="Rental Period"
            value={<Text style={[uiStyles.infoValue, { color: colors.primary }]}>{currentBilling.periodLabel}</Text>}
          />
        </View>

        <View style={{ paddingHorizontal: t.space.base, paddingBottom: t.space.base }}>
          <View style={[uiStyles.totalBlock, { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }]}>
            <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: t.space.sm, textAlign: 'center' }}>
              TOTAL AMOUNT DUE — FULL PAYMENT ONLY
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#166534', textAlign: 'center' }}>
              {currentBilling.amountLabel}
            </Text>
            {currentBilling.isPermanent && (
              <Text style={{ fontSize: t.font.xs, color: colors.primary, fontWeight: '600', marginTop: t.space.xs, textAlign: 'center' }}>
                Includes ₱{currentBilling.baseRent.toLocaleString(undefined, { minimumFractionDigits: 2 })} Advance Payment
              </Text>
            )}
            {!currentBilling.isPermanent && (
              <Text style={{ fontSize: t.font.xs, color: colors.primary, fontWeight: '600', marginTop: t.space.xs, textAlign: 'center' }}>
                Base: ₱{currentBilling.dailyRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}/day × {currentBilling.diffDays} day{currentBilling.diffDays === 1 ? '' : 's'}{' '}
                | Weekly after: ₱{(currentBilling.weeklyRent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            )}
            <View style={{ backgroundColor: '#DC2626', borderRadius: 6, paddingVertical: t.space.xs, paddingHorizontal: t.space.sm, marginTop: t.space.sm, alignSelf: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: t.font.xs, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>No Partial Payment</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[uiStyles.sectionCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }, t.shadow.sm]}>
        <View style={[uiStyles.sectionCardHeader, { borderBottomColor: '#F1F5F9' }]}>
          <Icon name="receipt" size={20} color={colors.primary} />
          <Text style={[uiStyles.sectionCardTitle, { color: colors.primary }]}>Payment Verification</Text>
        </View>
        <View style={uiStyles.sectionCardBody}>
          <TextInput
            label="OR / Reference No."
            value={paymentData.referenceNo}
            onChangeText={(t: string) => setPaymentData({ ...paymentData, referenceNo: t })}
            mode="outlined"
            style={[styles.input, { marginBottom: t.space.sm }]}
            activeOutlineColor={colors.primary}
            textColor={colors.black}
          />
          <FileUploadButton
            label="Receipt Photo"
            fileKey="receipt"
            files={files}
            uploadProgress={uploadProgress}
            onPickFile={onPickFile}
          />
          <Button
            mode="contained"
            onPress={submitPaymentReceipt}
            loading={applying}
            icon="check-circle-outline"
            style={[uiStyles.submitBtn, { backgroundColor: colors.primary }]}
            labelStyle={{ fontWeight: '700', fontSize: t.font.lg }}
            textColor="#FFFFFF"
          >
            Submit Payment
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export const RejectedView = ({ currentApp, refreshing, onRefresh }: any) => (
  <ScrollView
    contentContainerStyle={uiStyles.centerScreen}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />}
  >
    <StatusBanner
      icon="close-circle-outline"
      title="Application Rejected"
      subtitle="Your application could not be approved"
      scheme="danger"
    />

    <View style={[uiStyles.detailCard, { width: '100%' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, paddingHorizontal: t.space.base, paddingTop: t.space.base, paddingBottom: t.space.sm }}>
        <Icon name="alert-circle" size={18} color="#DC2626" />
        <Text style={{ fontSize: t.font.sm, fontWeight: '700', color: '#991B1B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Admin Remarks</Text>
      </View>
      <Divider />
      <View style={uiStyles.detailCardInner}>
        <Text style={{ color: '#1E293B', fontSize: t.font.base, lineHeight: 22 }}>
          {currentApp.rejectionReason || 'Your application did not meet the requirements or had incomplete documentation.'}
        </Text>
      </View>
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm, paddingHorizontal: t.space.sm }}>
      <Icon name="information-outline" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
      <Text style={{ color: '#94A3B8', fontSize: t.font.sm, flex: 1, lineHeight: 18 }}>
        You may select a different slot or switch tabs to submit a new application with corrected documents.
      </Text>
    </View>
  </ScrollView>
);

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const TenantView = ({
  currentApp, clearPaymentData, paymentData, setPaymentData,
  submitRenewal, submitRenewalContract, applying, files, uploadProgress,
  onPickFile, refreshing, onRefresh, dynamicChargePct, dynamicInterestPct,
}: any) => {
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const isPermanent = currentApp.floor === 'Permanent' || currentApp.tenantType === 'Permanent';
  const isNightMarket = currentApp.floor === 'Night Market' || currentApp.tenantType === 'Night Market';
  const isPausedForExtendedNonPayment = Boolean(currentApp.isOperationPaused) && (
    String(currentApp.operationPauseReason || '').toUpperCase() === 'NON_PAYMENT_2_MONTHS' ||
    (currentApp.tenantDbStatus === 'Not Started Operations' && Number(currentApp.overdueCycleCount || 0) >= 2)
  );
  const isNightMarketTerminationPause = isNightMarket
    && Boolean(currentApp.isOperationPaused)
    && String(currentApp.tenantDbStatus || '').toUpperCase() !== 'PAYMENT REVIEW'
    && String(currentApp.operationPauseReason || '').toUpperCase() === 'NIGHT_MARKET_NON_PAYMENT';

  const parsedNightMarketTerminationAt = currentApp?.nightMarketTerminationAt
    ? new Date(currentApp.nightMarketTerminationAt) : null;
  const nightMarketTerminationAt = parsedNightMarketTerminationAt && !Number.isNaN(parsedNightMarketTerminationAt.getTime())
    ? parsedNightMarketTerminationAt : null;

  const rawNightMarketDaysLeft = Number(currentApp?.nightMarketTerminationDaysLeft);
  const nightMarketTerminationDaysLeft = Number.isFinite(rawNightMarketDaysLeft)
    ? rawNightMarketDaysLeft
    : (nightMarketTerminationAt
      ? Math.ceil((new Date(nightMarketTerminationAt).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
      : null);

  const isWaitingForStartOperation = currentApp.tenantDbStatus === 'Not Started Operations'
    || (isPermanent && !currentApp.due && !currentApp.operationStartDate);

  const parsedNightMarketOperationStartDeadlineAt = currentApp?.nightMarketOperationStartDeadlineAt
    ? new Date(currentApp.nightMarketOperationStartDeadlineAt) : null;
  const nightMarketOperationStartDeadlineAt = parsedNightMarketOperationStartDeadlineAt
    && !Number.isNaN(parsedNightMarketOperationStartDeadlineAt.getTime())
    ? parsedNightMarketOperationStartDeadlineAt : null;

  const rawNightMarketOperationStartDeadlineDaysLeft = Number(currentApp?.nightMarketOperationStartDeadlineDaysLeft);
  const nightMarketOperationStartDeadlineDaysLeft = Number.isFinite(rawNightMarketOperationStartDeadlineDaysLeft)
    ? rawNightMarketOperationStartDeadlineDaysLeft
    : (nightMarketOperationStartDeadlineAt
      ? Math.ceil((new Date(nightMarketOperationStartDeadlineAt).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
      : null);

  const configuredOperationStartDeadlineDays = Math.max(1, Number(currentApp?.nightMarketOperationStartDeadlineDays) || 3);

  useEffect(() => {
    if (!applying && paymentData?.referenceNo === '') setPaymentModalVisible(false);
  }, [applying, paymentData?.referenceNo]);

  const dueDate = isWaitingForStartOperation
    ? 'Not Started Operations'
    : currentApp.due
    ? new Date(currentApp.due).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not Set';

  const rawRent = Number(currentApp.rentAmount) || 0;
  const rawUtil = Number(currentApp.utilityAmount) || 0;
  const rawTotal = Number(currentApp.totalAmount) || 0;
  const hasPenalties = (rawTotal - rawRent - rawUtil) > 0;
  const isPastDue = currentApp.due && new Date(currentApp.due).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  const isOverdueState = currentApp.tenantDbStatus === 'Overdue'
    || (currentApp.tenantDbStatus === 'Payment Review' && (hasPenalties || isPastDue));
  const isAlertState = isOverdueState || isPausedForExtendedNonPayment;
  const isPaymentSubmissionDisabled = currentApp.tenantDbStatus === 'Payment Review'
    || isWaitingForStartOperation || isPausedForExtendedNonPayment;

  const rentAmount = rawRent.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const utilityAmount = rawUtil.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const totalAmount = rawTotal.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const chargeAmount = currentApp.chargeAmount ? Number(currentApp.chargeAmount) : 0;
  const interestAmount = currentApp.interestAmount ? Number(currentApp.interestAmount) : 0;
  const advanceBalance = currentApp.advancePaymentBalance ? Number(currentApp.advancePaymentBalance) : 0;
  const advanceUsed = currentApp.advanceUsedForPenalties ? Number(currentApp.advanceUsedForPenalties) : 0;
  const feeBreakdown = typeof currentApp.feeBreakdown === 'string'
    ? JSON.parse(currentApp.feeBreakdown || '{}')
    : (currentApp.feeBreakdown || {});

  const electricity = Number(feeBreakdown.electricity || 0);
  const otherAmount = Number(feeBreakdown.otherAmount || 0);
  const otherSpecify = feeBreakdown.otherSpecify || 'Other Fees';

  const handleRenewalSubmit = () => submitRenewal();

  const renewalTemplates = Array.isArray(currentApp?.renewalTemplates) ? currentApp.renewalTemplates : [];
  const renewalContracts = renewalTemplates.filter((template: any) => {
    const contractType = String(template?.contractType || template?.type || '').toUpperCase();
    return contractType === 'RENEWAL';
  });
  const currentContracts = Array.isArray(currentApp?.contracts) ? currentApp.contracts : [];
  const approvedRenewalContract = currentContracts.find((contract: any) => {
    const contractType = String(contract?.contractType || '').toUpperCase();
    const status = String(contract?.status || '').toLowerCase();
    return contractType === 'RENEWAL' && status === 'approved_awaiting_start';
  });
  const hasApprovedRenewalAwaitingStart = Boolean(approvedRenewalContract);
  const parsedApprovedRenewalStartDate = approvedRenewalContract?.startDate
    ? new Date(approvedRenewalContract.startDate) : null;
  const approvedRenewalStartDate = parsedApprovedRenewalStartDate && !Number.isNaN(parsedApprovedRenewalStartDate.getTime())
    ? parsedApprovedRenewalStartDate : null;
  const hasPendingRenewal = Boolean(currentApp?.hasPendingRenewal);
  const hasOpenRenewalRequest = hasPendingRenewal || hasApprovedRenewalAwaitingStart;
  const hasSelectedRenewalContract = renewalContracts.some(
    (template: any) => String(template._id) === selectedTemplateId,
  );
  const parsedContractEndDate = currentApp?.activeContractEndDate
    ? new Date(currentApp.activeContractEndDate) : null;
  const activeContractEndDate = parsedContractEndDate && !Number.isNaN(parsedContractEndDate.getTime())
    ? parsedContractEndDate : null;
  const renewalDaysLeft = activeContractEndDate
    ? Math.ceil((new Date(activeContractEndDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
    : null;
  const isWithinRenewalWindow = renewalDaysLeft !== null && renewalDaysLeft >= 0 && renewalDaysLeft <= 30;
  const isEligibleForRenewal = !hasOpenRenewalRequest && (Boolean(currentApp?.isEligibleForRenewal) || isWithinRenewalWindow);

  const getTemplateDurationLabel = (template: any) => {
    const duration = template?.duration;
    if (typeof duration === 'string' && duration.trim()) return duration;
    if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0)
      return `${duration} month${duration === 1 ? '' : 's'}`;
    if (duration && typeof duration === 'object') {
      const years = Number(duration.years) || 0;
      const months = Number(duration.months) || 0;
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
      if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
      if (parts.length > 0) return parts.join(' ');
    }
    const durationMonths = Number(template?.durationMonths);
    if (Number.isFinite(durationMonths) && durationMonths > 0)
      return `${durationMonths} month${durationMonths === 1 ? '' : 's'}`;
    return 'Duration unavailable';
  };

  const statusScheme: keyof typeof palette = isAlertState ? 'danger' : 'success';
  const statusIcon = isAlertState ? 'alert-circle' : 'check-decagram';
  const statusTitle = isOverdueState
    ? 'Overdue Account'
    : isWaitingForStartOperation
    ? 'Not Started Operations'
    : 'Active Tenant';
  const statusSubtitle = isOverdueState
    ? 'Your account has outstanding penalties'
    : isWaitingForStartOperation
    ? 'Please start operations to activate billing'
    : 'Your stall lease is active';

  const payBtnColor = isPausedForExtendedNonPayment
    ? '#DC2626'
    : currentApp.tenantDbStatus === 'Payment Review' || isWaitingForStartOperation
    ? '#D97706'
    : '#16A34A';

  const payBtnLabel = isPausedForExtendedNonPayment
    ? 'Operations Paused — Settle Balance'
    : isWaitingForStartOperation
    ? 'Operations Not Started'
    : currentApp.tenantDbStatus === 'Payment Review'
    ? 'Payment Under Review'
    : 'Submit Next Payment';

  return (
    <ScrollView
      contentContainerStyle={uiStyles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.success]} />}
    >
      <StatusBanner icon={statusIcon} title={statusTitle} subtitle={statusSubtitle} scheme={statusScheme} />

      <View style={[uiStyles.detailCard, t.shadow.sm]}>
        <View style={{ paddingHorizontal: t.space.base, paddingTop: t.space.base }}>
          <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: t.space.sm }}>
            STALL INFORMATION
          </Text>
        </View>
        <View style={uiStyles.detailCardInner}>
          <InfoRow label="Stall / Slot" value={currentApp.targetSlot} />
          <Divider style={{ marginVertical: t.space.xs }} />
          <InfoRow label="Section / Floor" value={currentApp.floor} />
        </View>
      </View>

      {isPermanent && (isEligibleForRenewal || hasPendingRenewal) && !hasApprovedRenewalAwaitingStart && (
        <SectionCard
          icon="file-document-edit-outline"
          title="Contract Renewal"
          iconColor={colors.primary}
          borderColor={colors.primary}
          bg="transparent"
        >
          {hasPendingRenewal ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm }}>
              <Icon name="clock-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={{ color: colors.primary, fontSize: t.font.base, flex: 1, lineHeight: 20 }}>
                Your renewal contract request is pending admin review. Please wait for approval.
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm, marginBottom: t.space.md }}>
                <Icon name="check-circle-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.primary, fontSize: t.font.base, flex: 1, lineHeight: 20 }}>
                  You are eligible to renew your contract.
                </Text>
              </View>

              {activeContractEndDate && (
                <View style={{ backgroundColor: colors.primary, borderRadius: t.radius.sm, padding: t.space.md, marginBottom: t.space.md }}>
                  <Text style={{ color: '#FFFFFF', fontSize: t.font.sm, fontWeight: '600' }}>
                    Contract ends: {activeContractEndDate.toLocaleDateString()}
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: t.font.sm, marginTop: 2, opacity: 0.9 }}>
                    {renewalDaysLeft} day{renewalDaysLeft === 1 ? '' : 's'} remaining
                  </Text>
                </View>
              )}

              <Text style={{ color: '#0F172A', fontSize: t.font.sm, fontWeight: '700', marginBottom: t.space.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Select Renewal Contract
              </Text>
              {renewalContracts.length === 0 ? (
                <Text style={{ color: '#64748B', fontSize: t.font.sm, marginBottom: t.space.sm }}>
                  No renewal contract available. Please contact the admin office.
                </Text>
              ) : (
                renewalContracts.map((template: any) => {
                  const selected = selectedTemplateId === String(template._id);
                  return (
                    <Button
                      key={String(template._id)}
                      mode={selected ? 'contained' : 'outlined'}
                      onPress={() => setSelectedTemplateId(String(template._id))}
                      style={{
                        marginBottom: t.space.sm, borderColor: colors.primary,
                        backgroundColor: selected ? colors.primary : 'transparent',
                        borderRadius: t.radius.md,
                      }}
                      textColor={selected ? '#FFFFFF' : colors.primary}
                    >
                      {template.name} ({getTemplateDurationLabel(template)})
                    </Button>
                  );
                })
              )}

              <FileUploadButton
                label="Signed Renewal Contract"
                fileKey="contract"
                files={files}
                uploadProgress={uploadProgress}
                onPickFile={onPickFile}
              />
              <Button
                mode={applying ? 'contained' : 'outlined'}
                onPress={() => submitRenewalContract(selectedTemplateId)}
                loading={applying}
                disabled={renewalContracts.length === 0 || !hasSelectedRenewalContract || !files?.contract}
                style={{
                  marginTop: t.space.md, borderColor: colors.primary, borderRadius: t.radius.md,
                  backgroundColor: applying ? colors.primary : 'transparent',
                }}
                textColor={applying ? '#FFFFFF' : colors.primary}
              >
                Submit Renewal Contract
              </Button>
            </>
          )}
        </SectionCard>
      )}

      {isPermanent && hasApprovedRenewalAwaitingStart && (
        <SectionCard
          icon="clock-check-outline"
          title="Renewal Approved"
          iconColor={colors.primary}
          borderColor={colors.primary}
          bg="transparent"
        >
          <Text style={{ color: colors.primary, fontSize: t.font.base, lineHeight: 20, marginBottom: t.space.sm }}>
            Your renewal contract is approved and awaiting activation.
          </Text>
          {approvedRenewalStartDate && (
            <View style={{ backgroundColor: colors.primary, borderRadius: t.radius.sm, padding: t.space.md }}>
              <Text style={{ color: '#FFFFFF', fontSize: t.font.sm, fontWeight: '700' }}>
                Activation Date: {approvedRenewalStartDate.toLocaleDateString()}
              </Text>
            </View>
          )}
        </SectionCard>
      )}

      {isNightMarketTerminationPause && nightMarketTerminationAt && nightMarketTerminationDaysLeft !== null && (
        <SectionCard
          icon="alert-octagon-outline"
          title="Night Market Payment Warning"
          iconColor="#C2410C"
          borderColor="#FDBA74"
          bg="#FFF7ED"
        >
          <Text style={{ color: '#7C2D12', fontSize: t.font.base, lineHeight: 20, marginBottom: t.space.sm }}>
            Operations are currently paused due to unpaid weekly dues.
          </Text>
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: t.radius.sm, padding: t.space.md, marginBottom: t.space.sm }}>
            <Text style={{ color: '#92400E', fontSize: t.font.sm, fontWeight: '700' }}>
              {nightMarketTerminationDaysLeft > 0
                ? `Pay within ${nightMarketTerminationDaysLeft} day${nightMarketTerminationDaysLeft === 1 ? '' : 's'} to avoid termination.`
                : 'Termination is due today if payment remains unsettled.'}
            </Text>
          </View>
          <Text style={{ color: '#9A3412', fontSize: t.font.sm }}>
            Termination Date: {nightMarketTerminationAt.toLocaleDateString()}
          </Text>
        </SectionCard>
      )}

      {isNightMarket && isWaitingForStartOperation && nightMarketOperationStartDeadlineAt && nightMarketOperationStartDeadlineDaysLeft !== null && (
        <SectionCard
          icon="clock-alert-outline"
          title="Start Operations Deadline"
          iconColor="#B45309"
          borderColor="#FCD34D"
          bg="#FFFBEB"
        >
          <Text style={{ color: '#92400E', fontSize: t.font.base, lineHeight: 20, marginBottom: t.space.sm }}>
            You must begin operations within {configuredOperationStartDeadlineDays} day{configuredOperationStartDeadlineDays === 1 ? '' : 's'} of approval.
          </Text>
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: t.radius.sm, padding: t.space.md, marginBottom: t.space.sm }}>
            <Text style={{ color: '#7C2D12', fontSize: t.font.sm, fontWeight: '700' }}>
              {nightMarketOperationStartDeadlineDaysLeft > 0
                ? `Start within ${nightMarketOperationStartDeadlineDaysLeft} day${nightMarketOperationStartDeadlineDaysLeft === 1 ? '' : 's'} to keep your slot.`
                : 'Deadline reached. Start operations immediately to avoid automatic slot release.'}
            </Text>
          </View>
          <Text style={{ color: '#92400E', fontSize: t.font.sm }}>
            Deadline: {nightMarketOperationStartDeadlineAt.toLocaleDateString()}
          </Text>
        </SectionCard>
      )}

      <View style={[uiStyles.detailCard, t.shadow.sm]}>
        <View style={{ paddingHorizontal: t.space.base, paddingTop: t.space.base, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
          <Icon name="calendar-clock" size={20} color={isAlertState ? '#DC2626' : '#166534'} />
          <Text style={{ fontSize: t.font.xs, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            NEXT PAYMENT DUE
          </Text>
        </View>
        <View style={uiStyles.detailCardInner}>
          <Text style={{
            fontSize: 22, fontWeight: '800', letterSpacing: 0.2,
            color: isPausedForExtendedNonPayment ? '#DC2626' : isWaitingForStartOperation ? '#B45309' : '#166534',
          }}>
            {dueDate}
          </Text>

          {isPausedForExtendedNonPayment ? (
            <View style={{ flexDirection: 'row', gap: t.space.xs, marginTop: t.space.sm }}>
              <Icon name="alert-circle-outline" size={14} color="#B91C1C" style={{ marginTop: 2 }} />
              <Text style={{ color: '#B91C1C', fontSize: t.font.sm, flex: 1, lineHeight: 18, fontStyle: 'italic' }}>
                Operations are paused after 2 months of unpaid balance. Please settle immediately.
              </Text>
            </View>
          ) : isWaitingForStartOperation && isNightMarket ? (
            <View style={{ flexDirection: 'row', gap: t.space.xs, marginTop: t.space.sm }}>
              <Icon name="information-outline" size={14} color="#92400E" style={{ marginTop: 2 }} />
              <Text style={{ color: '#92400E', fontSize: t.font.sm, flex: 1, lineHeight: 18, fontStyle: 'italic' }}>
                Billing starts the day after your operation starts.
              </Text>
            </View>
          ) : null}

          <View style={{ backgroundColor: '#F0FDF4', borderRadius: t.radius.md, padding: t.space.md, marginTop: t.space.md }}>
            <AmountRow label="Rent Amount" amount={rentAmount} />

            {isPermanent && (
              <AmountRow
                label="Advance Balance"
                amount={advanceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              />
            )}

            <View>
              <AmountRow label="Additional Fees" amount={utilityAmount} />
              {isPermanent && (
                <View style={{ paddingLeft: t.space.base, marginTop: t.space.xs }}>
                  {electricity > 0 && (
                    <AmountRow label="↳ Electricity" amount={electricity.toLocaleString(undefined, { minimumFractionDigits: 2 })} small />
                  )}
                  {otherAmount > 0 && (
                    <AmountRow label={`↳ ${otherSpecify}`} amount={otherAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} small />
                  )}
                </View>
              )}
            </View>

            {isOverdueState && (
              <View style={{ marginTop: t.space.sm, paddingTop: t.space.sm, borderTopWidth: 1, borderTopColor: '#BBF7D0' }}>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: t.font.sm, marginBottom: t.space.xs }}>
                  Overdue Penalties:
                </Text>
                {(() => {
                  const rawCharge = Number(currentApp.chargeAmount) || 0;
                  const rawInterest = Number(currentApp.interestAmount) || 0;
                  const baseR = Number(currentApp.rentAmount) || 0;
                  const utils = Number(currentApp.utilityAmount) || 0;
                  const totalD = Number(currentApp.totalAmount) || 0;
                  const fallbackPenalty = totalD - baseR - utils;

                  let displayCharge = 0;
                  let displayInterest = 0;
                  let displayCPct = dynamicChargePct;
                  let displayIPct = dynamicInterestPct;
                  let showGeneric = false;

                  if (rawCharge > 0 || rawInterest > 0) {
                    displayCharge = rawCharge;
                    displayInterest = rawInterest;
                    displayCPct = baseR > 0 ? Math.round((rawCharge / baseR) * 100) : dynamicChargePct;
                    const compBase = baseR + rawCharge;
                    displayIPct = compBase > 0 ? Math.round((rawInterest / compBase) * 100) : dynamicInterestPct;
                  } else if (fallbackPenalty > 0) {
                    const expectedC = baseR * (dynamicChargePct / 100);
                    const expectedI = (baseR + expectedC) * (dynamicInterestPct / 100);
                    if (Math.abs((expectedC + expectedI) - fallbackPenalty) < 2) {
                      displayCharge = expectedC;
                      displayInterest = expectedI;
                    } else {
                      let bestMatch: any = null;
                      let highestScore = -1;
                      for (let c = 1; c <= 100; c++) {
                        let testC = baseR * (c / 100);
                        let remP = fallbackPenalty - testC;
                        if (remP <= 0) continue;
                        let testComp = baseR + testC;
                        let testI = (remP / testComp) * 100;
                        if (Math.abs(testI - Math.round(testI)) < 0.05) {
                          let i = Math.round(testI);
                          if (i === 0) continue;
                          let score = 0;
                          if (c % 10 === 0) score += 3;
                          else if (c % 5 === 0) score += 1;
                          if (i % 10 === 0) score += 3;
                          else if (i % 5 === 0) score += 1;
                          if (c >= i) score += 5;
                          if (c >= 10) score += 2;
                          if (score > highestScore) {
                            highestScore = score;
                            bestMatch = { c, i, testC, remP };
                          }
                        }
                      }
                      if (bestMatch) {
                        displayCharge = bestMatch.testC;
                        displayInterest = bestMatch.remP;
                        displayCPct = bestMatch.c;
                        displayIPct = bestMatch.i;
                      } else {
                        showGeneric = true;
                      }
                    }
                  }

                  if (showGeneric && fallbackPenalty > 0) {
                    return (
                      <AmountRow
                        label="↳ Previous Penalties"
                        amount={fallbackPenalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        color="#DC2626"
                        small
                      />
                    );
                  }
                  if (displayCharge > 0 || displayInterest > 0) {
                    return (
                      <>
                        {displayCharge > 0 && (
                          <AmountRow
                            label={`↳ Surcharge (${displayCPct}%)`}
                            amount={displayCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            color="#DC2626" small
                          />
                        )}
                        {displayInterest > 0 && (
                          <AmountRow
                            label={`↳ Interest (${displayIPct}%)`}
                            amount={displayInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            color="#DC2626" small
                          />
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
              </View>
            )}

            <Divider style={{ marginVertical: t.space.sm, backgroundColor: '#BBF7D0' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#166534', fontWeight: '700', fontSize: t.font.base }}>Total Due:</Text>
              <Text style={{ color: '#166534', fontWeight: '800', fontSize: t.font.xxl }}>₱{totalAmount}</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: t.space.md }} />

          <Button
            mode="contained"
            icon="upload"
            onPress={() => { clearPaymentData(); setPaymentModalVisible(true); }}
            style={{ backgroundColor: payBtnColor, borderRadius: t.radius.md }}
            labelStyle={{ color: '#FFFFFF', fontWeight: '700', fontSize: t.font.lg }}
            disabled={isPaymentSubmissionDisabled}
          >
            {payBtnLabel}
          </Button>
        </View>
      </View>

      <SectionCard
        icon="receipt"
        title="Payment Record History"
        iconColor="#166534"
        borderColor="#BBF7D0"
        bg="#F0FDF4"
      >
        {currentApp.paymentHistory && currentApp.paymentHistory.length > 0 ? (
          [...currentApp.paymentHistory]
            .sort((a: any, b: any) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime())
            .map((payment: any, index: number) => {
              const rawReceipt = payment.receiptUrl || payment.receipt || '';
              const isValidReceipt = rawReceipt && rawReceipt.trim() !== '' && rawReceipt !== 'undefined' && rawReceipt !== 'null';
              const specificReceiptUri = isValidReceipt
                ? (rawReceipt.startsWith('http') ? rawReceipt : `${API_URL}/stalls/doc/${rawReceipt}`)
                : null;

              return (
                <View key={index} style={uiStyles.historyItem}>
                  <View style={uiStyles.historyHeader}>
                    <Icon name="calendar-check" size={16} color={colors.success} />
                    <Text style={{ color: '#475569', fontSize: t.font.sm, fontWeight: '600', flex: 1 }}>
                      {new Date(payment.datePaid).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      <Text style={{ color: colors.success, fontStyle: 'italic' }}>
                        {' '}({getTimeAgo(payment.datePaid)})
                      </Text>
                    </Text>
                  </View>
                  <View style={uiStyles.historyBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.sm }}>
                      <Text style={{ color: '#64748B', fontSize: t.font.sm }}>Reference No.</Text>
                      <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: t.font.sm }}>
                        {payment.referenceNo || 'N/A'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.sm }}>
                      <Text style={{ color: '#64748B', fontSize: t.font.sm }}>Amount Paid</Text>
                      <Text style={{ color: '#166534', fontWeight: '800', fontSize: t.font.base }}>
                        ₱{payment.amount
                          ? Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                          : (currentApp.totalAmount
                            ? Number(currentApp.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : getZeroAmountDisplay())}
                      </Text>
                    </View>
                    {specificReceiptUri ? (
                      <Button
                        mode="contained-tonal"
                        icon="file-eye"
                        onPress={() => Linking.openURL(specificReceiptUri)}
                        style={{ backgroundColor: '#DCFCE7', borderRadius: t.radius.sm }}
                        textColor={colors.success}
                        compact
                      >
                        View Receipt
                      </Button>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
                        <Icon name="image-off-outline" size={14} color="#94A3B8" />
                        <Text style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: t.font.sm }}>
                          Receipt image not available
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
        ) : (
          <View style={{ alignItems: 'center', padding: t.space.xl, backgroundColor: '#F8FAFC', borderRadius: t.radius.md }}>
            <Icon name="file-hidden" size={32} color="#CBD5E1" />
            <Text style={{ color: '#94A3B8', fontStyle: 'italic', marginTop: t.space.sm, fontSize: t.font.sm }}>
              No payment records found.
            </Text>
          </View>
        )}
      </SectionCard>

      <Modal
        animationType="fade"
        transparent
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={uiStyles.modalOverlay}>
          <View style={uiStyles.modalContainer}>
          
            <View style={uiStyles.modalHeader}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cash-register" size={22} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.font.xl, fontWeight: '800', color: '#0F172A' }}>Upload Receipt</Text>
                <Text style={{ fontSize: t.font.sm, color: '#64748B', marginTop: 2 }}>Submit your payment proof</Text>
              </View>
              <Button onPress={() => setPaymentModalVisible(false)} textColor="#94A3B8" compact>✕</Button>
            </View>

            <View style={uiStyles.modalBody}>
              <View style={{ backgroundColor: '#F0FDF4', borderRadius: t.radius.md, padding: t.space.md, marginBottom: t.space.base, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                <Icon name="information-outline" size={18} color="#166534" />
                <Text style={{ color: '#166534', fontSize: t.font.sm, flex: 1, lineHeight: 18 }}>
                  Provide the reference number and attach your receipt for the due amount of{' '}
                  <Text style={{ fontWeight: '800' }}>₱{totalAmount}</Text>.
                </Text>
              </View>

              <TextInput
                label="OR / Reference No."
                value={paymentData?.referenceNo || ''}
                onChangeText={(v: string) => setPaymentData({ ...paymentData, referenceNo: v })}
                mode="outlined"
                style={[styles.input, { marginBottom: t.space.base }]}
                activeOutlineColor={colors.success}
                textColor={colors.black}
              />

              <FileUploadButton
                label="Receipt Photo"
                fileKey="receipt"
                files={files}
                uploadProgress={uploadProgress}
                onPickFile={onPickFile}
              />
            </View>

            <View style={uiStyles.modalFooter}>
              <Button onPress={() => setPaymentModalVisible(false)} textColor="#64748B" style={{ borderRadius: t.radius.md }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleRenewalSubmit}
                loading={applying}
                style={{ backgroundColor: colors.success, borderRadius: t.radius.md }}
                textColor="#FFFFFF"
                labelStyle={{ fontWeight: '700' }}
              >
                Send Payment
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export const MovedOutView = ({ currentApp, refreshing, onRefresh }: any) => {
  const moveOutDetails = currentApp.moveOutDetails || {};
  const damageCost = Number(moveOutDetails.damageCost) || 0;
  const damageRemarks = moveOutDetails.damageRemarks || 'None';
  const unpaidDues = Number(moveOutDetails.unpaidDuesDeducted) || 0;
  const lastMonthRent = Number(moveOutDetails.lastMonthRentDeducted) || 0;
  const refund = Number(moveOutDetails.finalRefund) || 0;
  const debt = Number(moveOutDetails.remainingDebt) || 0;
  const advanceBal = Number(currentApp.advancePaymentBalance) || 0;

  return (
    <ScrollView
      contentContainerStyle={uiStyles.centerScreen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#64748b']} />}
    >
      <StatusBanner
        icon="store-remove-outline"
        title="Moved Out"
        subtitle={`Slot ${currentApp.targetSlot.replace(' (Archived)', '')} — Lease Terminated`}
        scheme="neutral"
      />

      <View style={[uiStyles.detailCard, { width: '100%' }, t.shadow.sm]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, paddingHorizontal: t.space.base, paddingTop: t.space.base, paddingBottom: t.space.sm }}>
          <Icon name="file-document-outline" size={18} color="#475569" />
          <Text style={{ fontSize: t.font.sm, fontWeight: '700', color: '#475569', letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Final Settlement Details
          </Text>
        </View>
        <Divider />
        <View style={uiStyles.detailCardInner}>
          <AmountRow
            label="Advance Deposit"
            amount={advanceBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            color="#334155"
          />

          {lastMonthRent > 0 && (
            <AmountRow
              label="Less: Last Month's Rent"
              amount={`- ${lastMonthRent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              color="#4F46E5"
            />
          )}

          {damageCost > 0 && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: t.radius.sm, padding: t.space.md, marginVertical: t.space.sm, borderWidth: 1, borderColor: '#FECACA' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.xs }}>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: t.font.base }}>Less: Damages</Text>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: t.font.base }}>
                  - ₱{damageCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space.xs }}>
                <Icon name="alert-circle-outline" size={13} color="#EF4444" style={{ marginTop: 2 }} />
                <Text style={{ color: '#EF4444', fontSize: t.font.sm, fontStyle: 'italic', flex: 1, lineHeight: 17 }}>
                  Reason: {damageRemarks}
                </Text>
              </View>
            </View>
          )}

          {unpaidDues > 0 && (
            <AmountRow
              label="Less: Unpaid Dues"
              amount={`- ${unpaidDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              color="#EF4444"
            />
          )}

          <Divider style={{ marginVertical: t.space.md, backgroundColor: '#CBD5E1' }} />

          {debt > 0 ? (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: t.radius.md, padding: t.space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.xs }}>
                <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: t.font.xl }}>Remaining Debt</Text>
                <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: t.font.xl }}>
                  ₱{debt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={{ color: '#B91C1C', fontSize: t.font.sm, fontStyle: 'italic', lineHeight: 18 }}>
                You have an outstanding balance. Please visit the admin office to settle your account.
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: t.radius.md, padding: t.space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.xs }}>
                <Text style={{ color: '#10B981', fontWeight: '800', fontSize: t.font.xl }}>Final Refund</Text>
                <Text style={{ color: '#10B981', fontWeight: '800', fontSize: t.font.xl }}>
                  ₱{refund.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
              {lastMonthRent > 0 && (
                <Text style={{ color: '#059669', fontSize: t.font.sm, fontStyle: 'italic', lineHeight: 18 }}>
                  Your advance deposit was applied to cover your last month's rent.
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};