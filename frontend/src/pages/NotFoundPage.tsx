import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-center gap-3 py-20 text-center">
      <p aria-hidden="true" className="text-6xl font-extrabold text-brand-600 dark:text-brand-300">
        404
      </p>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('notFound.title')}</h1>
      <p className="text-sm text-ink-500 dark:text-ink-400">{t('notFound.text')}</p>
      <Link to="/tickets" className="btn-primary mt-3">
        {t('notFound.home')}
      </Link>
    </section>
  );
}
