import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl"
        />
        <div className="relative flex items-center gap-2 text-lg font-extrabold">SupportDesk</div>
        <div className="relative">
          <p className="text-4xl font-extrabold leading-tight tracking-tight">{t('app.tagline')}</p>
          <p className="mt-4 max-w-md text-brand-100/80">{t('auth.loginSubtitle')}</p>
        </div>
        <p className="relative text-xs text-brand-200/60">Demo · fictional data</p>
      </aside>
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:invisible">
            <Logo to="/login" />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
            {title}
          </h1>
          <p className="mb-8 mt-2 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
