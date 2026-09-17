import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Card, Spinner, EmptyState, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types/database';

export function NotificationsPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data as Notification[]);
      setLoading(false);
    })();
  }, [user]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    setNotifications(notifications.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {notifications.some((n) => !n.read_at) && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="w-12 h-12" />} title="No notifications" description="You're all caught up!" />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.read_at ? 'border-teal-200 bg-teal-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read_at ? 'bg-teal-500' : 'bg-slate-300'}`} />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  {n.message && <p className="text-sm text-slate-600 mt-1">{n.message}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    {n.link && (
                      <button onClick={() => navigate(n.link)} className="text-xs text-teal-600 hover:underline">
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
