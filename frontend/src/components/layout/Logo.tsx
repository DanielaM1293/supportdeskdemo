import { Link } from 'react-router-dom';

export function Logo({ to = '/tickets' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-extrabold tracking-tight">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 5h16v11h-8l-4 4v-4H4z" />
        </svg>
      </span>
      <span className="text-lg text-ink-900 dark:text-white">SupportDesk</span>
    </Link>
  );
}
