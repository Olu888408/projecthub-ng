import { useRouter } from '@/context/RouterContext';

export function useParams(): Record<string, string> {
  const { path } = useRouter();
  const parts = path.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  // Match patterns like /legal/:slug, /projects/:id, /projects/:id/messages
  if (parts[0] === 'legal' && parts[1]) {
    params.slug = parts[1];
  }
  // Short-form legal routes used in App.tsx (/privacy, /terms, etc.) — map
  // them to the actual legal_pages slugs so LegalPage can look them up.
  if (parts[0] === 'privacy') {
    params.slug = 'privacy-policy';
  }
  if (parts[0] === 'terms') {
    params.slug = 'terms-of-service';
  }
  if (parts[0] === 'refund-policy') {
    params.slug = 'refund-policy';
  }
  if (parts[0] === 'academic-integrity') {
    params.slug = 'academic-integrity';
  }
  if (parts[0] === 'projects' && parts[1]) {
    params.id = parts[1];
  }
  if (parts[0] === 'admin' && parts[1] === 'projects' && parts[2]) {
    params.id = parts[2];
  }
  if (parts[0] === 'admin' && parts[1] === 'legal' && parts[2]) {
    params.slug = parts[2];
  }
  return params;
}

export { useRouter };
