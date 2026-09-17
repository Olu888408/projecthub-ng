import { useEffect, useState } from 'react';
import { User, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from '@/context/RouterContext';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validatePhone } from '@/lib/utils';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [form, setForm] = useState({ full_name: '', phone: '', university: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        university: profile.university || '',
        department: profile.department || '',
      });
      setLoading(false);
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    if (form.phone && !validatePhone(form.phone)) {
      showToast('Invalid phone number format', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      university: form.university.trim(),
      department: form.department.trim(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      showToast('Failed to update profile', 'error');
      return;
    }
    await refreshProfile();
    showToast('Profile updated successfully', 'success');
  }

  if (loading || !profile) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
          <User className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-600">{profile.email}</p>
        </div>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} />
          <Input label="Email" value={profile.email} disabled className="bg-slate-50" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." maxLength={20} />
          <Input label="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="e.g., University of Lagos" maxLength={200} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g., Computer Science" maxLength={200} />
          <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
            <span className="px-2 py-1 rounded bg-slate-100 font-medium">{profile.role}</span>
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
