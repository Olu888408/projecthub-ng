import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import type { Package } from '@/types/database';

export function PackagesPage() {
  const { navigate } = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('packages').select('*').eq('is_active', true).order('display_order');
      if (data) setPackages(data as Package[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900">Pricing Packages</h1>
          <p className="mt-4 text-lg text-slate-600">
            Choose the package that best suits your needs. All prices are in Nigerian Naira.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg, idx) => (
            <Card key={pkg.id} className={`p-8 flex flex-col ${idx === 1 ? 'ring-2 ring-teal-500 relative' : ''}`}>
              {idx === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-medium">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{pkg.description}</p>
              <div className="mt-4 text-4xl font-bold text-slate-900">{formatCurrency(pkg.price)}</div>
              <ul className="mt-6 space-y-3 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-8" variant={idx === 1 ? 'primary' : 'outline'} onClick={() => navigate('/signup')}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Need a custom package? <button onClick={() => navigate('/contact')} className="text-teal-600 hover:underline">Contact us</button> for a personalized quote.</p>
        </div>
      </section>
    </div>
  );
}
