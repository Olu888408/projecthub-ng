import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, FileText } from 'lucide-react';
import { Card, Spinner, Input, Button, Textarea, EmptyState } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Setting, LegalPage } from '@/types/database';

export function AdminSettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'settings' | 'legal'>('settings');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [legalForm, setLegalForm] = useState({ slug: '', title: '', content: '' });
  const [editingLegal, setEditingLegal] = useState<LegalPage | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: settingsData }, { data: legalData }] = await Promise.all([
        supabase.from('settings').select('*').order('key'),
        supabase.from('legal_pages').select('*').order('title'),
      ]);
      if (settingsData) {
        setSettings(settingsData as Setting[]);
        const vals: Record<string, string> = {};
        settingsData.forEach((s) => { vals[s.key] = s.value; });
        setEditValues(vals);
      }
      if (legalData) setLegalPages(legalData as LegalPage[]);
      setLoading(false);
    })();
  }, []);

  async function handleSaveSettings() {
    setSaving(true);
    const failedKeys: string[] = [];
    for (const [key, value] of Object.entries(editValues)) {
      const existing = settings.find((s) => s.key === key);
      if (existing && existing.value !== value) {
        const { error } = await supabase.from('settings').update({ value }).eq('id', existing.id);
        if (error) failedKeys.push(key);
      }
    }
    setSaving(false);
    if (failedKeys.length > 0) {
      showToast(`Failed to save: ${failedKeys.join(', ')}`, 'error');
      return;
    }
    showToast('Settings saved successfully', 'success');
  }

  async function handleSaveLegal(e: React.FormEvent) {
    e.preventDefault();
    if (!legalForm.slug.trim() || !legalForm.title.trim()) {
      showToast('Slug and title are required', 'error');
      return;
    }
    if (editingLegal) {
      const { error } = await supabase.from('legal_pages').update({
        title: legalForm.title.trim(),
        content: legalForm.content.trim(),
      }).eq('id', editingLegal.id);
      if (error) { showToast('Failed to update legal page', 'error'); return; }
      setLegalPages(legalPages.map((p) => p.id === editingLegal.id ? { ...p, title: legalForm.title, content: legalForm.content } : p));
      showToast('Legal page updated', 'success');
    } else {
      const { data, error } = await supabase.from('legal_pages').insert({
        slug: legalForm.slug.trim().toLowerCase(),
        title: legalForm.title.trim(),
        content: legalForm.content.trim(),
      }).select('*').single();
      if (error) { showToast('Failed to create legal page', 'error'); return; }
      setLegalPages([...legalPages, data as LegalPage]);
      showToast('Legal page created', 'success');
    }
    setLegalForm({ slug: '', title: '', content: '' });
    setEditingLegal(null);
    setShowLegalForm(false);
  }

  async function handleDeleteLegal(id: string) {
    if (!confirm('Delete this legal page?')) return;
    const { error } = await supabase.from('legal_pages').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    setLegalPages(legalPages.filter((p) => p.id !== id));
    showToast('Legal page deleted', 'success');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'settings' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Site Settings
        </button>
        <button
          onClick={() => setTab('legal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'legal' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Legal Pages
        </button>
      </div>

      {tab === 'settings' && (
        <Card className="p-6">
          <div className="space-y-4">
            {settings.map((s) => (
              <Input
                key={s.id}
                label={s.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                value={editValues[s.key] || ''}
                onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })}
              />
            ))}
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'} <Save className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {tab === 'legal' && (
        <div>
          <div className="mb-4">
            <Button onClick={() => { setShowLegalForm(!showLegalForm); setEditingLegal(null); setLegalForm({ slug: '', title: '', content: '' }); }}>
              <Plus className="w-4 h-4" /> Add Legal Page
            </Button>
          </div>

          {showLegalForm && (
            <Card className="p-6 mb-6">
              <form onSubmit={handleSaveLegal} className="space-y-4">
                <Input label="Slug (URL)" value={legalForm.slug} onChange={(e) => setLegalForm({ ...legalForm, slug: e.target.value })} placeholder="privacy-policy" disabled={!!editingLegal} />
                <Input label="Title" value={legalForm.title} onChange={(e) => setLegalForm({ ...legalForm, title: e.target.value })} placeholder="Privacy Policy" />
                <Textarea label="Content" value={legalForm.content} onChange={(e) => setLegalForm({ ...legalForm, content: e.target.value })} rows={8} />
                <div className="flex gap-2">
                  <Button type="submit">{editingLegal ? 'Update' : 'Create'} Page</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowLegalForm(false); setEditingLegal(null); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {legalPages.length === 0 ? (
            <Card><EmptyState icon={<FileText className="w-12 h-12" />} title="No legal pages yet" /></Card>
          ) : (
            <div className="space-y-3">
              {legalPages.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-400">/{p.slug} • Updated {formatDate(p.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingLegal(p);
                        setLegalForm({ slug: p.slug, title: p.title, content: p.content });
                        setShowLegalForm(true);
                      }}>Edit</Button>
                      <button onClick={() => handleDeleteLegal(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
