import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Button, Card } from '@/components/ui';

const FAQS = [
  { q: 'What services does ProjectHub NG offer?', a: 'We provide research support, project guidance, literature review assistance, chapter structuring, academic writing guidance, referencing and formatting, questionnaire design guidance, data presentation guidance, presentation slide preparation, defense preparation, and consultation services.' },
  { q: 'Is this service legitimate?', a: 'Yes. ProjectHub NG provides research assistance, tutoring, editing, consultation, and presentation support. We do not support plagiarism, fabricated research, fabricated data, impersonation, or academic misconduct. Students are expected to meaningfully participate in their own work.' },
  { q: 'How do I get started?', a: 'Create an account, submit a project request with your topic and requirements, select a package, and upload any relevant documents. Our team will review your request and assign a consultant.' },
  { q: 'How much does it cost?', a: 'We offer three packages: Starter (₦5,000) for topic selection and outline, Standard (₦15,000) for complete project writing with research, and Premium (₦30,000) for full-service support including defense preparation and presentation slides. Visit our Packages page for full details.' },
  { q: 'Can I communicate with my consultant?', a: 'Yes. Once your project is assigned, you can communicate directly with your consultant through our in-app messaging system. You can also upload additional files and track progress in real time.' },
  { q: 'How are payments handled?', a: 'Payments are made via direct bank transfer to our OPay account. Once you submit your transfer details, our team manually confirms the payment and updates your project status.' },
  { q: 'What is the refund policy?', a: 'Refunds may be available within 24 hours of payment if work has not commenced. Once a consultant has been assigned and work has begun, payments are generally non-refundable. See our Refund Policy page for full details.' },
  { q: 'How long does a project take?', a: 'Timelines vary depending on the scope of the project, your department, and the package selected. You will receive an estimated timeline during the consultation phase, and you can track progress through your dashboard.' },
  { q: 'Do you help with defense preparation?', a: 'Yes. Our Premium package includes presentation slide preparation, defense coaching, likely-question preparation, and project explanation sessions to help you present with confidence.' },
  { q: 'Is my information kept confidential?', a: 'Yes. We handle all submitted information confidentially. Your project documents, personal details, and communications are only accessible to you and authorized project consultants. See our Privacy Policy for details.' },
];

export function FAQPage() {
  const { navigate } = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl text-slate-900">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-slate-600">
            Find answers to common questions about our services, process, and policies.
          </p>
        </div>
      </section>

      <section className="container-page py-16 max-w-3xl mx-auto">
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => navigate('/contact')}>Contact Us</Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
