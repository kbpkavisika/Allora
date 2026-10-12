import { useTranslation } from 'react-i18next';

import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { OptionList } from '@/components/ui/OptionList';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LANGUAGES, languageName, setLanguage, type LanguageCode } from '@/lib/i18n';

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();

  return (
    <KeyboardScreen>
      <ScreenHeader title={t('language.title')} subtitle={t('language.subtitle')} className="mb-5" />

      <OptionList
        label={t('language.label')}
        options={LANGUAGES.map((language) => language.code)}
        value={i18n.language}
        onChange={(code) => setLanguage(code as LanguageCode)}
        formatOption={languageName}
      />
    </KeyboardScreen>
  );
}
