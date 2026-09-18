import { ClipboardList, FileSearch, Users, Presentation, CheckCircle2 } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Button, Card } from '@/components/ui';

export function HowItWorksPage() {
  const { navigate } = useRouter();

  const steps = [
    {
      icon: ClipboardList,
      title: '1. Submit Your Request',
      desc: 'Create an account and submit your project request with details about your topic, department, university, and requirements. Upload any existing documents or guidelines.',
    },
    {
      icon: FileSearch,
      title: '2. Review & Consultation',
      desc: 'Our team reviews your request and assigns a qualified consultant. You will receive guidance on the approach, methodology, and timeline for your project.',
    },
    {
      icon: Users,
      title: '3. Collaborative Support',
      desc: 'Work with your assigned consultant throughout the project. Communicate via in-app messaging, upload additional files, and track progress in real time.',
    },
    {
      icon: Presentation,
      title: '4. Presentation & Defense Prep',
      desc: 'Receive presentation slide preparation, defense coaching, likely-question preparation, and project explanation sessions to help you present with confidence.',
    },
  ];

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl text-slate-900">How It Works</h1>
          <p className="mt-4 text-lg text-slate-600">
            A simple, structured process to get the research support you need — from initial request to defense preparation.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
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
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page">
          <h2 className="font-serif text-2xl text-slate-900 text-center mb-8">What You Can Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              'Clear communication throughout the process',
              'Structured guidance tailored to your department',
              'Confidential handling of submitted information',
              'Professional research and presentation support',
              'Regular progress updates and status tracking',
              'Direct messaging with your assigned consultant',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
