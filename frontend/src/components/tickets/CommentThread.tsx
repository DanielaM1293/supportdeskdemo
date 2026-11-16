import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { Comment } from '../../types';
import { commentSchema, type CommentForm } from '../../schemas';
import { useAddCommentMutation } from '../../api/ticketsApi';
import { formatDateTime } from '../../utils/time';
import { InlineError } from '../ui/Feedback';
import { LockIcon } from '../ui/Icons';

export function CommentThread({
  ticketId,
  comments,
  canInternal,
}: {
  ticketId: number;
  comments: Comment[];
  canInternal: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [addComment, { isLoading, error }] = useAddCommentMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: '', internal: false },
  });

  const onSubmit = async (values: CommentForm) => {
    try {
      await addComment({
        ticketId,
        body: values.body,
        ...(canInternal && values.internal ? { internal: true } : {}),
      }).unwrap();
      reset();
    } catch {
      /* rendered from mutation state */
    }
  };

  return (
    <section aria-labelledby="comments-title" className="card p-5">
      <h2 id="comments-title" className="mb-4 font-bold">
        {t('detail.comments')} <span className="text-ink-400">({comments.length})</span>
      </h2>
      {comments.length === 0 ? (
        <p className="py-4 text-sm text-ink-500">{t('detail.noComments')}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              data-internal={c.internal}
              className={`rounded-xl p-4 ${
                c.internal
                  ? 'border border-dashed border-amber-400 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10'
                  : 'bg-ink-50 dark:bg-ink-800/60'
              }`}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-sm font-semibold">{c.author.name}</span>
                <span className="text-ink-500">{t(`role.${c.author.role}`)}</span>
                <span className="text-ink-400">{formatDateTime(c.created_at, i18n.language)}</span>
                {c.internal && (
                  <span className="badge bg-amber-100 text-amber-900 ring-amber-600/30 dark:bg-amber-500/20 dark:text-amber-200">
                    <LockIcon />
                    {t('detail.internalBadge')}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-3">
        <label htmlFor="comment-body" className="label">
          {t('detail.addComment')}
        </label>
        <textarea
          id="comment-body"
          rows={3}
          className="input"
          placeholder={t('detail.commentPlaceholder')}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? 'comment-body-error' : undefined}
          {...register('body')}
        />
        {errors.body?.message && (
          <p id="comment-body-error" role="alert" className="field-error">
            {t(errors.body.message)}
          </p>
        )}
        {error && <InlineError error={error} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {canInternal ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-ink-300 text-brand-600"
                {...register('internal')}
              />
              {t('detail.internalNote')}
            </label>
          ) : (
            <span />
          )}
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? t('detail.sending') : t('detail.send')}
          </button>
        </div>
      </form>
    </section>
  );
}
