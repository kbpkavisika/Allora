import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDate } from '@/lib/i18n';
import { formatMoney } from '@/lib/orders';
import type { RefundRequest } from '@/services/refund/refundTypes';

export interface OrderRefundSummaryProps {
  refund: RefundRequest;
  viewer?: 'buyer' | 'seller';
  children?: React.ReactNode;
}

export function getRefundStatusPresentation(status: RefundRequest['status']): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'refunded':
      return { label: 'Refund Completed', variant: 'success' };
    case 'failed':
      return { label: 'Refund Failed', variant: 'warning' };
    case 'requested':
      return { label: 'Refund Requested', variant: 'neutral' };
    case 'processing':
    default:
      return { label: 'Refund Processing', variant: 'neutral' };
  }
}

export function OrderRefundSummary({
  refund,
  viewer = 'seller',
  children,
}: OrderRefundSummaryProps) {
  const { t } = useTranslation();
  const presentation = getRefundStatusPresentation(refund.status);
  const dateObj = new Date(refund.createdAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? formatDate(dateObj, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : refund.createdAt;

  return (
    <View className="gap-4">
      <SectionHeader title={t('refund.sectionTitle', { defaultValue: 'Refund information' })} />

      <View
        accessibilityRole="summary"
        aria-label={`${t('refund.sectionTitle', { defaultValue: 'Refund information' })}, ${presentation.label}, ${formatMoney(refund.refundAmount)}`}
        className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.reference', { defaultValue: 'Refund Reference' })}
          </Text>
          <Text className="type-mono text-primary font-bold" maxFontSizeMultiplier={2}>
            {refund.id}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.status', { defaultValue: 'Refund Status' })}
          </Text>
          <Badge label={presentation.label} variant={presentation.variant} />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.amount', { defaultValue: 'Refund Amount' })}
          </Text>
          <Text className="type-h3 text-primary" maxFontSizeMultiplier={2}>
            {formatMoney(refund.refundAmount)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.type', { defaultValue: 'Refund Type' })}
          </Text>
          <Text className="type-text-primary text-primary capitalize" maxFontSizeMultiplier={2}>
            {refund.refundType === 'partial'
              ? t('refund.partial', { defaultValue: 'Partial' })
              : t('refund.full', { defaultValue: 'Full' })}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.reason', { defaultValue: 'Refund Reason' })}
          </Text>
          <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
            {refund.reasonLabel}
          </Text>
        </View>

        {refund.reasonDetails ? (
          <View className="gap-0.5">
            <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
              {t('refund.details', { defaultValue: 'Reason Details' })}
            </Text>
            <Text className="type-text-secondary text-primary" maxFontSizeMultiplier={2}>
              {refund.reasonDetails}
            </Text>
          </View>
        ) : null}

        {refund.paymentReference ? (
          <View className="flex-row items-center justify-between">
            <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
              {t('refund.paymentRef', { defaultValue: 'Original Payment Ref' })}
            </Text>
            <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
              {refund.paymentReference}
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
            {t('refund.requestedOn', { defaultValue: 'Requested On' })}
          </Text>
          <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
            {formattedDate}
          </Text>
        </View>

        {children}
      </View>
    </View>
  );
}
