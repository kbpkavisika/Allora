import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ProductPhotoGrid } from '@/components/ui/ProductPhotoGrid';
import { StepProgress } from '@/components/ui/StepProgress';
import { useProducts } from '@/hooks/useProducts';
import { useDictation } from '@/hooks/useDictation';
import { MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { formatPrice, getStockStatus, toProductInput } from '@/lib/products';
import { extractProductDraft, ProductVoiceError, toProductFormValues } from '@/lib/productVoice';
import { messageSchema, type MessageValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';
import {
  productCategories,
  productDetailsSchema,
  productStepFields,
  type ProductDetailsValues,
} from '@/lib/sellerSchemas';
import { translateOption } from '@/lib/i18n';
import { photoUploadErrorMessage } from '@/lib/photoUpload';

const TOTAL_STEPS = 4;

const STEP_CAPTIONS = ['record', 'review', 'photos', 'done'];

export default function AddProductScreen() {
  const { t } = useTranslation();
  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const stockQuantityRef = useRef<TextInput>(null);

  const { createProduct } = useProducts();

  const transcriptRef = useRef<TextInput>(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceDraft, setIsVoiceDraft] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const transcriptForm = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '' },
  });
  const transcript = useWatch({ control: transcriptForm.control, name: 'body' });
  const dictation = useDictation({
    inputRef: transcriptRef,
    value: transcript,
    onChangeText: (body) =>
      transcriptForm.setValue('body', body, { shouldDirty: true, shouldValidate: true }),
    maxLength: MESSAGE_MAX_LENGTH,
    isDisabled: isProcessing,
  });

  const {
    control,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductDetailsValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      photos: [],
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  function goBack() {
    if (step === 1) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(seller)');
      }
      return;
    }

    setStep((current) => Math.max(1, current - 1));
  }

  function goToRecord() {
    setVoiceError(null);
    setStep(1);
  }

  const fillFromTranscript = transcriptForm.handleSubmit(async ({ body }) => {
    if (isProcessing || dictation.isDictating) return;
    setVoiceError(null);
    setIsProcessing(true);
    AccessibilityInfo.announceForAccessibility(t('addProduct.processing'));

    try {
      const draft = await extractProductDraft(supabase, body);
      reset({ ...getValues(), ...toProductFormValues(draft) });
      setIsVoiceDraft(true);
      setStep(2);
    } catch (failure) {
      setVoiceError(failure instanceof ProductVoiceError ? failure.message : t('addProduct.voiceFailed'));
    } finally {
      setIsProcessing(false);
    }
  });

  function typeInstead() {
    setVoiceError(null);
    setIsVoiceDraft(false);
    setStep(2);
  }

  async function goToPhotos() {
    const valid = await trigger(productStepFields[1]);
    if (valid) {
      setStep(3);
    }
  }

  async function onSubmit(values: ProductDetailsValues) {
    setFormError(null);

    const { error } = await createProduct(toProductInput(values));

    if (error) {
      console.warn('[AddProduct] publish failed', error);
      setFormError(
        photoUploadErrorMessage(error, t('addProduct.publishError'), t('productForm.photoUploadError'))
      );
      return;
    }

    setStep(TOTAL_STEPS);
  }

  const submit = () => handleSubmit(onSubmit, () => nameRef.current?.focus())();

  function addAnother() {
    reset();
    transcriptForm.reset();
    setVoiceError(null);
    setIsVoiceDraft(false);
    setFormError(null);
    setStep(1);
  }

  function goToShop() {
    router.replace('/(seller)');
  }

  function viewListing() {
    router.replace('/(seller)');
    router.push('/(seller)/products');
  }

  return (
    <KeyboardScreen>
      {step < TOTAL_STEPS ? (
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="back" size="lg" className="text-primary" />}
          label={step === 1 ? t('common.close') : t('common.goBack')}
          hint={step === 1 ? t('addProduct.closeHint') : t('common.previousStepHint')}
          onPress={goBack}
          className="mb-6"
        />
      ) : null}

      <StepProgress current={step} total={TOTAL_STEPS} />

      <View className="mb-8 mt-3 items-center gap-1">
        <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
          {t('addProduct.title')}
        </Text>
        <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
          {t('orders.step', {
            current: step,
            total: TOTAL_STEPS,
            label: t(`addProduct.steps.${STEP_CAPTIONS[step - 1]}`),
          })}
        </Text>
      </View>

      {step === 1 ? (
        <View className="items-center gap-6">
          <View className="items-center gap-2">
            <Text
              role="heading"
              className="type-h2 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              {t('addProduct.recordTitle')}
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={1.5}>
              {t('addProduct.recordBody')}
            </Text>
          </View>

          <View className="rounded-full border-1 border-border p-5">
            <Pressable
              onPress={dictation.dictate}
              disabled={isProcessing || dictation.isDictating}
              role="button"
              aria-label={t('addProduct.startRecording')}
              accessibilityHint={dictation.hint}
              aria-busy={isProcessing}
              aria-disabled={isProcessing || dictation.isDictating}
              className="h-16 w-16 items-center justify-center rounded-full bg-primary active:bg-primary-hover">
              {isProcessing ? (
                <ActivityIndicator size={20} className="text-surface" />
              ) : (
                <Icon name="dictate" size="lg" className="text-surface" />
              )}
            </Pressable>
          </View>

          <Text className="type-text-secondary text-secondary" aria-live="polite">
            {isProcessing ? t('addProduct.processing') : dictation.feedback || t('addProduct.tapMic')}
          </Text>

          <Controller
            control={transcriptForm.control}
            name="body"
            render={({ field, fieldState }) => (
              <InputField
                ref={transcriptRef}
                label={t('addProduct.heard')}
                placeholder={t('addProduct.recordBody')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isDisabled={isProcessing}
                isMicVisible={false}
                maxLength={MESSAGE_MAX_LENGTH}
                multiline
              />
            )}
          />

          <Button
            label={t('common.continue')}
            loading={isProcessing}
            disabled={dictation.isDictating || !transcript.trim()}
            onPress={fillFromTranscript}
          />

          <FormError message={voiceError} />

          <Callout message={t('addProduct.example')} />

          <Button
            variant="link"
            label={t('addProduct.typeInstead')}
            fullWidth={false}
            disabled={isProcessing}
            onPress={typeInstead}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-5">
          {isVoiceDraft ? <Callout message={t('addProduct.heard')} /> : null}

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <InputField
                ref={nameRef}
                label={t('productForm.name')}
                placeholder={t('productForm.namePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.name?.message}
                isRequired
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => priceRef.current?.focus()}
              />
            )}
          />

          <View className="flex-row gap-4">
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <InputField
                  ref={priceRef}
                  label={t('productForm.priceLkr')}
                  placeholder="0.00"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.price?.message}
                  isRequired
                  isMicVisible={false}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => stockQuantityRef.current?.focus()}
                  width="half"
                />
              )}
            />

            <Controller
              control={control}
              name="stockQuantity"
              render={({ field }) => (
                <InputField
                  ref={stockQuantityRef}
                  label={t('stock.inStock')}
                  placeholder="0"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.stockQuantity?.message}
                  isRequired
                  isMicVisible={false}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                  width="half"
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputField
                ref={descriptionRef}
                label={t('product.description')}
                placeholder={t('productForm.descriptionPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.description?.message}
                isRequired
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <ChipSelect
                label={t('productForm.category')}
                options={productCategories}
                formatOption={translateOption}
                value={field.value}
                onChange={field.onChange}
                error={errors.category?.message}
                required
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label={t('addProduct.reRecord')} onPress={goToRecord} />
            </View>
            <View className="flex-1">
              <Button label={t('common.continue')} onPress={goToPhotos} />
            </View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-5">
          <View className="gap-2">
            <Text role="heading" className="type-h2 text-primary" maxFontSizeMultiplier={1.5}>
              {t('addProduct.photosTitle')}
            </Text>
            <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={1.5}>
              {t('addProduct.photosBody')}
            </Text>
          </View>

          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <ProductPhotoGrid
                photos={field.value}
                onChange={field.onChange}
                error={errors.photos?.message}
              />
            )}
          />

          <Callout
            tone="warning"
            message={t('addProduct.photoTip')}
          />

          <FormError message={formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                label={t('onboarding.personalize.skip')}
                loading={isSubmitting}
                onPress={submit}
              />
            </View>
            <View className="flex-1">
              <Button label={t('common.continue')} loading={isSubmitting} onPress={submit} />
            </View>
          </View>
        </View>
      ) : null}

      {step === TOTAL_STEPS ? (
        <View className="gap-6">
          <PublishedStep values={getValues()} />

          <View className="w-full gap-3">
            <Button label={t('addProduct.addAnother')} onPress={addAnother} />
            <Button variant="secondary" label={t('addProduct.viewListing')} onPress={viewListing} />
            <Button
              variant="link"
              label={t('addProduct.backToShop')}
              className="self-center"
              onPress={goToShop}
            />
          </View>
        </View>
      ) : null}
    </KeyboardScreen>
  );
}

