import { ButtonLink, EmptyState } from '@/components/ui'

export function NotFoundPage({ what = 'page' }: { what?: string }) {
  return (
    <div className="mx-auto max-w-md py-16">
      <EmptyState icon="signpost" title={`We couldn't find that ${what}.`}>
        <p className="mb-4">It may have been renamed or removed.</p>
        <ButtonLink to="/" variant="primary">
          Back to dashboard
        </ButtonLink>
      </EmptyState>
    </div>
  )
}
