import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Save, User, FileText, Upload, Download, Trash2, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from '@/components/RouteHelpers';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, Spinner, Select, Textarea, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { taskStatusColors, taskStatusLabel, formatDate, formatFileSize, validateFile, sanitizeFilename } from '@/lib/utils';
import type { Task, Profile, TaskFile } from '@/types/database';

export function AdminTaskDetailPage() {
  const { id } = useParams();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: taskData }, { data: adminData }, { data: fileData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', id).maybeSingle(),
        supabase.from('profiles').select('*').eq('role', 'admin'),
        supabase.from('task_files').select('*').eq('task_id', id).order('created_at', { ascending: false }),
      ]);

      if (taskData) {
        const t = taskData as Task;
        setTask(t);
        setNewStatus(t.status);
        setAdminNotes(t.admin_notes || '');
        setAssignedAdmin(t.assigned_admin_id || '');
        if (t.user_id) {
          const { data: studentData } = await supabase.from('profiles').select('*').eq('id', t.user_id).maybeSingle();
          if (studentData) setStudent(studentData as Profile);
        }
      }
      if (adminData) setAdmins(adminData as Profile[]);
      if (fileData) setFiles(fileData as TaskFile[]);
      setLoading(false);
    })();
  }, [id]);

  async function handleSendWhatsApp() {
    if (!student?.phone || !task) return;
    const message = prompt(`Message to send to ${student.full_name} via WhatsApp:`, `Hi ${student.full_name}, update on your task "${task.title}": `);
    if (!message || !message.trim()) return;
    const { error } = await supabase.functions.invoke('whatsapp-send', {
      body: { phone: student.phone, message: message.trim() },
    });
    if (error) {
      showToast('Failed to send WhatsApp message', 'error');
      return;
    }
    showToast('WhatsApp message sent', 'success');
  }

  async function handleUploadDeliverable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task || !user) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    const safeName = sanitizeFilename(file.name);
    const filePath = `tasks/${task.id}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
    if (uploadError) {
      showToast('Failed to upload file', 'error');
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('task_files').insert({
      task_id: task.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
    });

    setUploading(false);
    if (dbError) {
      await supabase.storage.from('project-files').remove([filePath]);
      showToast('Failed to save file record', 'error');
      return;
    }

    showToast('File uploaded successfully', 'success');
    const { data } = await supabase.from('task_files').select('*').eq('task_id', task.id).order('created_at', { ascending: false });
    if (data) setFiles(data as TaskFile[]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDownload(file: TaskFile) {
    const { data, error } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 3600);
    if (error || !data) {
      showToast('Failed to generate download link', 'error');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleDeleteFile(file: TaskFile) {
    if (!confirm(`Delete "${file.file_name}"? This cannot be undone.`)) return;
    const { error: storageError } = await supabase.storage.from('project-files').remove([file.file_path]);
    if (storageError) {
      showToast('Failed to delete file from storage', 'error');
      return;
    }
    const { error: dbError } = await supabase.from('task_files').delete().eq('id', file.id);
    if (dbError) {
      showToast('Failed to delete file record', 'error');
      return;
    }
    showToast('File deleted', 'success');
    setFiles(files.filter((f) => f.id !== file.id));
  }

  async function handleSave() {
    if (!task || !id) return;
    setSaving(true);
    const updates: Record<string, string | null> = {};
    if (newStatus !== task.status) updates.status = newStatus;
    if (adminNotes !== (task.admin_notes || '')) updates.admin_notes = adminNotes;
    if (assignedAdmin !== (task.assigned_admin_id || '')) updates.assigned_admin_id = assignedAdmin || null;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) {
        showToast('Failed to update task', 'error');
        setSaving(false);
        return;
      }
      setTask({ ...task, ...updates } as Task);
    }
    setSaving(false);
    showToast('Task updated successfully', 'success');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (!task) {
    return <div className="container-page py-20"><EmptyState icon={<User className="w-12 h-12" />} title="Task not found" action={<Button onClick={() => navigate('/admin/tasks')}>Back to Tasks</Button>} /></div>;
  }

  return (
    <div className="container-page py-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/admin/tasks')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/tasks/${id}`)}>
          <MessageCircle className="w-4 h-4" /> Message Student
        </Button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">{task.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{task.category} • Submitted {formatDate(task.created_at)}</p>
        </div>
        <Badge className={taskStatusColors(task.status)}>{taskStatusLabel(task.status)}</Badge>
      </div>

      {task.description && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
          <p className="text-slate-600 whitespace-pre-line">{task.description}</p>
        </Card>
      )}

      {student && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><User className="w-4 h-4" /> Student Information</h3>
            {student.phone && (
              <Button size="sm" variant="outline" onClick={handleSendWhatsApp}>
                <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp Update
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{student.full_name}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{student.email}</span></div>
            <div><span className="text-slate-500">Course:</span> <span className="font-medium text-slate-900">{task.course || 'N/A'}</span></div>
            <div><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-900">{task.department || 'N/A'}</span></div>
            {task.deadline && <div><span className="text-slate-500">Deadline:</span> <span className="font-medium text-slate-900">{formatDate(task.deadline)}</span></div>}
            {task.budget != null && <div><span className="text-slate-500">Budget:</span> <span className="font-medium text-slate-900">₦{Number(task.budget).toLocaleString()}</span></div>}
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Task Management</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned Admin</label>
            <Select value={assignedAdmin} onChange={(e) => setAssignedAdmin(e.target.value)}>
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Notes (internal)</label>
            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} placeholder="Internal notes about this task..." maxLength={5000} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Files
          </h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUploadDeliverable}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Deliverable'} <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-slate-500">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{file.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                    {file.uploaded_by === student?.id ? ' • from student' : ' • deliverable'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => handleDownload(file)} className="p-1.5 text-slate-400 hover:text-teal-700 rounded" aria-label={`Download ${file.file_name}`}>
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteFile(file)} className="p-1.5 text-slate-400 hover:text-red-600 rounded" aria-label={`Delete ${file.file_name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
