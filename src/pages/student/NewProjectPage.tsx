import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send, Upload, X, FileText, Loader2 } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card, Input, Textarea, Select, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateFile, sanitizeFilename, formatFileSize } from '@/lib/utils';
import type { Package, Service } from '@/types/database';

interface UploadedFile {
  file: File;
  uploading: boolean;
  path?: string;
  error?: string;
}

export function NewProjectPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    packageId: '',
    serviceId: '',
    university: '',
    department: '',
    course: '',
    level: '',
    supervisor: '',
    deadline: '',
  });

  useEffect(() => {
    (async () => {
      const [{ data: pkgData }, { data: svcData }] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
        supabase.from('services').select('*').eq('active', true).order('name'),
      ]);
      if (pkgData) setPackages(pkgData as Package[]);
      if (svcData) setServices(svcData as Service[]);
      if (profile) {
        setForm((f) => ({ ...f, university: profile.university || '', department: profile.department || '' }));
      }
      setLoading(false);
    })();
  }, [profile]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(`${file.name}: ${validation.error}`, 'error');
        continue;
      }
      setFiles((prev) => [...prev, { file, uploading: false }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadFiles(projectId: string, userId: string) {
    const completed: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) => prev.map((f, j) => j === i ? { ...f, uploading: true } : f));
      const file = files[i].file;
      const safeName = sanitizeFilename(file.name);
      const filePath = `${projectId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
      if (uploadError) {
        setFiles((prev) => prev.map((f, j) => j === i ? { ...f, uploading: false, error: 'Upload failed' } : f));
        continue;
      }
      const { error: insertError } = await supabase.from('project_files').insert({
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userId,
      });
      if (insertError) {
        // Roll back the storage upload so it doesn't sit there orphaned
        // with no database record pointing to it.
        await supabase.storage.from('project-files').remove([filePath]);
        setFiles((prev) => prev.map((f, j) => j === i ? { ...f, uploading: false, error: 'Upload failed' } : f));
        continue;
      }
      setFiles((prev) => prev.map((f, j) => j === i ? { ...f, uploading: false, path: filePath } : f));
      completed.push(files[i]);
    }
    return completed.length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || form.title.trim().length < 5) {
      showToast('Title must be at least 5 characters', 'error');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      showToast('Description must be at least 20 characters', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please confirm the academic integrity agreement', 'error');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      package_id: form.packageId || null,
      service_id: form.serviceId || null,
      university: form.university.trim(),
      department: form.department.trim(),
      course: form.course.trim(),
      level: form.level.trim(),
      supervisor: form.supervisor.trim(),
      deadline: form.deadline || null,
    }).select('id').single();
    if (error) {
      showToast('Failed to create project. Please try again.', 'error');
      setSubmitting(false);
      return;
    }
    if (files.length > 0) {
      await uploadFiles(data.id, user.id);
    }
    showToast('Project created successfully!', 'success');
    navigate(`/projects/${data.id}`);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <h1 className="font-serif text-2xl text-slate-900 mb-6">Submit a New Project</h1>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Design and Implementation of an Online Banking System"
            maxLength={200}
          />
          <Textarea
            label="Project Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your project requirements, objectives, and any specific details..."
            rows={5}
            maxLength={5000}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="University"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              placeholder="e.g., University of Lagos"
              maxLength={200}
            />
            <Input
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g., Computer Science"
              maxLength={200}
            />
            <Input
              label="Course / Program"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="e.g., BSc Computer Science"
              maxLength={200}
            />
            <Select
              label="Academic Level"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="">Select level</option>
              <option value="ND">ND</option>
              <option value="HND">HND</option>
              <option value="BSc">BSc / BEng</option>
              <option value="PGD">PGD</option>
              <option value="MSc">MSc / MEng</option>
              <option value="PhD">PhD</option>
            </Select>
            <Input
              label="Supervisor (optional)"
              value={form.supervisor}
              onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
              placeholder="e.g., Dr. A. Adeyemi"
              maxLength={200}
            />
            <Input
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <Select
            label="Select Service"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          >
            <option value="">No service selected</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>{svc.name} ({svc.category})</option>
            ))}
          </Select>

          <Select
            label="Select Package"
            value={form.packageId}
            onChange={(e) => setForm({ ...form, packageId: e.target.value })}
          >
            <option value="">No package selected</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>{pkg.title} — ₦{pkg.price.toLocaleString()}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload Files</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Click to upload files</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, CSV, TXT, JPG, PNG (max 50MB)</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png" />
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{f.file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(f.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.uploading && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
                      {f.error && <span className="text-xs text-red-600">{f.error}</span>}
                      {!f.uploading && (
                        <button type="button" onClick={() => removeFile(i)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
            />
            <span className="text-sm text-slate-700">
              I confirm that I will use the services responsibly and in accordance with my institution's academic rules. I understand that ProjectHub NG provides research support, guidance, and consultation, and does not support plagiarism, fabricated research, or academic misconduct.
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={submitting || !agreed}>
            {submitting ? 'Creating...' : 'Submit Project'} <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
