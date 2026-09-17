import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle, FileText, GraduationCap, Users, Award, Clock, Shield, MessageSquare, Star, Search, Presentation, ClipboardList } from 'lucide-react';
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
    { icon: BookOpen, title: 'Expert Guidance', desc: 'Work with experienced academic professionals who understand Nigerian university standards.' },
    { icon: FileText, title: 'Structured Research Support', desc: 'Full research support with proper literature review, methodology guidance, and formatting.' },
    { icon: Shield, title: 'Confidential Handling', desc: 'Your submitted information and project documents are handled with strict confidentiality.' },
    { icon: Clock, title: 'Clear Communication', desc: 'Track progress in real time and communicate directly with your assigned consultant.' },
    { icon: Presentation, title: 'Defense Preparation', desc: 'Get ready for your project defense with mock presentations and coaching sessions.' },
    { icon: MessageSquare, title: 'Direct Messaging', desc: 'Chat directly with your assigned consultant throughout the project lifecycle.' },
  ];

  const steps = [
    { icon: ClipboardList, title: 'Submit Request', desc: 'Create an account and submit your project details, topic, and requirements.' },
    { icon: Search, title: 'Review & Consultation', desc: 'Our team reviews your request and assigns a qualified consultant.' },
    { icon: Users, title: 'Collaborative Support', desc: 'Work with your consultant through messaging, file sharing, and progress tracking.' },
    { icon: Award, title: 'Present with Confidence', desc: 'Receive defense preparation, presentation slides, and coaching to present confidently.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-100 rounded-full blur-3xl" />
        </div>
        <div className="relative container-page py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              Research support for Nigerian university students
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Research. Build. Present. <span className="text-teal-600">With Confidence.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Professional research support, project guidance and presentation preparation for students across multiple disciplines.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/services')}>
                Explore Services
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Projects Supported' },
              { value: '300+', label: 'Students Guided' },
              { value: '15+', label: 'Universities' },
              { value: 'Multiple', label: 'Disciplines' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-slate-600">A simple, structured process from request to defense preparation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card key={step.title} className="p-6">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate('/how-it-works')}>Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Why choose ProjectHub NG?</h2>
          <p className="mt-4 text-slate-600">Professional research support tailored to Nigerian university requirements.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Packages Preview */}
      {packages.length > 0 && (
        <section className="bg-slate-50 py-20">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Choose your package</h2>
              <p className="mt-4 text-slate-600">Flexible pricing options designed to meet every student's needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg, idx) => (
                <Card key={pkg.id} className={`p-8 ${idx === 1 ? 'ring-2 ring-teal-500 relative' : ''}`}>
                  {idx === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-medium">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{pkg.description}</p>
                  <div className="mt-4 text-3xl font-bold text-slate-900">{formatCurrency(pkg.price)}</div>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-8" variant={idx === 1 ? 'primary' : 'outline'} onClick={() => navigate('/signup')}>
                    Choose Package
                  </Button>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="ghost" onClick={() => navigate('/packages')}>View All Packages</Button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="container-page py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">What our students say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">"{t.content}"</p>
                <div className="mt-4">
                  <div className="font-medium text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.university}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-slate-900 py-20">
        <div className="container-page text-center">
          <Users className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">Join students across Nigerian universities who have received professional research support with ProjectHub NG.</p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Create your account <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
