import { useEffect, useState } from 'react';
import { Plus, Search, ClipboardList, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, Spinner, EmptyState, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { taskStatusColors, taskStatusLabel, formatDate, TASK_CATEGORIES } from '@/lib/utils';
import type { Task } from '@/types/database';

export function TasksListPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTasks(data as Task[]);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    const prefill = sessionStorage.getItem('prefill_task_category');
    if (prefill) {
      setCategoryFilter(prefill);
      sessionStorage.removeItem('prefill_task_category');
    }
  }, []);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.title.toLowerCase().includes(q) || (t.course ?? '').toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-slate-900">Small Projects &amp; Assignments</h1>
        <Button onClick={() => { if (categoryFilter) sessionStorage.setItem('prefill_task_category', categoryFilter); navigate('/tasks/new'); }}>
          <Plus className="w-4 h-4" /> Post a Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, course, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">All Categories</option>
          {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-12 h-12" />}
            title={tasks.length === 0 ? 'No small projects or assignments yet.' : 'No tasks match your search.'}
            description={tasks.length === 0 ? 'Post a task to get help with an assignment, mini-project, or practical.' : undefined}
            action={tasks.length === 0 ? <Button onClick={() => navigate('/tasks/new')}>Post a Task</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Card key={task.id} className="p-5 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{task.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">{task.description || 'No description'}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{task.category}</span>
                    {task.course && <span>• {task.course}</span>}
                    {task.deadline && <span>• Due {formatDate(task.deadline)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge className={taskStatusColors(task.status)}>{taskStatusLabel(task.status)}</Badge>
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