function PublishedStep({ values }: { values: ProductDetailsValues }) {
  const { t } = useTranslation();
  const stock = getStockStatus(values.stockQuantity);
  const cover = values.photos[0];

  return (
    <View className="items-center gap-6">
      <View className="h-16 w-16 items-center justify-center rounded-full border-1 border-success bg-success-tint">
        <Icon name="check" size="lg" className="text-success" />
      </View>

      <View className="items-center gap-2">
        <Text
          role="heading"
          className="type-h1 text-center text-primary"
          maxFontSizeMultiplier={1.5}>
          {t('addProduct.live', { name: values.name })}
        </Text>
        <Text
          className="type-text-primary text-center text-secondary"
          maxFontSizeMultiplier={1.5}>
          {t('addProduct.liveBody', { category: translateOption(values.category) })}
        </Text>
      </View>

      <View className="w-full flex-row items-center gap-3 rounded-12 border-1 border-border bg-surface p-3">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Icon name="shop" size="lg" className="text-secondary" />
          )}
        </View>

        <View className="flex-1 gap-1">
          <Text className="type-h3 text-primary" numberOfLines={1}>
            {values.name}
          </Text>
          <Text className="type-text-secondary text-secondary">{formatPrice(values.price)}</Text>
          <Badge label={stock.badgeLabel} variant={stock.variant} />
        </View>
      </View>
    </View>
  );
}
