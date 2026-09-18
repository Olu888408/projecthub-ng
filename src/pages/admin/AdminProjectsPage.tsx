import { useEffect, useState } from 'react';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Card, Badge, Spinner, EmptyState, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate } from '@/lib/utils';
import type { Project } from '@/types/database';

export function AdminProjectsPage() {
  const { navigate } = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('*, package:packages(*), service:services(*)')
        .order('created_at', { ascending: false });
      if (data) setProjects(data as Project[]);
      setLoading(false);
    })();
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <h1 className="font-serif text-2xl text-slate-900 mb-6">Manage Projects</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
          <option value="">All Statuses</option>
          <option value="request_submitted">Request Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="consultation">Consultation</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_info">Awaiting Student Info</option>
          <option value="presentation_prep">Presentation Prep</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText className="w-12 h-12" />} title="No projects found" description="Try adjusting your search or filters." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Card key={project.id} className="p-5 hover:border-slate-300 transition-colors cursor-pointer">
              <div onClick={() => navigate(`/admin/projects/${project.id}`)} className="flex items-center justify-between">
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
