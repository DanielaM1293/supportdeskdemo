import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ticketSchema, type TicketForm } from '../schemas';
import { useCreateTicketMutation } from '../api/ticketsApi';
import { CATEGORIES, PRIORITIES } from '../types';
import { FormField } from '../components/ui/FormField';
import { InlineError, PageHeader } from '../components/ui/Feedback';

export default function NewTicketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createTicket, { isLoading, error }] = useCreateTicketMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', category: 'software', priority: 'media' },
  });

  const onSubmit = async (values: TicketForm) => {
    try {
      const ticket = await createTicket(values).unwrap();
      navigate(`/tickets/${ticket.id}`);
    } catch {
      /* rendered from mutation state */
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('newTicket.title')} subtitle={t('newTicket.subtitle')} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6">
        {error && <InlineError error={error} />}
        <FormField id="title" label={t('newTicket.titleField')} error={errors.title?.message}>
          <input
            id="title"
            className="input"
            placeholder={t('newTicket.titlePlaceholder')}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
            {...register('title')}
          />
        </FormField>
        <FormField
          id="description"
          label={t('newTicket.description')}
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={6}
            className="input"
            placeholder={t('newTicket.descriptionPlaceholder')}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
            {...register('description')}
          />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="category" label={t('newTicket.category')} error={errors.category?.message}>
            <select id="category" className="input" {...register('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="priority" label={t('newTicket.priority')} error={errors.priority?.message}>
            <select id="priority" className="input" {...register('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`priority.${p}`)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? t('newTicket.submitting') : t('newTicket.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
