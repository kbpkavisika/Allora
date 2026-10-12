import { useProfile } from '@/hooks/useProfile';
import { useTranslation } from 'react-i18next';

export function useListPosition() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  return (index: number, total: number) =>
    profile?.screen_reader_support
      ? t('a11y.listPosition', { index: index + 1, total })
      : undefined;
}
