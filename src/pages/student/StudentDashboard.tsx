import { useEffect, useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate } from '@/lib/utils';
import type { Project } from '@/types/database';

export function StudentDashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('projects')
        .select('*, package:packages(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setProjects(data as Project[]);
        const active = ['in_progress', 'under_review', 'consultation', 'awaiting_info', 'presentation_prep'];
        setStats({
          total: data.length,
          pending: data.filter((p) => p.status === 'request_submitted').length,
          inProgress: data.filter((p) => active.includes(p.status)).length,
          completed: data.filter((p) => p.status === 'completed').length,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  const statCards = [
    { icon: FileText, label: 'Total Projects', value: stats.total, color: 'text-teal-600 bg-teal-50' },
    { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-amber-600 bg-amber-50' },
    { icon: TrendingUp, label: 'In Progress', value: stats.inProgress, color: 'text-blue-600 bg-blue-50' },
    { icon: CheckCircle, label: 'Completed', value: stats.completed, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Welcome back, {profile?.full_name || 'Student'}</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Projects</h2>
      {projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No projects yet"
            description="Submit your first project to get started with academic assistance."
            action={<Button onClick={() => navigate('/projects/new')}>Create Your First Project</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <Card key={project.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" >
              <div onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{project.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">{project.description || 'No description'}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{formatDate(project.created_at)}</span>
                    {project.package && <span>• {project.package.title}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge className={statusColors(project.status)}>{statusLabel(project.status)}</Badge>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
