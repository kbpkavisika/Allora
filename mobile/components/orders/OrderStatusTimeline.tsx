import { Text, View } from 'react-native';

import type { OrderTimelineStep } from '@/lib/mockOrders';

export interface OrderStatusTimelineProps {
  timeline: OrderTimelineStep[];
}

type StepState = 'done' | 'current' | 'pending';

function stepState(timeline: OrderTimelineStep[], index: number): StepState {
  const step = timeline[index];
  if (!step.timestamp) {
    return 'pending';
  }
  const next = timeline[index + 1];
  return next && !next.timestamp ? 'current' : 'done';
}

const DOT: Record<StepState, string> = {
  done: 'bg-primary',
  current: 'border-2 border-primary bg-transparent',
  pending: 'border-2 border-border-strong bg-transparent',
};

const LABEL: Record<StepState, string> = {
  done: 'text-primary',
  current: 'text-primary',
  pending: 'text-secondary',
};

export function OrderStatusTimeline({ timeline }: OrderStatusTimelineProps) {
  return (
    <View className="gap-4">
      {timeline.map((step, index) => {
        const state = stepState(timeline, index);

        return (
          <View key={step.status} className="flex-row gap-3">
            <View className={`mt-1 h-[18px] w-[18px] shrink-0 rounded-full ${DOT[state]}`} />
            <View className="flex-1 gap-0.5">
              <Text className={`type-text-primary ${LABEL[state]}`}>{step.label}</Text>
              <Text className="type-text-secondary text-secondary">{step.timestamp ?? 'Not started'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
