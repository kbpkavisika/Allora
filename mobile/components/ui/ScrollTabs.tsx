import { Pressable, ScrollView, Text } from 'react-native';

export interface ScrollTabItem {
  value: string;
  label: string;
  count?: number;
}

export interface ScrollTabsProps {
  tabs: readonly ScrollTabItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ScrollTabs({
  tabs,
  value,
  onChange,
  label = 'Sections',
  className = '',
}: ScrollTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      aria-label={label}
      className={`max-h-control-lg grow-0 border-b-1 border-border bg-surface ${className}`}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}>
      {tabs.map((tab) => {
        const selected = tab.value === value;

        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            accessibilityRole="tab"
            aria-selected={selected}
            aria-label={tab.count === undefined ? tab.label : `${tab.label}, ${tab.count}`}
            className={`h-12 justify-center border-b-3 ${
              selected ? 'border-accent' : 'border-transparent'
            }`}>
            <Text
              className={selected ? 'type-title text-primary' : 'type-title-muted text-secondary'}
              numberOfLines={1}
              maxFontSizeMultiplier={1.5}>
              {tab.count === undefined ? tab.label : `${tab.label} · ${tab.count}`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
