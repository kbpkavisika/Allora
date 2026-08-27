import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

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
import { formatPrice, getStockStatus, toProductInput } from '@/lib/products';
import {
  productCategories,
  productDetailsSchema,
  productStepFields,
  type ProductDetailsValues,
} from '@/lib/sellerSchemas';

const TOTAL_STEPS = 4;

const STEP_CAPTIONS = ['record', 'review', 'photos', 'done'];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function AddProductScreen() {
  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const stockQuantityRef = useRef<TextInput>(null);

  const { createProduct } = useProducts();

  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

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
    setIsRecording(false);
    setElapsed(0);
    setStep(1);
  }

  // Capture is mocked until the recorder and transcription are wired up: stopping simply
  // advances to the review step so the seller can type the details in.
  function toggleRecording() {
    if (isRecording) {
      setIsRecording(false);
      setStep(2);
      return;
    }

    setElapsed(0);
    setIsRecording(true);
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
      setFormError('Something went wrong publishing your product. Please try again.');
      return;
    }

    setStep(TOTAL_STEPS);
  }

  const submit = handleSubmit(onSubmit, () => nameRef.current?.focus());

  function addAnother() {
    reset();
    setElapsed(0);
    setFormError(null);
    setStep(1);
  }

  function goToShop() {
    router.replace('/(seller)');
  }

  function viewListing() {
    router.replace('/(seller)');
    router.push('/seller/products');
  }

  return (
    <KeyboardScreen>
      {step < TOTAL_STEPS ? (
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="back" size="lg" className="text-primary" />}
          label={step === 1 ? 'Close' : 'Go back'}
          hint={step === 1 ? 'Closes without adding a product' : 'Returns to the previous step'}
          onPress={goBack}
          className="mb-6"
        />
      ) : null}

      <StepProgress current={step} total={TOTAL_STEPS} />

      <View className="mb-8 mt-3 items-center gap-1">
        <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
          New product
        </Text>
        <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
          Step {step} of {TOTAL_STEPS} · {STEP_CAPTIONS[step - 1]}
        </Text>
      </View>

      {step === 1 ? (
        <View className="items-center gap-6">
          <View className="items-center gap-2">
            <Text
              role="heading"
              className="type-h2 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              Tell us about your product
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={1.5}>
              Press the mic and say the name, the price and how many you have.
            </Text>
          </View>

          <View className="rounded-full border-1 border-border p-5">
            <Pressable
              onPress={toggleRecording}
              role="button"
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              aria-pressed={isRecording}
              className="h-16 w-16 items-center justify-center rounded-full bg-primary active:bg-primary-hover">
              <Icon name={isRecording ? 'stop' : 'dictate'} size="lg" className="text-surface" />
            </Pressable>
          </View>

          {isRecording ? (
            <View className="flex-row items-center gap-2" aria-live="polite">
              <View className="h-2 w-2 rounded-full bg-accent" aria-hidden />
              <Text className="type-overline text-accent-pressed">Recording</Text>
              <Text className="type-mono text-primary">{formatDuration(elapsed)}</Text>
            </View>
          ) : (
            <Text className="type-text-secondary text-secondary">Tap the mic to start</Text>
          )}

          <Callout message="Try: “Teak serving tray, two thousand rupees, five in stock, handmade from recycled teak.”" />

          <Button
            variant="link"
            label="Type it in instead"
            fullWidth={false}
            onPress={() => setStep(2)}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-5">
          <Callout message="We heard this — check if it's right!" />

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <InputField
                ref={nameRef}
                label="Product name"
                placeholder="e.g. Teak serving tray"
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
                  label="Price (LKR)"
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
                  label="In stock"
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
                label="Description"
                placeholder="Describe the material, size and finish"
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
                label="Category"
                options={productCategories}
                value={field.value}
                onChange={field.onChange}
                error={errors.category?.message}
                required
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label="Re-record" onPress={goToRecord} />
            </View>
            <View className="flex-1">
              <Button label="Continue" onPress={goToPhotos} />
            </View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-5">
          <View className="gap-2">
            <Text role="heading" className="type-h2 text-primary" maxFontSizeMultiplier={1.5}>
              Add photos
            </Text>
            <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={1.5}>
              Add up to 6 photos so buyers can see the item clearly. The first photo is the cover.
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
            message="Tip: natural light and a plain background help items sell faster."
          />

          <FormError message={formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                label="Skip for now"
                loading={isSubmitting}
                onPress={submit}
              />
            </View>
            <View className="flex-1">
              <Button label="Continue" loading={isSubmitting} onPress={submit} />
            </View>
          </View>
        </View>
      ) : null}

      {step === TOTAL_STEPS ? (
        <View className="gap-6">
          <PublishedStep values={getValues()} />

          <View className="w-full gap-3">
            <Button label="Add another product" onPress={addAnother} />
            <Button variant="secondary" label="View listing" onPress={viewListing} />
            <Button
              variant="link"
              label="Back to my shop"
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
          {values.name} is live!
        </Text>
        <Text
          className="type-text-primary text-center text-secondary"
          maxFontSizeMultiplier={1.5}>
          Buyers browsing {values.category} can find it now
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
          <Badge label={stock.label} variant={stock.variant} />
        </View>
      </View>
    </View>
  );
}
