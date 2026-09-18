import { useEffect, useState } from 'react';
import { Star, Plus, Trash2, Check, X } from 'lucide-react';
import { Card, Spinner, EmptyState, Button, Input, Textarea } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Testimonial } from '@/types/database';

export function AdminTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', university: '', content: '', rating: 5 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
      if (data) setTestimonials(data as Testimonial[]);
      setLoading(false);
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      showToast('Name and content are required', 'error');
      return;
    }
    const { data, error } = await supabase.from('testimonials').insert({
      name: form.name.trim(),
      university: form.university.trim(),
      content: form.content.trim(),
      rating: form.rating,
      is_approved: true,
    }).select('*').single();
    if (error) {
      showToast('Failed to create testimonial', 'error');
      return;
    }
    setTestimonials([data as Testimonial, ...testimonials]);
    setForm({ name: '', university: '', content: '', rating: 5 });
    setShowForm(false);
    showToast('Testimonial created', 'success');
  }

  async function toggleApproval(t: Testimonial) {
    const { error } = await supabase.from('testimonials').update({ is_approved: !t.is_approved }).eq('id', t.id);
    if (error) {
      showToast('Failed to update testimonial', 'error');
      return;
    }
    setTestimonials(testimonials.map((x) => x.id === t.id ? { ...x, is_approved: !x.is_approved } : x));
    showToast(t.is_approved ? 'Testimonial unapproved' : 'Testimonial approved', 'success');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this testimonial?')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete testimonial', 'error');
      return;
    }
    setTestimonials(testimonials.filter((t) => t.id !== id));
    showToast('Testimonial deleted', 'success');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-slate-900">Testimonials</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
              <Input label="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} maxLength={200} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })}>
                    <Star className={`w-6 h-6 ${r <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} maxLength={1000} />
            <div className="flex gap-2">
              <Button type="submit">Create Testimonial</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {testimonials.length === 0 ? (
        <Card><EmptyState icon={<Star className="w-12 h-12" />} title="No testimonials yet" /></Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <span className="text-xs text-slate-400">{formatDate(t.created_at)}</span>
                  </div>
                  {t.university && <p className="text-sm text-slate-500">{t.university}</p>}
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mt-2">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => toggleApproval(t)}
                    className={`px-2 py-1 rounded text-xs font-medium ${t.is_approved ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {t.is_approved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
