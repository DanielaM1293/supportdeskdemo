import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetUsersQuery, useUpdateUserMutation } from '../api/usersApi';
import { useAppSelector } from '../store/hooks';
import { ROLES, type Role } from '../types';
import { formatDateTime } from '../utils/time';
import {
  EmptyState,
  ErrorState,
  InlineError,
  PageHeader,
  TableSkeleton,
} from '../components/ui/Feedback';

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const currentId = useAppSelector((s) => s.auth.user?.id);
  const { data, error, isLoading, refetch } = useGetUsersQuery();
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [updateError, setUpdateError] = useState<unknown>(null);

  const change = async (id: number, changes: { role?: Role; is_active?: boolean }) => {
    setUpdateError(null);
    try {
      await updateUser({ id, changes }).unwrap();
    } catch (e) {
      setUpdateError(e);
    }
  };

  return (
    <>
      <PageHeader title={t('users.title')} subtitle={t('users.subtitle')} />
      {!!updateError && (
        <div className="mb-4">
          <InlineError error={updateError} fallback={t('users.updateError')} />
        </div>
      )}
      <section className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : error ? (
          <ErrorState title={t('users.loadError')} error={error} onRetry={() => void refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState title={t('users.empty')} />
        ) : data ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-200/70 dark:border-ink-800">
                <tr>
                  <th scope="col" className="th">
                    {t('users.name')}
                  </th>
                  <th scope="col" className="th">
                    {t('users.email')}
                  </th>
                  <th scope="col" className="th">
                    {t('users.role')}
                  </th>
                  <th scope="col" className="th">
                    {t('users.active')}
                  </th>
                  <th scope="col" className="th">
                    {t('users.joined')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/70 dark:divide-ink-800">
                {data.items.map((u) => {
                  const isSelf = u.id === currentId;
                  return (
                    <tr key={u.id}>
                      <th scope="row" className="td text-left font-semibold">
                        {u.name}
                        {isSelf && (
                          <span className="badge ml-2 bg-brand-50 text-brand-800 ring-brand-600/25 dark:bg-brand-500/10 dark:text-brand-200">
                            {t('users.you')}
                          </span>
                        )}
                      </th>
                      <td className="td">{u.email}</td>
                      <td className="td">
                        <select
                          className="input !w-auto"
                          aria-label={t('users.changeRole', { name: u.name })}
                          value={u.role}
                          disabled={isSelf || saving}
                          onChange={(e) => void change(u.id, { role: e.target.value as Role })}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(`role.${r}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="td">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            role="switch"
                            className="h-4 w-4 accent-brand-600"
                            aria-label={t('users.toggleActive', { name: u.name })}
                            checked={u.is_active}
                            disabled={isSelf || saving}
                            onChange={(e) => void change(u.id, { is_active: e.target.checked })}
                          />
                          <span className="text-xs">
                            {u.is_active ? t('common.yes') : t('common.no')}
                          </span>
                        </label>
                      </td>
                      <td className="td whitespace-nowrap">
                        {formatDateTime(u.created_at, i18n.language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </>
  );
}
