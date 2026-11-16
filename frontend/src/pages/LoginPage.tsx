import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginSchema, type LoginForm } from '../schemas';
import { useLoginMutation } from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { credentialsSet } from '../store/authSlice';
import { AuthShell } from '../components/layout/AuthShell';
import { FormField } from '../components/ui/FormField';
import { InlineError } from '../components/ui/Feedback';
import type { Role } from '../types';

export const DEMO_PASSWORD = 'Demo1234!';
const DEMOS: { role: Role; labelKey: string }[] = [
  { role: 'usuario', labelKey: 'auth.demoUser' },
  { role: 'agente', labelKey: 'auth.demoAgent' },
  { role: 'admin', labelKey: 'auth.demoAdmin' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      const res = await login(values).unwrap();
      dispatch(credentialsSet({ user: res.user, token: res.access_token }));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/tickets', { replace: true });
    } catch {
      /* error is rendered from the mutation state */
    }
  };

  const fill = (role: Role) => {
    setValue('email', `${role}@demo.com`, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && <InlineError error={error} />}
        <FormField id="email" label={t('auth.email')} error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </FormField>
        <FormField id="password" label={t('auth.password')} error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <section
        aria-labelledby="demo-title"
        className="mt-8 rounded-2xl border border-dashed border-ink-300 p-4 dark:border-ink-700"
      >
        <h2 id="demo-title" className="text-sm font-bold">
          {t('auth.demoTitle')}
        </h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-500 dark:text-ink-400">{t('auth.demoHint')}</p>
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((d) => (
            <button
              key={d.role}
              type="button"
              className="btn-secondary !px-3 !py-1.5"
              onClick={() => fill(d.role)}
            >
              {t(d.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
        >
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthShell>
  );
}
