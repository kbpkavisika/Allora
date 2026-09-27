import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountBadge } from '@/components/ui/CountBadge';
import { Icon, type IconName } from '@/components/ui/Icon';
import { BorderWidth, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TabDefinition {
  label: string;
  icon: IconName;
}

export interface BottomTabBarComponentProps extends BottomTabBarProps {
  tabs: Record<string, TabDefinition>;
  badges?: Record<string, number>;
}

export function BottomTabBar({
  state,
  navigation,
  tabs,
  badges = {},
}: BottomTabBarComponentProps) {
  const insets = useSafeAreaInsets();
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const activeColor = useThemeColor({}, 'primary');
  const inactiveColor = useThemeColor({}, 'secondary');

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        { backgroundColor: surface, borderTopColor: border, paddingBottom: insets.bottom },
      ]}>
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const { label, icon } = tab;
        const focused = state.index === index;
        const color = focused ? activeColor : inactiveColor;
        const badge = badges[route.name] ?? 0;

        return (
          <PlatformPressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge > 0 ? `${label}, ${badge} unread` : label}
            style={styles.tab}
            onPress={() => navigation.navigate(route.name)}
            onPressIn={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}>
            <View>
              <Icon name={icon} size="lg" style={{ color }} />
              <CountBadge count={badge} className="absolute -right-[5px] -top-[3px]" />
            </View>
            <Text
              style={[
                styles.label,
                { color, fontFamily: focused ? Fonts.archivo.bold : Fonts.archivo.medium },
              ]}>
              {label}
            </Text>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: BorderWidth.DEFAULT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 56,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
