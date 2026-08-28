import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import supabase from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import HomeScreen from './home';
import LoadsScreen from './loads';
import ChatScreen from './chat';
import ComplianceScreen from './compliance';
import MoreScreen from './more';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/login');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return null;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#F59E0B', tabBarInactiveTintColor: '#6B7280', tabBarStyle: { backgroundColor: '#1F2937', borderTopColor: '#374151' } }}>
      <Tab.Screen name="home" component={HomeScreen} options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tab.Screen name="loads" component={LoadsScreen} options={{ title: t('tabs.loads'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text> }} />
      <Tab.Screen name="chat" component={ChatScreen} options={{ title: t('tabs.chat'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text> }} />
      <Tab.Screen name="compliance" component={ComplianceScreen} options={{ title: t('tabs.compliance'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text> }} />
      <Tab.Screen name="more" component={MoreScreen} options={{ title: t('tabs.more'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⋯</Text> }} />
    </Tab.Navigator>
  );
}
