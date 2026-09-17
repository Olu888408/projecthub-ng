import { useEffect, useState } from 'react';
import { FileText, Users, TrendingUp, Clock, DollarSign, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Card, Spinner, Badge } from '@/components/ui';
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
        supabase.from('projects').select('*, package:packages(*)').order('created_at', { ascending: false }).limit(5),
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

  const statCards = [
    { icon: FileText, label: 'Total Projects', value: stats.totalProjects, color: 'text-teal-600 bg-teal-50' },
    { icon: Clock, label: 'Pending Review', value: stats.pendingProjects, color: 'text-amber-600 bg-amber-50' },
    { icon: TrendingUp, label: 'Active Projects', value: stats.activeProjects, color: 'text-blue-600 bg-blue-50' },
    { icon: Users, label: 'Students', value: stats.totalStudents, color: 'text-purple-600 bg-purple-50' },
    { icon: DollarSign, label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`p-5 ${stat.label === 'Revenue' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={stat.label === 'Revenue' ? () => navigate('/admin/payments') : undefined}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
            <button onClick={() => navigate('/admin/projects')} className="text-sm text-teal-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentProjects.length === 0 ? (
              <Card className="p-6 text-center text-sm text-slate-500">No projects yet</Card>
            ) : (
              recentProjects.map((p) => (
                <Card key={p.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" >
                  <div onClick={() => navigate(`/admin/projects/${p.id}`)}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 truncate">{p.title}</p>
                      <Badge className={statusColors(p.status)}>{statusLabel(p.status)}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(p.created_at)}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Contact Messages</h2>
            <button onClick={() => navigate('/admin/messages')} className="text-sm text-teal-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentMessages.length === 0 ? (
              <Card className="p-6 text-center text-sm text-slate-500">No contact messages</Card>
            ) : (
              recentMessages.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{m.name}</p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(m.created_at)}</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 truncate">{m.message}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}