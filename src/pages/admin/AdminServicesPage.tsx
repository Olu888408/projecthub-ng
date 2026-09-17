import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, BookOpen } from 'lucide-react';
import { Card, Spinner, Button, Input, Textarea, Badge, EmptyState, Select } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/database';

export function AdminServicesPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', category: '', description: '', active: true });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('services').select('*').order('category', { ascending: true }).order('name', { ascending: true });
      if (data) setServices(data as Service[]);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      showToast('Name and category are required', 'error');
      return;
    }
    if (editing) {
      const { error } = await supabase.from('services').update({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        active: form.active,
      }).eq('id', editing.id);
      if (error) { showToast('Failed to update service', 'error'); return; }
      setServices(services.map((s) => s.id === editing.id ? { ...s, ...form } : s));
      showToast('Service updated', 'success');
    } else {
      const { data, error } = await supabase.from('services').insert({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        active: form.active,
      }).select('*').single();
      if (error) { showToast('Failed to create service', 'error'); return; }
      setServices([...services, data as Service]);
      showToast('Service created', 'success');
    }
    setForm({ name: '', category: '', description: '', active: true });
    setEditing(null);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { showToast('Failed to delete service', 'error'); return; }
    setServices(services.filter((s) => s.id !== id));
    showToast('Service deleted', 'success');
  }

  function startEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, category: s.category, description: s.description, active: s.active });
    setShowForm(true);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', category: '', description: '', active: true }); }}>
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Service Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} />
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                <option value="Engineering">Engineering</option>
                <option value="Computer Science & Technology">Computer Science & Technology</option>
                <option value="Other Departments">Other Departments</option>
              </Select>
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
              Active (visible to students)
            </label>
            <div className="flex gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'} Service</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {services.length === 0 ? (
        <Card><EmptyState icon={<BookOpen className="w-12 h-12" />} title="No services yet" description="Add services for students to browse and request." /></Card>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <Badge className={s.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                      {s.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-teal-600 mt-0.5">{s.category}</p>
                  {s.description && <p className="text-sm text-slate-600 mt-2">{s.description}</p>}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
