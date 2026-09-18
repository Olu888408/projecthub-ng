import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Shield, MessageSquare, Star } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import type { Package, Testimonial } from '@/types/database';

export function LandingPage() {
  const { navigate } = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: pkgData }, { data: testData }] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
        supabase.from('testimonials').select('*').eq('is_approved', true).limit(3),
      ]);
      if (pkgData) setPackages(pkgData as Package[]);
      if (testData) setTestimonials(testData as Testimonial[]);
    })();
  }, []);

  const features = [
    { title: 'Expert guidance', desc: 'Work with experienced academic professionals who understand Nigerian university standards.' },
    { title: 'Structured research support', desc: 'Proper literature review, methodology guidance, and formatting, end to end.' },
    { title: 'Confidential handling', desc: 'Your submitted information and documents are handled with strict confidentiality.' },
    { title: 'Direct messaging', desc: 'Track progress and message your assigned consultant throughout the project.' },
    { title: 'Defense preparation', desc: 'Mock presentations, likely-question prep, and coaching before you present.' },
    { title: 'Clear pricing', desc: 'Three fixed packages. No hidden charges, no negotiation required.' },
  ];

  const steps = [
    { title: 'Submit your request', desc: 'Create an account and share your topic, department, and requirements.' },
    { title: 'Get matched', desc: 'Our team reviews the request and assigns a qualified consultant.' },
    { title: 'Work together', desc: 'Message your consultant, share files, and track progress from your dashboard.' },
    { title: 'Present with confidence', desc: 'Receive slides, coaching, and likely-question prep for your defense.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200">
        <div className="container-page py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-medium text-teal-700">Research support for Nigerian university students</p>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl text-slate-900 leading-[1.1]">
                Research. Build. Present. With confidence.
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Structured research guidance, project support, and defense preparation for students
                across Nigerian universities — from topic selection through to your final presentation.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/signup')}>
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/services')}>
                  Explore Services
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5 lg:pt-2">
              <div className="border-l-2 border-amber-600 pl-6">
                <p className="font-serif text-xl text-slate-800 leading-snug">
                  "We help students meaningfully participate in their own research — guidance, not shortcuts."
                </p>
                <p className="mt-3 text-sm text-slate-500">Our approach to academic integrity</p>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 pt-6">
                <div>
                  <dt className="text-2xl font-serif text-slate-900">500+</dt>
                  <dd className="text-xs text-slate-500 mt-1">Projects supported</dd>
                </div>
                <div>
                  <dt className="text-2xl font-serif text-slate-900">300+</dt>
                  <dd className="text-xs text-slate-500 mt-1">Students guided</dd>
                </div>
                <div>
                  <dt className="text-2xl font-serif text-slate-900">15+</dt>
                  <dd className="text-xs text-slate-500 mt-1">Universities</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — a real sequence, so numbering earns its place */}
      <section className="container-page py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-serif text-2xl md:text-3xl text-slate-900">How it works</h2>
          <p className="mt-3 text-slate-600">A simple, structured process from request to defense preparation.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {steps.map((step, i) => (
            <div key={step.title} className="relative pl-10">
              <span className="absolute left-0 top-0 font-serif text-2xl text-amber-600">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <button onClick={() => navigate('/how-it-works')} className="text-sm font-medium text-teal-700 hover:underline">
            Learn more about the process
          </button>
        </div>
      </section>

      {/* Features — a plain divided list, not a grid of icon cards */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl md:text-3xl text-slate-900">Why students choose ProjectHub NG</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {features.map((feature) => (
              <div key={feature.title} className="border-t border-slate-300 pt-4">
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages — a genuine comparison, cards are functionally justified here */}
      {packages.length > 0 && (
        <section className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl md:text-3xl text-slate-900">Choose your package</h2>
            <p className="mt-3 text-slate-600">Three fixed prices. No negotiation, no hidden charges.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <Card key={pkg.id} className={`p-8 flex flex-col ${idx === 1 ? 'border-teal-600 border-2' : ''}`}>
                {idx === 1 && (
                  <p className="text-xs font-medium text-teal-700 mb-3">Most chosen</p>
                )}
                <h3 className="font-serif text-xl text-slate-900">{pkg.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{pkg.description}</p>
                <p className="mt-5 text-3xl font-serif text-slate-900">{formatCurrency(pkg.price)}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8" variant={idx === 1 ? 'primary' : 'outline'} onClick={() => navigate('/signup')}>
                  Choose {pkg.title}
                </Button>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => navigate('/packages')} className="text-sm font-medium text-teal-700 hover:underline">
              View full package details
            </button>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200">
          <div className="container-page py-16 md:py-20">
            <h2 className="font-serif text-2xl md:text-3xl text-slate-900 mb-10">What our students say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div key={t.id}>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed">"{t.content}"</p>
                  <div className="mt-4 text-sm">
                    <span className="font-medium text-slate-900">{t.name}</span>
                    <span className="text-slate-500"> · {t.university}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-teal-950">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <Shield className="w-8 h-8 text-amber-500 mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl text-white">Ready to get started?</h2>
            <p className="mt-3 text-slate-400">
              Join students across Nigerian universities getting structured research support with ProjectHub NG.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Create your account <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-white/5" onClick={() => navigate('/contact')}>
                <MessageSquare className="w-4 h-4" /> Talk to us first
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
