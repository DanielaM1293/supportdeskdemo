import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Logo } from './Logo';

export function AppLayout() {
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);

  const links = [
    { to: '/tickets', label: t('nav.tickets'), end: true },
    { to: '/tickets/new', label: t('nav.newTicket'), end: true },
    { to: '/dashboard', label: t('nav.dashboard'), end: true },
    ...(role === 'admin' ? [{ to: '/users', label: t('nav.users'), end: true }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 dark:focus:bg-ink-900"
      >
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur dark:border-ink-800 dark:bg-ink-950/80">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav aria-label={t('nav.main')} className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavItem key={l.to} {...l} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <nav
          aria-label={t('nav.main')}
          className="flex gap-1 overflow-x-auto border-t border-ink-200/70 px-4 py-2 md:hidden dark:border-ink-800"
        >
          {links.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200/70 py-6 text-center text-xs text-ink-400 dark:border-ink-800">
        SupportDesk · {t('app.tagline')}
      </footer>
    </div>
  );
}

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
            : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
