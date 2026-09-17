import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Save, History, User, FileText, Upload, Download, Trash2, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from '@/components/RouteHelpers';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, Spinner, Select, Textarea, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate, formatFileSize, validateFile, sanitizeFilename } from '@/lib/utils';
import type { Project, ProjectStatusHistory, Profile, ProjectStatus, ProjectFile } from '@/types/database';

export function AdminProjectDetailPage() {
  const { id } = useParams();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<ProjectStatusHistory[]>([]);
  const [student, setStudent] = useState<Profile | null>(null);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: projData }, { data: histData }, { data: adminData }, { data: fileData }] = await Promise.all([
        supabase.from('projects').select('*, package:packages(*), service:services(*)').eq('id', id).maybeSingle(),
        supabase.from('project_status_history').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'admin'),
        supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      if (projData) {
        const proj = projData as Project;
        setProject(proj);
        setNewStatus(proj.status);
        setAdminNotes(proj.admin_notes || '');
        setAssignedAdmin(proj.assigned_admin_id || '');
        if (proj.user_id) {
          const { data: studentData } = await supabase.from('profiles').select('*').eq('id', proj.user_id).maybeSingle();
          if (studentData) setStudent(studentData as Profile);
        }
      }
      if (histData) setHistory(histData as ProjectStatusHistory[]);
      if (adminData) setAdmins(adminData as Profile[]);
      if (fileData) setFiles(fileData as ProjectFile[]);
      setLoading(false);
    })();
  }, [id]);

  async function handleSendWhatsApp() {
    if (!student?.phone || !project) return;
    const message = prompt(`Message to send to ${student.full_name} via WhatsApp:`, `Hi ${student.full_name}, update on your project "${project.title}": `);
    if (!message || !message.trim()) return;
    setSendingWhatsApp(true);
    const { error } = await supabase.functions.invoke('whatsapp-send', {
      body: { phone: student.phone, message: message.trim() },
    });
    setSendingWhatsApp(false);
    if (error) {
      showToast('Failed to send WhatsApp message', 'error');
      return;
    }
    showToast('WhatsApp message sent', 'success');
  }

  async function refreshFiles() {
    if (!id) return;
    const { data } = await supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (data) setFiles(data as ProjectFile[]);
  }

  async function handleUploadDeliverable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !project || !user) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    const safeName = sanitizeFilename(file.name);
    const filePath = `${project.id}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
    if (uploadError) {
      showToast('Failed to upload file', 'error');
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('project_files').insert({
      project_id: project.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
    });

    setUploading(false);
    if (dbError) {
      // Roll back the storage upload so we don't leave an orphaned file
      // with no database record pointing to it.
      await supabase.storage.from('project-files').remove([filePath]);
      showToast('Failed to save file record', 'error');
      return;
    }

    showToast('Deliverable uploaded successfully', 'success');
    await refreshFiles();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDownload(file: ProjectFile) {
    const { data, error } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 3600);
    if (error || !data) {
      showToast('Failed to generate download link', 'error');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleDeleteFile(file: ProjectFile) {
    if (!confirm(`Delete "${file.file_name}"? This cannot be undone.`)) return;
    const { error: storageError } = await supabase.storage.from('project-files').remove([file.file_path]);
    if (storageError) {
      showToast('Failed to delete file from storage', 'error');
      return;
    }
    const { error: dbError } = await supabase.from('project_files').delete().eq('id', file.id);
    if (dbError) {
      showToast('Failed to delete file record', 'error');
      return;
    }
    showToast('File deleted', 'success');
    setFiles(files.filter((f) => f.id !== file.id));
  }

  async function handleSave() {
    if (!project || !id || !user) return;
    setSaving(true);
    const updates: Record<string, string | null> = {};
    const statusChanged = newStatus !== project.status;
    if (statusChanged) updates.status = newStatus;
    if (adminNotes !== (project.admin_notes || '')) updates.admin_notes = adminNotes;
    if (assignedAdmin !== (project.assigned_admin_id || '')) updates.assigned_admin_id = assignedAdmin || null;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) {
        showToast('Failed to update project', 'error');
        setSaving(false);
        return;
      }
      // Only log status history after the project row itself was actually
      // updated successfully — logging first could record a status change
      // that never really happened if the update above had failed.
      if (statusChanged) {
        await supabase.from('project_status_history').insert({
          project_id: id,
          old_status: project.status,
          new_status: newStatus as ProjectStatus,
          changed_by: user.id,
        });
      }
      setProject({ ...project, ...updates } as Project);
    }
    setSaving(false);
    showToast('Project updated successfully', 'success');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (!project) {
    return <div className="container-page py-20"><EmptyState icon={<User className="w-12 h-12" />} title="Project not found" action={<Button onClick={() => navigate('/admin/projects')}>Back to Projects</Button>} /></div>;
  }

  return (
    <div className="container-page py-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/admin/projects')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${id}`)}>
          <MessageCircle className="w-4 h-4" /> Message Student
        </Button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <p className="text-sm text-slate-500 mt-1">Created on {formatDate(project.created_at)}</p>
        </div>
        <Badge className={statusColors(project.status)}>{statusLabel(project.status)}</Badge>
      </div>

      {project.description && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
          <p className="text-slate-600 whitespace-pre-line">{project.description}</p>
        </Card>
      )}

      {student && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><User className="w-4 h-4" /> Student Information</h3>
            {student.phone && (
              <Button size="sm" variant="outline" onClick={handleSendWhatsApp} disabled={sendingWhatsApp}>
                <MessageCircle className="w-3.5 h-3.5" /> {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp Update'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{student.full_name}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{student.email}</span></div>
            <div><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{student.phone || 'N/A'}</span></div>
            <div><span className="text-slate-500">University:</span> <span className="font-medium text-slate-900">{student.university || 'N/A'}</span></div>
            <div><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-900">{student.department || 'N/A'}</span></div>
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Project Management</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
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
            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} placeholder="Internal notes about this project..." maxLength={5000} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
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
          <p className="text-sm text-slate-500">No files uploaded yet — neither student documents nor deliverables.</p>
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
                  <button onClick={() => handleDownload(file)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded" aria-label={`Download ${file.file_name}`}>
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

      {history.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Status History</h3>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-slate-600">
                  Changed from <span className="font-medium">{h.old_status ? statusLabel(h.old_status) : 'New'}</span> to <span className="font-medium">{statusLabel(h.new_status)}</span>
                </span>
                <span className="text-slate-400 text-xs">{formatDate(h.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
