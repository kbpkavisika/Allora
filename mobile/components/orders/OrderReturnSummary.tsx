import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDate } from '@/lib/i18n';
import { returnReasonLabel, returnStatusPresentation, type OrderReturn } from '@/lib/orders';

export interface OrderReturnSummaryProps {
  orderReturn: OrderReturn;
  viewer: 'buyer' | 'seller';
  children?: React.ReactNode;
}

export function OrderReturnSummary({ orderReturn, viewer, children }: OrderReturnSummaryProps) {
  const { t } = useTranslation();
  const presentation = returnStatusPresentation(orderReturn.status);
  const date = formatDate(orderReturn.created_at, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="gap-4">
      <SectionHeader title={t('returns.title')} />

      <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
        <Badge label={presentation.label} variant={presentation.variant} />

        <View className="gap-1">
          <Text className="type-label-lg text-primary">
            {t('returns.reasonLine', { reason: returnReasonLabel(orderReturn.reason) })}
          </Text>
          {orderReturn.details ? (
            <Text className="type-text-primary text-primary">{orderReturn.details}</Text>
          ) : null}
          <Text className="type-text-secondary text-secondary">
            {t('returns.requestedOn', { date })}
          </Text>
        </View>

        {orderReturn.seller_note ? (
          <View className="gap-1 border-t-1 border-border pt-3">
            <Text className="type-label text-secondary">{t('returns.sellerNote')}</Text>
            <Text className="type-text-primary text-primary">{orderReturn.seller_note}</Text>
          </View>
        ) : null}

        {viewer === 'buyer' ? (
          <Text className="type-text-secondary text-secondary">
            {t(`returns.buyerNext.${orderReturn.status}`)}
          </Text>
        ) : null}

        {children}
      </View>
    </View>
  );
}
