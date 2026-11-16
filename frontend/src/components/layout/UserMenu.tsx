import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loggedOut } from '../../store/authSlice';
import { baseApi } from '../../api/baseApi';
import { ChevronIcon } from '../ui/Icons';

export function UserMenu() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const logout = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('header.userMenu')}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
        <ChevronIcon />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-40 mt-2 w-56 p-2">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-300">
              {t(`role.${user.role}`)}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="btn-ghost w-full !justify-start"
            onClick={logout}
          >
            {t('header.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
