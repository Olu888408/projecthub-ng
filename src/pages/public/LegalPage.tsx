import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useParams, useRouter } from '@/components/RouteHelpers';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { LegalPage } from '@/types/database';

export function LegalPage() {
  const { slug } = useParams();
  const { navigate } = useRouter();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('legal_pages').select('*').eq('slug', slug).maybeSingle();
      if (data) {
        setPage(data as LegalPage);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="container-page py-20 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">The legal page you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-teal-600 hover:underline">Go home</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in container-page py-16 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-slate-900">{page.title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {new Date(page.updated_at).toLocaleDateString('en-NG')}</p>
      <div className="mt-8 prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{page.content}</p>
      </div>
    </div>
  );
}
