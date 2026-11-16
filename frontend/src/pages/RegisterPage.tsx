import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerSchema, type RegisterForm } from '../schemas';
import { useRegisterMutation } from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { credentialsSet } from '../store/authSlice';
import { AuthShell } from '../components/layout/AuthShell';
import { FormField } from '../components/ui/FormField';
import { InlineError } from '../components/ui/Feedback';

export default function RegisterPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }: RegisterForm) => {
    try {
      const res = await registerUser({ name, email, password }).unwrap();
      dispatch(credentialsSet({ user: res.user, token: res.access_token }));
      navigate('/tickets', { replace: true });
    } catch {
      /* rendered from mutation state */
    }
  };

  const field = (name: keyof RegisterForm, label: string, type: string, auto: string) => (
    <FormField id={name} label={label} error={errors[name]?.message}>
      <input
        id={name}
        type={type}
        autoComplete={auto}
        className="input"
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...register(name)}
      />
    </FormField>
  );

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && <InlineError error={error} />}
        {field('name', t('auth.name'), 'text', 'name')}
        {field('email', t('auth.email'), 'email', 'email')}
        {field('password', t('auth.password'), 'password', 'new-password')}
        {field('confirmPassword', t('auth.confirmPassword'), 'password', 'new-password')}
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? t('auth.signingUp') : t('auth.signUp')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        {t('auth.haveAccount')}{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  );
}
