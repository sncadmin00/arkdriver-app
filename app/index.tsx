import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import supabase from '@/lib/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F14', justifyContent: 'center' }}>
        <ActivityIndicator color="#F59E0B" />
      </View>
    );
  }

  return <Redirect href={signedIn ? '/(tabs)/home' : '/(auth)/login'} />;
}
