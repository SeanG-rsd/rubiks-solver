import { Tabs } from 'expo-router';
import React from 'react';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import TopBar from '@/components/TopBar';

const AMBER = "#C49A00";
const BG = "#0D0D0D";
const TAB_BAR_BG = "#141414";
const INACTIVE = "rgba(255,255,255,0.30)";
const ACTIVE_INDICATOR = "rgba(196,154,0,0.15)";
const BORDER = "rgba(196,154,0,0.18)";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: INACTIVE,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        headerShown: false,
        tabBarButton: HapticTab,
        header: () => TopBar(),
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'SCAN',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={26} name={"cube-scan"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="solve"
        options={{
          title: 'SOLVE',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={26} name={"cube"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}