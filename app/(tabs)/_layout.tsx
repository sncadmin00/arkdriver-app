import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import supabase from '@/lib/supabase';
import HomeScreen from './home';
import LoadsScreen from './loads';
import MapScreen from './map';
import IncomeScreen from './income';
import ExpensesScreen from './expenses';

const Tab = createBottomTabNavigator();

const icon = (glyph) => ({ color }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace('/(auth)/login');
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return null;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { backgroundColor: '#1F2937', borderTopColor: '#374151' },
      }}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ title: t('tabs.home'), tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="loads" component={LoadsScreen} options={{ title: t('tabs.loads'), tabBarIcon: icon('📦') }} />
      <Tab.Screen name="map" component={MapScreen} options={{ title: t('tabs.map'), tabBarIcon: icon('🗺️') }} />
      <Tab.Screen name="income" component={IncomeScreen} options={{ title: t('tabs.income'), tabBarIcon: icon('💰') }} />
      <Tab.Screen name="expenses" component={ExpensesScreen} options={{ title: t('tabs.expenses'), tabBarIcon: icon('💸') }} />
    </Tab.Navigator>
  );
}
