import { supabase } from '@/lib/supabase';

export const MESSAGE_MAX_LENGTH = 2000;

export const MESSAGE_PAGE_SIZE = 50;

export const NEW_CONVERSATION_ID = 'new';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  product_id: string | null;
  order_id: string | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  buyer_id: string;
  shop_id: string;
  counterpart_name: string;
  last_message_body: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  unread_count: number;
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
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatConversationTime(iso: string): string {
  const days = daysAgo(iso);

  if (days <= 0) return formatMessageTime(iso);
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMessageDay(iso: string): string {
  const days = daysAgo(iso);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';

  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function conversationPreview(conversation: ConversationSummary, userId: string): string {
  if (!conversation.last_message_body) return 'No messages yet';

  return conversation.last_message_sender_id === userId
    ? `You: ${conversation.last_message_body}`
    : conversation.last_message_body;
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
