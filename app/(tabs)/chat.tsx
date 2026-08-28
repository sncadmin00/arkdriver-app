import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChatMessages, sendChatMessage, markChatRead, fetchLoads } from '@/lib/api';
import supabase from '@/lib/supabase';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  chips: { flexDirection: 'row', marginTop: 12 },
  chip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  chipOn: { backgroundColor: '#F59E0B' },
  chipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  chipOnText: { color: '#0B0F14' },
  list: { padding: 16, paddingBottom: 8 },
  row: { marginBottom: 12, maxWidth: '82%' },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bMine: { backgroundColor: '#F59E0B', borderBottomRightRadius: 4 },
  bTheirs: { backgroundColor: '#1F2937', borderBottomLeftRadius: 4, borderColor: '#374151', borderWidth: 1 },
  tMine: { color: '#0B0F14', fontSize: 15, lineHeight: 21 },
  tTheirs: { color: '#E5E7EB', fontSize: 15, lineHeight: 21 },
  sender: { color: '#6B7280', fontSize: 11, marginBottom: 4, marginLeft: 4, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginHorizontal: 4 },
  time: { color: '#6B7280', fontSize: 10 },
  tag: { backgroundColor: '#374151', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  tagText: { color: '#9CA3AF', fontSize: 9, fontWeight: '700' },
  system: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginVertical: 10, fontStyle: 'italic' },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 60 },
  bar: { flexDirection: 'row', padding: 12, backgroundColor: '#1F2937', borderTopColor: '#374151', borderTopWidth: 1, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#0B0F14', borderColor: '#374151', borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFFFFF', fontSize: 15, maxHeight: 110 },
  send: { backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11, marginLeft: 8 },
  sendOff: { backgroundColor: '#374151' },
  sendText: { color: '#0B0F14', fontWeight: '700', fontSize: 14 },
  err: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginBottom: 6 },
});

function clock(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [loadRef, setLoadRef] = useState<string | undefined>();
  const scroller = useRef<ScrollView>(null);

  const { data: loads } = useQuery({ queryKey: ['loads'], queryFn: () => fetchLoads() });
  const { data, isLoading, error } = useQuery({
    queryKey: ['chat', loadRef ?? 'all'],
    queryFn: () => fetchChatMessages(loadRef ? { loadRef } : undefined),
  });

  const threadId = data?.threadId;
  const messages = [...(data?.messages ?? [])].reverse();

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase
      .channel(`driver_messages:${threadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_messages', filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ['chat'] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => {
    const newest = data?.messages?.[0];
    if (newest?.created_at) markChatRead(newest.created_at).catch(() => {});
  }, [data?.messages?.[0]?.id]);

  const send = useMutation({
    mutationFn: () => sendChatMessage({
      body: text.trim(),
      loadRef,
      clientKey: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  const ready = text.trim().length > 0 && !send.isPending;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <View style={s.header}>
          <Text style={s.title}>Dispatch</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
            <TouchableOpacity style={[s.chip, !loadRef && s.chipOn]} onPress={() => setLoadRef(undefined)}>
              <Text style={[s.chipText, !loadRef && s.chipOnText]}>All</Text>
            </TouchableOpacity>
            {(loads ?? []).map((l: any) => (
              <TouchableOpacity
                key={l.id}
                style={[s.chip, loadRef === l.id && s.chipOn]}
                onPress={() => setLoadRef(l.id)}
              >
                <Text style={[s.chipText, loadRef === l.id && s.chipOnText]}>{l.id}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scroller}
          style={s.container}
          contentContainerStyle={s.list}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          {isLoading && <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />}
          {error && <Text style={s.err}>{(error as Error).message}</Text>}
          {!isLoading && !messages.length && (
            <Text style={s.empty}>No messages yet</Text>
          )}

          {messages.map((m: any) => {
            if (m.sender === 'system') {
              return <Text key={m.id} style={s.system}>{m.body}</Text>;
            }
            const mine = m.sender === 'driver';
            return (
              <View key={m.id} style={[s.row, mine ? s.mine : s.theirs]}>
                {!mine && <Text style={s.sender}>{m.sender_name ?? 'Dispatch'}</Text>}
                <View style={[s.bubble, mine ? s.bMine : s.bTheirs]}>
                  <Text style={mine ? s.tMine : s.tTheirs}>
                    {m.deleted_at ? 'Message deleted' : m.body}
                  </Text>
                </View>
                <View style={[s.meta, mine && { justifyContent: 'flex-end' }]}>
                  <Text style={s.time}>{clock(m.created_at)}</Text>
                  {m.load_ref && (
                    <View style={s.tag}><Text style={s.tagText}>{m.load_ref}</Text></View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {send.error && <Text style={s.err}>{(send.error as Error).message}</Text>}

        <View style={s.bar}>
          <TextInput
            style={s.input}
            placeholder={loadRef ? `About ${loadRef}...` : 'Message dispatch...'}
            placeholderTextColor="#6B7280"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={[s.send, !ready && s.sendOff]} disabled={!ready} onPress={() => send.mutate()}>
            <Text style={s.sendText}>{send.isPending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
