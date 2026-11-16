import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setLanguage } from '../../store/languageSlice';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.language.current);
  return (
    <div
      role="group"
      aria-label={t('header.language')}
      className="inline-flex rounded-xl border border-ink-200 p-0.5 dark:border-ink-700"
    >
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-pressed={current === lng}
          onClick={() => dispatch(setLanguage(lng))}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition ${
            current === lng
              ? 'bg-brand-600 text-white'
              : 'text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
