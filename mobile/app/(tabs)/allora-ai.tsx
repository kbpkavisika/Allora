import { FunctionsHttpError } from '@supabase/supabase-js';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { TopBar } from '@/components/ui/TopBar';
import { useCart } from '@/lib/CartProvider';
import { formatPrice } from '@/lib/products';
import type { Product } from '@/lib/products';
import { messageSchema, shoppingResponseSchema, type MessageValues } from '@/lib/schemas';
import { applyShoppingAction, invokeShoppingAssistant, readShoppingFailure } from '@/lib/shoppingAssistant';
import { supabase } from '@/lib/supabase';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function ShoppingAssistantScreen() {
  const { t } = useTranslation();
  const { addItem, isLoading: isCartLoading } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const retryAt = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const { control, handleSubmit, reset } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema), defaultValues: { body: '' },
  });

  const submit = () => handleSubmit(async ({ body }) => {
    if (pending.current || isCartLoading) return;
    if (Date.now() < retryAt.current) {
      setError(t('assistant.rateLimitWait', { seconds: Math.ceil((retryAt.current - Date.now()) / 1000) }));
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    const next: ChatMessage[] = [...messages, { role: 'user', content: body }];
    setMessages(next);
    reset();
    try {
      const { data, error: invokeError } = await invokeShoppingAssistant(supabase, {
        messages: next.slice(-12).map(({ role, content }) => ({ role, content })), productIds: products.map((product) => product.id),
      });
      if (invokeError) {
        if (invokeError instanceof FunctionsHttpError && invokeError.context.status === 409) {
          setProducts([]);
        }
        const failure = invokeError instanceof FunctionsHttpError
          ? await readShoppingFailure(invokeError.context)
          : null;
        const status = invokeError instanceof FunctionsHttpError ? invokeError.context.status : undefined;
        if (status === 429 || status === 502 || status === 503 || status === 504) {
          const seconds = typeof failure?.retryAfter === 'number' && Number.isFinite(failure.retryAfter)
            ? Math.min(300, Math.max(1, failure.retryAfter)) : 30;
          retryAt.current = Date.now() + seconds * 1000;
        }
        console.warn(JSON.stringify({ event: 'shopping_assistant_failed', status, code: failure?.code ?? invokeError.name, requestId: failure?.requestId, gatewayRequestId: failure?.gatewayRequestId }));
        throw new Error(status === 401 ? t('assistant.signInAgain') : failure?.error ?? t('assistant.unavailable'));
      }
      if (data?.error) throw new Error(data.error);
      const parsed = shoppingResponseSchema.parse(data);
      const added = await applyShoppingAction(parsed.action, products, addItem);
      let reply = parsed.action.message;
      if (added) {
        reply = t('assistant.added', { count: parsed.action.quantity, name: added.name });
      } else if (parsed.action.type === 'search') {
        setProducts(parsed.products);
        reply = parsed.products.length
          ? t('assistant.results')
          : t('assistant.noResults');
      }
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : t('assistant.failed');
      setError(message);
      setMessages(messages);
      reset({ body });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  })();

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={t('assistant.title')} showBack={false} trailing={
        <IconButton icon={<Icon name="cart" size="lg" className="text-primary" />} label={t('tabs.cart')} onPress={() => router.push('/(tabs)/cart')} />
      } />
      <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map((message, index) => (
          <MessageBubble key={index} body={message.content} time="" isMine={message.role === 'user'} senderLabel={message.role === 'user' ? t('assistant.you') : t('assistant.title')} />
        ))}
        {products.map((product, index) => (
          <Button key={product.id} variant="secondary" label={(index + 1) + '. ' + product.name} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })} />
        ))}
        {busy && <Text className="type-text-primary text-secondary" accessibilityLiveRegion="polite">{t('assistant.thinking')}</Text>}
      </ScrollView>
      <View className="gap-3 border-t-1 border-border px-4 pt-3" style={{ paddingBottom: 16 }}>
        {error && <Text role="alert" className="type-text-primary text-error" maxFontSizeMultiplier={2}>{error}</Text>}
        <Controller control={control} name="body" render={({ field, fieldState }) => (
          <InputField ref={inputRef} label={t('assistant.command')} isLabelHidden placeholder={t('assistant.command')} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} isDisabled={busy || isCartLoading} isMicVisible={false} returnKeyType="send" submitBehavior="submit" onSubmitEditing={submit} />
        )} />
        <Button label={t('composer.send')} loading={busy} disabled={isCartLoading} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}
