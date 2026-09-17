import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { Card, Spinner, Button, Input, Textarea, Badge, EmptyState } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import type { Package as Pkg } from '@/types/database';

export function AdminPackagesPage() {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', features: '', is_active: true, display_order: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('packages').select('*').order('display_order', { ascending: true });
      if (data) setPackages(data as Pkg[]);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      showToast('Title and price are required', 'error');
      return;
    }
    const features = form.features.split('\n').map((f) => f.trim()).filter(Boolean);
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      showToast('Invalid price', 'error');
      return;
    }
    if (editing) {
      const { error } = await supabase.from('packages').update({
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        features,
        is_active: form.is_active,
        display_order: form.display_order,
      }).eq('id', editing.id);
      if (error) { showToast('Failed to update package', 'error'); return; }
      setPackages(packages.map((p) => p.id === editing.id ? { ...p, title: form.title, description: form.description, price, features, is_active: form.is_active, display_order: form.display_order } : p));
      showToast('Package updated', 'success');
    } else {
      const { data, error } = await supabase.from('packages').insert({
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        features,
        is_active: form.is_active,
        display_order: form.display_order,
      }).select('*').single();
      if (error) { showToast('Failed to create package', 'error'); return; }
      setPackages([...packages, data as Pkg]);
      showToast('Package created', 'success');
    }
    setForm({ title: '', description: '', price: '', features: '', is_active: true, display_order: 0 });
    setEditing(null);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) { showToast('Failed to delete package', 'error'); return; }
    setPackages(packages.filter((p) => p.id !== id));
    showToast('Package deleted', 'success');
  }

  function startEdit(p: Pkg) {
    setEditing(p);
    setForm({ title: p.title, description: p.description, price: String(p.price), features: p.features.join('\n'), is_active: p.is_active, display_order: p.display_order });
    setShowForm(true);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Packages</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', description: '', price: '', features: '', is_active: true, display_order: 0 }); }}>
          <Plus className="w-4 h-4" /> Add Package
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Package Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} maxLength={500} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Price (NGN)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Display Order" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <Textarea label="Features (one per line)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={6} placeholder="Chapter 1-5 guidance&#10;Literature review support&#10;Referencing" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              Active (visible to students)
            </label>
            <div className="flex gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'} Package</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {packages.length === 0 ? (
        <Card><EmptyState icon={<Package className="w-12 h-12" />} title="No packages yet" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{pkg.title}</h3>
                  <p className="text-2xl font-bold text-teal-600 mt-1">{formatCurrency(pkg.price)}</p>
                </div>
                <Badge className={pkg.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-3">{pkg.description}</p>
              <ul className="space-y-1.5 mb-4">
                {pkg.features.map((f, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span> {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => startEdit(pkg)}><Edit className="w-3.5 h-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
