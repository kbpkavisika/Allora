import { FunctionsHttpError } from '@supabase/supabase-js';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { TopBar } from '@/components/ui/TopBar';
import { useDictation } from '@/hooks/useDictation';
import { MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { useCart } from '@/lib/CartProvider';
import { formatPrice } from '@/lib/products';
import type { Product } from '@/lib/products';
import { messageSchema, shoppingResponseSchema, type MessageValues } from '@/lib/schemas';
import { applyShoppingAction, invokeShoppingAssistant, readShoppingFailure } from '@/lib/shoppingAssistant';
import { supabase } from '@/lib/supabase';

type ChatMessage = { role: 'user' | 'assistant'; content: string; products?: Product[] };

export default function ShoppingAssistantScreen() {
  const { t } = useTranslation();
  const { addItem, isLoading: isCartLoading } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const retryAt = useRef(0);
  const cooldownReason = useRef('');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const { control, handleSubmit, reset, setValue } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema), defaultValues: { body: '' },
  });

  const body = useWatch({ control, name: 'body' });
  const { dictate, isDictating, hint, feedback } = useDictation({
    inputRef,
    value: body,
    onChangeText: (body) => setValue('body', body, { shouldDirty: true, shouldValidate: true }),
    maxLength: MESSAGE_MAX_LENGTH,
    isDisabled: busy || isCartLoading,
  });

  const submit = () => handleSubmit(async ({ body }) => {
    if (pending.current || isCartLoading || isDictating) return;
    if (Date.now() < retryAt.current) {
      setError(cooldownReason.current + ' ' + t('assistant.retryIn', { seconds: Math.ceil((retryAt.current - Date.now()) / 1000) }));
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
        console.warn(JSON.stringify({ event: 'shopping_assistant_failed', status, code: failure?.code ?? invokeError.name, requestId: failure?.requestId, gatewayRequestId: failure?.gatewayRequestId }));
        const reason = status === 401 ? t('assistant.signInAgain') : failure?.error ?? t('assistant.unavailable');
        const isModelGlitch = failure?.code === 'provider_generation_failed' || failure?.code === 'invalid_provider_response';
        if (!isModelGlitch && (status === 429 || status === 502 || status === 503 || status === 504)) {
          const seconds = typeof failure?.retryAfter === 'number' && Number.isFinite(failure.retryAfter)
            ? Math.min(300, Math.max(1, failure.retryAfter)) : 30;
          retryAt.current = Date.now() + seconds * 1000;
          cooldownReason.current = reason;
          throw new Error(reason + ' ' + t('assistant.retryIn', { seconds }));
        }
        throw new Error(reason);
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
      setMessages([...next, { role: 'assistant', content: reply, ...(parsed.action.type === 'search' ? { products: parsed.products } : {}) }]);
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

  const addProduct = async (product: Product) => {
    if (pending.current || isCartLoading) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await applyShoppingAction({ type: 'add', productId: product.id, quantity: 1, message: '' }, [product], addItem);
      setMessages([...messages,
        { role: 'user', content: t('assistant.addSelected', { name: product.name }) },
        { role: 'assistant', content: t('assistant.added', { count: 1, name: product.name }) },
      ]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('product.addError'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={t('assistant.title')} showBack={false} trailing={
        <IconButton icon={<Icon name="cart" size="lg" className="text-primary" />} label={t('tabs.cart')} onPress={() => router.push('/(tabs)/cart')} />
      } />
      <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map((message, messageIndex) => (
          <View key={messageIndex} className="gap-3">
            <MessageBubble body={message.content} time="" isMine={message.role === 'user'} senderLabel={message.role === 'user' ? t('assistant.you') : t('assistant.title')} />
            {message.products?.map((product, index) => (
              <View key={product.id} className="gap-3 rounded-12 border-1 border-border bg-surface p-3">
                <Pressable
                  role="button"
                  aria-label={(index + 1) + '. ' + product.name + ', ' + formatPrice(product.price)}
                  accessibilityHint={t('product.openHint')}
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                  className="flex-row items-center gap-3 active:bg-surface-sunken">
                  <ProductThumbnail uri={product.photos[0]} size="lg" />
                  <View className="flex-1 gap-1">
                    <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>{(index + 1) + '. ' + product.name}</Text>
                    <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>{formatPrice(product.price)}</Text>
                  </View>
                </Pressable>
                <Button size="md" label={t('product.addToCart', { price: formatPrice(product.price) })} hint={t('product.addToCartHint')} disabled={busy || isCartLoading || product.stock_quantity < 1} onPress={() => addProduct(product)} />
              </View>
            ))}
          </View>
        ))}
        {busy && <Text className="type-text-primary text-secondary" accessibilityLiveRegion="polite">{t('assistant.thinking')}</Text>}
      </ScrollView>
      <View className="gap-3 border-t-1 border-border px-4 pt-3" style={{ paddingBottom: 16 }}>
        {error && <Text role="alert" className="type-text-primary text-error" maxFontSizeMultiplier={2}>{error}</Text>}
        <Controller control={control} name="body" render={({ field, fieldState }) => (
          <InputField
            ref={inputRef}
            label={t('assistant.command')}
            isLabelHidden
            placeholder={t('assistant.command')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            isDisabled={busy || isCartLoading}
            isMicVisible={false}
            maxLength={MESSAGE_MAX_LENGTH}
            returnKeyType="send"
            submitBehavior="submit"
            onSubmitEditing={submit}
            trailingAccessory={
              <View className="flex-row items-center gap-3">
                <IconButton
                  diameter={32}
                  variant="filled"
                  icon={<Icon name="dictate" size="md" className={busy || isCartLoading || isDictating ? 'text-disabled' : 'text-primary'} />}
                  label={t('assistant.dictate')}
                  hint={hint}
                  disabled={busy || isCartLoading || isDictating}
                  onPress={dictate}
                />
                <IconButton
                  diameter={32}
                  variant="filled"
                  icon={<Icon name="send" size="md" className={busy || isCartLoading || isDictating || !field.value.trim() ? 'text-disabled' : 'text-primary'} />}
                  label={t('composer.send')}
                  hint={t('composer.sendHint')}
                  disabled={busy || isCartLoading || isDictating || !field.value.trim()}
                  onPress={submit}
                />
              </View>
            }
          />
        )} />
        {feedback && <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>{feedback}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}
