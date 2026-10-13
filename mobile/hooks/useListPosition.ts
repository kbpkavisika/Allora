import { useTranslation } from 'react-i18next';

export function useListPosition() {
  const { t } = useTranslation();
  return (index: number, total: number) =>
    t('a11y.listPosition', { index: index + 1, total });
}
