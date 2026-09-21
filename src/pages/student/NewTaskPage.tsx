import { useState, useRef } from 'react';
import { ArrowLeft, Send, Upload, X, FileText, Loader2 } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card, Input, Textarea, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateFile, sanitizeFilename, formatFileSize, TASK_CATEGORIES } from '@/lib/utils';

interface UploadedFile {
  file: File;
  uploading: boolean;
  error?: string;
}

export function NewTaskPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    course: '',
    department: profile?.department || '',
    category: TASK_CATEGORIES[0],
    description: '',
    deadline: '',
    budget: '',
    notes: '',
  });

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

  async function uploadFiles(taskId: string, userId: string) {
    for (const f of files) {
      const safeName = sanitizeFilename(f.file.name);
      const filePath = `tasks/${taskId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, f.file);
      if (uploadError) continue;
      await supabase.from('task_files').insert({
        task_id: taskId,
        file_name: f.file.name,
        file_path: filePath,
        file_size: f.file.size,
        file_type: f.file.type,
        uploaded_by: userId,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || form.title.trim().length < 3) {
      showToast('Task title must be at least 3 characters', 'error');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      showToast('Please describe the task in a bit more detail', 'error');
      return;
    }
    const budgetNum = form.budget ? parseFloat(form.budget) : null;
    if (form.budget && (isNaN(budgetNum!) || budgetNum! < 0)) {
      showToast('Invalid budget amount', 'error');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: form.title.trim(),
      course: form.course.trim(),
      department: form.department.trim(),
      category: form.category,
      description: [form.description.trim(), form.notes.trim() ? `\n\nAdditional notes: ${form.notes.trim()}` : ''].join(''),
      deadline: form.deadline || null,
      budget: budgetNum,
    }).select('id').single();
    if (error) {
      showToast(error.message?.includes('Too many') ? error.message : 'Failed to submit task. Please try again.', 'error');
      setSubmitting(false);
      return;
    }
    if (files.length > 0) {
      await uploadFiles(data.id, user.id);
    }
    showToast('Task submitted successfully!', 'success');
    navigate(`/tasks/${data.id}`);
  }

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate('/tasks')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Small Projects
      </button>

      <h1 className="font-serif text-2xl text-slate-900 mb-6">Post a Task</h1>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Task Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Database Design Assignment"
            maxLength={200}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Code / Name"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="e.g., CSC 301"
              maxLength={100}
            />
            <Input
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g., Computer Science"
              maxLength={200}
            />
          </div>
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Textarea
            label="Description / Instructions *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the task, requirements, and anything the reviewer needs to know..."
            rows={5}
            maxLength={5000}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <Input
              label="Budget in NGN (optional)"
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="e.g., 5000"
            />
          </div>
          <Textarea
            label="Additional Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            maxLength={1000}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Attach Files</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Click to attach files</p>
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
                    <button type="button" onClick={() => removeFile(i)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>) : (<>Submit Task <Send className="w-4 h-4" /></>)}
          </Button>
        </form>
      </Card>
    </div>
  );
}
