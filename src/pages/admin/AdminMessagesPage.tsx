import { useEffect, useState } from 'react';
import { Mail, Trash2, Search } from 'lucide-react';
import { Card, Spinner, EmptyState } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { ContactMessage } from '@/types/database';

export function AdminMessagesPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (data) setMessages(data as ContactMessage[]);
      setLoading(false);
    })();
  }, []);

  const filtered = messages.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.message.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete message', 'error');
      return;
    }
    setMessages(messages.filter((m) => m.id !== id));
    showToast('Message deleted', 'success');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contact Messages</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Mail className="w-12 h-12" />} title="No messages found" /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{m.name}</p>
                    <span className="text-xs text-slate-400">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{m.email}{m.phone && ` • ${m.phone}`}</p>
                  {m.subject && <p className="text-sm font-medium text-slate-700 mt-2">{m.subject}</p>}
                  <p className="text-sm text-slate-600 mt-1">{m.message}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
