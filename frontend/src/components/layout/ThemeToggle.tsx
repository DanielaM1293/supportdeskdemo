import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/themeSlice';
import { MoonIcon, SunIcon } from '../ui/Icons';

export function ThemeToggle() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);
  const dark = mode === 'dark';
  return (
    <button
      type="button"
      className="btn-ghost !p-2"
      aria-label={dark ? t('header.switchToLight') : t('header.switchToDark')}
      onClick={() => dispatch(toggleTheme())}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
