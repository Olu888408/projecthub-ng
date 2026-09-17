import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Profile, Project } from '@/types/database';

export function AdminStudentsPage() {
  const { navigate } = useRouter();
  const [students, setStudents] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Record<string, Project[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data: studentData } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
      if (studentData) setStudents(studentData as Profile[]);

      if (studentData && studentData.length > 0) {
        const { data: projectData } = await supabase.from('projects').select('*').in('user_id', studentData.map((s) => s.id));
        if (projectData) {
          const byUser: Record<string, Project[]> = {};
          (projectData as Project[]).forEach((p) => {
            if (!byUser[p.user_id]) byUser[p.user_id] = [];
            byUser[p.user_id].push(p);
          });
          setProjects(byUser);
        }
      }
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter((s) =>
    !search ||
    (s.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.university ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Students</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or university..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Users className="w-12 h-12" />} title="No students found" /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const studentProjects = projects[student.id] || [];
            return (
              <Card key={student.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-medium">
                        {student.full_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.full_name || 'Unnamed'}</p>
                        <p className="text-sm text-slate-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-sm">
                      <div><span className="text-slate-400">University:</span> <span className="text-slate-700">{student.university || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Department:</span> <span className="text-slate-700">{student.department || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{student.phone || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Joined:</span> <span className="text-slate-700">{formatDate(student.created_at)}</span></div>
                      <div><span className="text-slate-400">Projects:</span> <span className="text-slate-700">{studentProjects.length}</span></div>
                    </div>
                  </div>
                </div>
                {studentProjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {studentProjects.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <button onClick={() => navigate(`/admin/projects/${p.id}`)} className="text-teal-600 hover:underline truncate">
                          {p.title}
                        </button>
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
