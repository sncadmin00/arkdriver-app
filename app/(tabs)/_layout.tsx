import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { HomeIcon, LoadsIcon, MapIcon, IncomeIcon, ExpensesIcon } from '@/components/TabIcons';
import { useTranslation } from 'react-i18next';
import supabase from '@/lib/supabase';
import HomeScreen from './home';
import LoadsScreen from './loads';
import MapScreen from './map';
import IncomeScreen from './income';
import ExpensesScreen from './expenses';

const Tab = createBottomTabNavigator();

const icon = (Cmp) => ({ color }) => <Cmp color={color} />;

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (!session) router.replace('/(auth)/login');
      setIsLoading(false);
    });

    // Checking once at startup left a driver stranded when the token expired
    // mid-shift: every screen errored and nothing sent them back to login.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/(auth)/login');
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
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
      <Tab.Screen name="home" component={HomeScreen} options={{ title: t('tabs.home'), tabBarIcon: icon(HomeIcon) }} />
      <Tab.Screen name="loads" component={LoadsScreen} options={{ title: t('tabs.loads'), tabBarIcon: icon(LoadsIcon) }} />
      <Tab.Screen name="map" component={MapScreen} options={{ title: t('tabs.map'), tabBarIcon: icon(MapIcon) }} />
      <Tab.Screen name="income" component={IncomeScreen} options={{ title: t('tabs.income'), tabBarIcon: icon(IncomeIcon) }} />
      <Tab.Screen name="expenses" component={ExpensesScreen} options={{ title: t('tabs.expenses'), tabBarIcon: icon(ExpensesIcon) }} />
    </Tab.Navigator>
  );
}
