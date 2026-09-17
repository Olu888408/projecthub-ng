import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePhone, whatsappLink } from '@/lib/utils';

export function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Invalid email format';
    if (form.phone && !validatePhone(form.phone)) e.phone = 'Invalid phone number';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) {
      showToast('Failed to send message. Please try again.', 'error');
      return;
    }
    showToast('Message sent successfully! We will get back to you soon.', 'success');
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900">Contact Us</h1>
          <p className="mt-4 text-lg text-slate-600">
            Have questions? We're here to help. Reach out and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            <Card className="p-6 border-green-200">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">WhatsApp</h3>
              <p className="text-sm text-slate-600 mt-1">
                <a href={whatsappLink('Hello ProjectHub NG, I would like to make an enquiry about your project support services.', 0)} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-green-700">
                  0916 066 1570
                </a>
              </p>
              <p className="text-sm text-slate-600">
                <a href={whatsappLink('Hello ProjectHub NG, I would like to make an enquiry about your project support services.', 1)} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-green-700">
                  0907 339 6693
                </a>
              </p>
              <p className="text-xs text-green-600 mt-2 font-medium">Chat with us</p>
            </Card>
            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Email</h3>
              <p className="text-sm text-slate-600 mt-1">support@projecthub.ng</p>
            </Card>
            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Location</h3>
              <p className="text-sm text-slate-600 mt-1">Lagos, Nigeria</p>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="John Doe" />
                  <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} placeholder="+234..." />
                  <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" />
                </div>
                <Textarea label="Message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} placeholder="Tell us more about your inquiry..." />
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
