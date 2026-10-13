import { uploadToCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import i18n, { formatDate, formatTime } from '@/lib/i18n';

export const MESSAGE_MAX_LENGTH = 2000;

export const VOICE_NOTE_MAX_MS = 120_000;

export const MESSAGE_PAGE_SIZE = 50;

export const NEW_CONVERSATION_ID = 'new';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  product_id: string | null;
  order_id: string | null;
  audio_url: string | null;
  audio_duration_ms: number | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  buyer_id: string;
  shop_id: string;
  counterpart_name: string | null;
  last_message_body: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  muted: boolean;
  counterpart_last_read_at: string | null;
  last_message_is_voice: boolean;
}

export function formatVoiceDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function uploadVoiceNote(uri: string): Promise<string> {
  return uploadToCloudinary(uri, 'video');
}

export function conversationName(conversation: ConversationSummary): string {
  return conversation.counterpart_name ?? i18n.t('account.seller.buyer');
}

export function isSeenByCounterpart(conversation: ConversationSummary, message: Message): boolean {
  return (
    !!conversation.counterpart_last_read_at &&
    Date.parse(conversation.counterpart_last_read_at) >= Date.parse(message.created_at)
  );
}

export interface MessageEvent {
  conversation_id: string;
  message_id: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysAgo(iso: string): number {
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS);
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

export function formatMessageTime(iso: string): string {
  return formatTime(iso, { hour: 'numeric', minute: '2-digit' });
}

export function formatConversationTime(iso: string): string {
  const days = daysAgo(iso);

  if (days <= 0) return formatMessageTime(iso);
  if (days === 1) return i18n.t('chat.yesterday');
  if (days < 7) return formatDate(iso, { weekday: 'short' });

  return formatDate(iso, { month: 'short', day: 'numeric' });
}

export function formatMessageDay(iso: string): string {
  const days = daysAgo(iso);

  if (days <= 0) return i18n.t('chat.today');
  if (days === 1) return i18n.t('chat.yesterday');

  return formatDate(iso, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function conversationPreview(conversation: ConversationSummary, userId: string): string {
  const body =
    conversation.last_message_body ||
    (conversation.last_message_is_voice ? i18n.t('chat.voiceMessage') : null);

  if (!body) return i18n.t('chat.noMessagesYet');

  return conversation.last_message_sender_id === userId
    ? i18n.t('chat.youPrefix', { body })
    : body;
}

export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));

  return [...byId.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function fetchProductNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const { data } = await supabase.from('products').select('id, name').in('id', ids);

  return Object.fromEntries((data ?? []).map((product) => [product.id, product.name]));
}
