import { useEffect, useRef } from 'react';
import { AppState, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Stack, router as rootRouter } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api';
import supabase from '@/lib/supabase';
import { flush } from '@/lib/incidentQueue';
import { syncRepairs } from '@/lib/repairSync';
import '@/i18n';

/**
 * An incident filed out of signal sits in a local queue. Until now it was only
 * ever sent when the driver happened to reopen the report screen — an accident
 * report could stay on the phone indefinitely. Drain it whenever the app is in
 * front, which is also when the phone is most likely to have found a tower.
 */
function useIncidentQueueDrain() {
  const busy = useRef(false);

  useEffect(() => {
    async function drain() {
      if (busy.current) return;
      busy.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { sent } = await flush();
        if (sent) queryClient.invalidateQueries({ queryKey: ['incidents'] });
        await syncRepairs();
      } catch {
        // Still offline, or the server is unreachable. The queue keeps the
        // report and we try again next time the app comes forward.
      } finally {
        busy.current = false;
      }
    }

    drain();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') drain();
    });
    return () => sub.remove();
  }, []);
}

// Catches any render crash below the root, so drivers never get a black screen.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const { t } = useTranslation();
  console.error('ErrorBoundary', error);
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>{t('crash.title')}</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>{t('crash.body')}</Text>
      <TouchableOpacity onPress={retry} style={{ backgroundColor: '#F59E0B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}>
        <Text style={{ color: '#111', fontWeight: '700' }}>{t('crash.retry')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { rootRouter.replace('/'); retry(); }} style={{ marginTop: 16, padding: 12 }}>
        <Text style={{ color: '#F59E0B', fontWeight: '600' }}>{t('crash.home')}</Text>
      </TouchableOpacity>
      {__DEV__ ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 24 }}>{error.message}</Text> : null}
    </View>
  );
}

export default function RootLayout() {
  useIncidentQueueDrain();

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
