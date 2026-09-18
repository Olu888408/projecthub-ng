import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Spinner, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate, formatCurrency } from '@/lib/utils';
import type { Project, ContactMessage } from '@/types/database';

export function AdminDashboard() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProjects: 0, pendingProjects: 0, totalStudents: 0, totalRevenue: 0, activeProjects: 0 });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { data: projects },
        { count: studentCount },
        { data: payments },
        { data: contactMsgs },
        { count: totalProjects },
        { count: pendingProjects },
        { count: activeProjects },
      ] = await Promise.all([
        supabase.from('projects').select('*, package:packages(*)').order('created_at', { ascending: false }).limit(6),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('payments').select('amount').eq('status', 'success'),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'request_submitted'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['in_progress', 'under_review', 'consultation', 'awaiting_info', 'presentation_prep']),
      ]);

      setStats({
        totalProjects: totalProjects || 0,
        pendingProjects: pendingProjects || 0,
        totalStudents: studentCount || 0,
        totalRevenue: (payments || []).reduce((sum, p) => sum + Number(p.amount), 0),
        activeProjects: activeProjects || 0,
      });
      setRecentProjects((projects || []) as Project[]);
      setRecentMessages((contactMsgs || []) as ContactMessage[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  const statItems = [
    { label: 'Total projects', value: stats.totalProjects },
    { label: 'Awaiting review', value: stats.pendingProjects },
    { label: 'Active', value: stats.activeProjects },
    { label: 'Students', value: stats.totalStudents },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), onClick: () => navigate('/admin/payments') },
  ];

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden mb-8">
        {statItems.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white p-4 ${stat.onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
            onClick={stat.onClick}
          >
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="mt-1 text-xl font-serif text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent projects</h2>
            <button onClick={() => navigate('/admin/projects')} className="text-sm text-teal-700 hover:underline">View all</button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 border-y border-slate-200 text-center">No projects yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/projects/${p.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-900 max-w-[220px] truncate">{p.title}</td>
                    <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="py-2.5 text-right">
                      <Badge className={statusColors(p.status)}>{statusLabel(p.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Contact messages</h2>
            <button onClick={() => navigate('/admin/messages')} className="text-sm text-teal-700 hover:underline">View all</button>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 border-y border-slate-200 text-center">No messages</p>
          ) : (
            <div className="border-t border-slate-200">
              {recentMessages.map((m) => (
                <div key={m.id} className="py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">{m.name}</p>
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 truncate">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
