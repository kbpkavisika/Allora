import { Text, View } from 'react-native';

import { Checkbox } from '@/components/ui/Checkbox';

export interface PreferenceRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function PreferenceRow({ title, description, checked, onChange }: PreferenceRowProps) {
  return (
    <View className="flex-row items-start gap-3 rounded-12 bg-surface-muted p-4">
      <Checkbox checked={checked} onChange={onChange} label={title} className="mt-0.5" />
      <View className="flex-1 gap-0.5">
        <Text className="type-label-lg text-primary">{title}</Text>
        <Text className="type-text-secondary text-secondary">{description}</Text>
      </View>
    </View>
  );
}
