import { Tabs } from 'expo-router';
import React from 'react';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import TopBar from '@/components/TopBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarActiveBackgroundColor: "#ffffff",
        headerShown: false,
        tabBarButton: HapticTab,
        header: () => TopBar()
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name={"cube-scan"} color={color} />
        }}
      />
      <Tabs.Screen 
        name="solve"
        options={{
          title: 'Solve',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name={"cube"} color={color} />
        }}
      />
    </Tabs>
  );
}
