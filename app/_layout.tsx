import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
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
