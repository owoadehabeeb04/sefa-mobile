import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Toast } from '@/src/components/common/Toast';
import {
  useAssistantChatSearch,
  useAssistantChats,
} from '@/features/assistant/assistant.hooks';
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';

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
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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

export default function AssistantIndexScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ seed?: string }>();
  const { requireVerification } = useSensitiveActionSecurity();

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [verified, setVerified] = useState(false);
  const handledSeedRef = useRef<string | null>(null);

  const { data: chatList, isLoading, refetch } = useAssistantChats({ includeArchived: true });
  const searchResults = useAssistantChatSearch(search);

  useEffect(() => {
    let isMounted = true;
    requireVerification('assistant_history').then((allowed) => {
      if (!isMounted) return;
      if (!allowed) { router.back(); return; }
      setVerified(true);
    });
    return () => { isMounted = false; };
  }, [requireVerification, router]);

  useEffect(() => {
    const seed = typeof params.seed === 'string' ? params.seed.trim() : '';
    if (!verified || !seed || handledSeedRef.current === seed) return;
    handledSeedRef.current = seed;
    router.replace({ pathname: '/assistant/new', params: { seed } } as any);
  }, [params.seed, router, verified]);

  const chats = useMemo(() => chatList?.chats || [], [chatList?.chats]);
  const searchedChats = useMemo(() => searchResults.data || [], [searchResults.data]);
  const isSearching = search.trim().length > 1;

  const listItems = useMemo((): ListItem[] => {
    const source = isSearching ? searchedChats : chats;
    if (!source.length) return [];

    if (isSearching) {
      return source.map((chat) => ({ type: 'chat', chat } as ListItem));
    }

    const groups: Record<string, Chat[]> = {};
    for (const chat of source) {
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
  const handleCreateChat = () => router.push('/assistant/new' as any);

  const handleArchive = (chatId: string) => {
    Alert.alert('Chat options', 'Open the chat to archive it or manage its messages.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open chat', onPress: () => openChat(chatId) },
    ]);
  };

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
            fontSize: 12,
            fontWeight: '600',
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 6,
            letterSpacing: 0.3,
          }}
        >
          {item.label}
        </Text>
      );
    }

    const { chat } = item;
    const isGenerating = chat.status === 'generating' && !chat.archivedAt;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openChat(chat.id)}
        onLongPress={() => handleArchive(chat.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
        }}
      >
        {isGenerating ? (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: colors.primary,
              marginRight: 10,
            }}
          />
        ) : null}

        <Text
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            fontWeight: '400',
          }}
          numberOfLines={1}
        >
          {chat.title}
        </Text>

        <Text style={{ color: colors.textTertiary, fontSize: 13, marginLeft: 10 }}>
          {formatRelativeDate(chat.lastMessageAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const isEmpty = !isLoading && listItems.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '700' }}>
          SEFA
        </Text>
        <TouchableOpacity onPress={handleCreateChat} style={{ padding: 4 }}>
          <Ionicons name="create-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 12,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, color: colors.text, fontSize: 15, padding: 0 }}
        />
        {searchResults.isLoading ? (
          <ActivityIndicator size="small" color={colors.textTertiary} />
        ) : search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="chatbubble-outline" size={36} color={colors.textTertiary} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            {isSearching ? 'No matching chats' : 'No chats yet'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            {isSearching
              ? 'Try a different phrase. SEFA searches inside message text too.'
              : 'Start a conversation and SEFA will keep your history ready.'}
          </Text>
          {!isSearching && (
            <TouchableOpacity
              onPress={handleCreateChat}
              style={{
                marginTop: 20,
                paddingHorizontal: 20,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.textInverse, fontSize: 14, fontWeight: '600' }}>
                Start a chat
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.label}` : `chat-${item.chat.id}-${index}`
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 0, marginHorizontal: 16, backgroundColor: 'transparent' }} />
          )}
          onRefresh={() => refetch()}
          refreshing={false}
        />
      )}
    </SafeAreaView>
  );
}
