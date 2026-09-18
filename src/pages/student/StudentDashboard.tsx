import { useEffect, useState } from 'react';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
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

  const statItems = [
    { label: 'Total projects', value: stats.total },
    { label: 'Awaiting review', value: stats.pending },
    { label: 'In progress', value: stats.inProgress },
    { label: 'Completed', value: stats.completed },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {profile?.full_name || 'Student'}</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-200 mb-8">
        {statItems.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-serif text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="text-sm font-semibold text-slate-700 mb-4">Your projects</h2>
      {projects.length === 0 ? (
        <div className="border border-slate-200 rounded-xl">
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No projects yet"
            description="Submit your first project to get started with academic assistance."
            action={<Button onClick={() => navigate('/projects/new')}>Create Your First Project</Button>}
          />
        </div>
      ) : (
        <div className="border-t border-slate-200">
          {projects.slice(0, 8).map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="w-full flex items-center justify-between py-4 border-b border-slate-200 text-left hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-md"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{project.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{formatDate(project.created_at)}</span>
                  {project.package && <span>· {project.package.title}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <Badge className={statusColors(project.status)}>{statusLabel(project.status)}</Badge>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
