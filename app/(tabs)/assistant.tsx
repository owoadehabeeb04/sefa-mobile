import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import {
  useAssistantChatSearch,
  useAssistantChats,
} from '@/features/assistant/assistant.hooks';
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';

const SUGGESTED_PROMPTS = [
  'How am I spending this month?',
  'Where can I cut back?',
  'Am I on track with my budget?',
  "What's my biggest expense?",
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatRelativeDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

const getDateGroup = (value?: string | null): string => {
  if (!value) return 'Older';
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 8) return 'Previous 7 Days';
  if (diffDays < 31) return 'This Month';
  return 'Older';
};

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'This Month', 'Older'];

type Chat = {
  id: string;
  title: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  status: string;
  archivedAt?: string | null;
  matchingMessageSnippet?: string | null;
};

type ListItem =
  | { type: 'header'; label: string }
  | { type: 'chat'; chat: Chat };

export default function AssistantTabScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuthStore();
  const { requireVerification } = useSensitiveActionSecurity();

  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState(false);
  const handledRef = useRef(false);

  const { data: chatList, isLoading, refetch } = useAssistantChats({ includeArchived: false });
  const searchResults = useAssistantChatSearch(search);

  useEffect(() => {
    let isMounted = true;
    requireVerification('assistant_history').then((allowed) => {
      if (!isMounted) return;
      if (allowed) setVerified(true);
    });
    return () => { isMounted = false; };
  }, [requireVerification]);

  const chats = useMemo(() => chatList?.chats || [], [chatList?.chats]);
  const isSearching = search.trim().length > 1;
  const searchedChats = useMemo(() => searchResults.data || [], [searchResults.data]);

  const listItems = useMemo((): ListItem[] => {
    const source = isSearching ? searchedChats : chats;
    if (!source.length) return [];

    if (isSearching) {
      return source.map((chat) => ({ type: 'chat', chat } as ListItem));
    }

    const groups: Record<string, Chat[]> = {};
    for (const chat of source) {
      if (chat.archivedAt || chat.status === 'archived') continue;
      const label = getDateGroup(chat.lastMessageAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(chat);
    }

    const items: ListItem[] = [];
    for (const label of GROUP_ORDER) {
      if (!groups[label]?.length) continue;
      items.push({ type: 'header', label });
      for (const chat of groups[label]) {
        items.push({ type: 'chat', chat });
      }
    }
    return items;
  }, [chats, isSearching, searchedChats]);

  const openChat = (chatId: string) => router.push(`/assistant/${chatId}` as any);

  const startNewChat = (seedText?: string) => {
    if (seedText) {
      router.push({ pathname: '/assistant/new', params: { seed: seedText } } as any);
    } else {
      router.push('/assistant/new' as any);
    }
  };

  const handleArchive = (chatId: string) => {
    Alert.alert('Chat options', 'Open the chat to archive it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open chat', onPress: () => openChat(chatId) },
    ]);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (!verified) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 6,
          }}
        >
          {item.label}
        </Text>
      );
    }

    const { chat } = item;
    const isGenerating = chat.status === 'generating';

    return (
      <TouchableOpacity
        activeOpacity={0.65}
        onPress={() => openChat(chat.id)}
        onLongPress={() => handleArchive(chat.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ color: colors.text, fontSize: 15, fontWeight: '400' }}
            numberOfLines={1}
          >
            {chat.title}
          </Text>
          {chat.lastMessage ? (
            <Text
              style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }}
              numberOfLines={1}
            >
              {chat.lastMessage}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
            {formatRelativeDate(chat.lastMessageAt)}
          </Text>
          {isGenerating ? (
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const hasChats = listItems.length > 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>SEFA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* 
          <TouchableOpacity onPress={() => router.push('/assistant' as any)} style={{ padding: 4 }}>
            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity> */} 

          <TouchableOpacity
            onPress={() => startNewChat()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : hasChats ? (
        <>
          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 20,
              marginTop: 10,
              marginBottom: 4,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Ionicons name="search" size={15} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search conversations"
              placeholderTextColor={colors.textTertiary}
              style={{ flex: 1, color: colors.text, fontSize: 14, padding: 0 }}
            />
            {searchResults.isLoading ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={listItems}
            keyExtractor={(item, index) =>
              item.type === 'header' ? `h-${item.label}` : `c-${item.chat.id}-${index}`
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onRefresh={() => refetch()}
            refreshing={false}
            ListEmptyComponent={
              isSearching ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    No conversations match "{search}"
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      ) : (
        /* Empty state */
        <View style={{ flex: 1 }}>
          {/* Decorative background blobs */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -40,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: `${colors.primary}08`,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 80,
              left: -80,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: `${colors.primary}06`,
            }}
          />

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            {/* Icon */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primaryBackground,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 22,
                borderWidth: 1,
                borderColor: `${colors.primary}20`,
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={30} color={colors.primary} />
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 26,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {getGreeting()}, {firstName}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 260,
                marginBottom: 32,
              }}
            >
              Ask me anything about your spending, budgets, or savings.
            </Text>

            {/* Suggested prompts — horizontal scroll */}
            <View style={{ width: '100%' }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingVertical: 2 }}
              >
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    onPress={() => startNewChat(prompt)}
                    activeOpacity={0.72}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundSecondary,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontWeight: '500',
                      }}
                    >
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* New chat button */}
            <TouchableOpacity
              onPress={() => startNewChat()}
              activeOpacity={0.85}
              style={{
                marginTop: 28,
                width: '100%',
                paddingVertical: 15,
                borderRadius: 16,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>New Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
