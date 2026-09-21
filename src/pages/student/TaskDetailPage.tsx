import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Upload, Download, Trash2, MessageSquare, FileText, Send, CreditCard, Loader2 } from 'lucide-react';
import { useParams, useRouter } from '@/components/RouteHelpers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { taskStatusColors, taskStatusLabel, formatDate, formatFileSize, validateFile, sanitizeFilename } from '@/lib/utils';
import type { Task, TaskFile, Message, Payment } from '@/types/database';

export function TaskDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [paying, setPaying] = useState(false);
  const [transferReference, setTransferReference] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: taskData }, { data: fileData }, { data: msgData }, { data: payData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', id).maybeSingle(),
        supabase.from('task_files').select('*').eq('task_id', id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').eq('task_id', id).order('created_at', { ascending: true }),
        supabase.from('payments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
      ]);
      if (taskData) setTask(taskData as Task);
      if (fileData) setFiles(fileData as TaskFile[]);
      if (msgData) setMessages(msgData as Message[]);
      if (payData) setPayments(payData as Payment[]);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task || !user) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
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
    if (!confirm('Are you sure you want to delete this file?')) return;
    await supabase.storage.from('project-files').remove([file.file_path]);
    await supabase.from('task_files').delete().eq('id', file.id);
    setFiles(files.filter((f) => f.id !== file.id));
    showToast('File deleted', 'success');
  }

  async function handleBankTransferSubmit() {
    if (!task || !user) return;
    const amount = task.budget ? Number(task.budget) : 0;
    if (amount <= 0) {
      showToast('This task has no budget set to pay against yet', 'error');
      return;
    }
    setPaying(true);
    const { error } = await supabase.from('payments').insert({
      task_id: task.id,
      user_id: user.id,
      amount,
      currency: 'NGN',
      paystack_reference: transferReference.trim() || null,
      status: 'pending',
    });
    setPaying(false);
    if (error) {
      showToast('Failed to record payment. Please try again.', 'error');
      return;
    }
    showToast("Payment submitted! We'll confirm it shortly.", 'success');
    setTransferReference('');
    const { data: payData } = await supabase.from('payments').select('*').eq('task_id', id).order('created_at', { ascending: false });
    if (payData) setPayments(payData as Payment[]);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !task || !user) return;
    setSendingMessage(true);
    const recipientId = isAdmin ? task.user_id : (task.assigned_admin_id || null);
    const { data, error } = await supabase.from('messages').insert({
      task_id: task.id,
      sender_id: user.id,
      recipient_id: recipientId,
      content: newMessage.trim(),
    }).select('*').single();
    setSendingMessage(false);
    if (error) {
      showToast('Failed to send message', 'error');
      return;
    }
    setMessages([...messages, data as Message]);
    setNewMessage('');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (!task) {
    return (
      <div className="container-page py-20">
        <EmptyState icon={<FileText className="w-12 h-12" />} title="Task not found" action={<Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <button onClick={() => navigate(isAdmin ? '/admin/tasks' : '/tasks')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">{task.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{task.category}{task.course ? ` • ${task.course}` : ''} • Submitted {formatDate(task.created_at)}</p>
        </div>
        <Badge className={taskStatusColors(task.status)}>{taskStatusLabel(task.status)}</Badge>
      </div>

      {task.description && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
          <p className="text-slate-600 whitespace-pre-line">{task.description}</p>
        </Card>
      )}

      {(task.deadline || task.budget) && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {task.deadline && <div><span className="text-xs text-slate-400 block">Deadline</span><span className="font-medium text-slate-900">{formatDate(task.deadline)}</span></div>}
            {task.budget != null && <div><span className="text-xs text-slate-400 block">Budget</span><span className="font-medium text-slate-900">₦{Number(task.budget).toLocaleString()}</span></div>}
          </div>
          {!isAdmin && task.budget != null && Number(task.budget) > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">Pay via Bank Transfer</p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600">Bank: <span className="font-medium text-slate-900">OPay</span></p>
                  <p className="text-slate-600">Account Number: <span className="font-medium text-slate-900">9073396693</span></p>
                  <p className="text-slate-600">Account Name: <span className="font-medium text-slate-900">Iluyomade Oluwasegun Jeremiah</span></p>
                </div>
              </div>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Transfer reference / your name (optional)"
                className="w-full mb-3 px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
              <Button onClick={handleBankTransferSubmit} disabled={paying} variant="outline" className="w-full">
                {paying ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>) : (<><CreditCard className="w-4 h-4" /> I've Sent ₦{Number(task.budget).toLocaleString()}</>)}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-2">We'll confirm your payment and update your task status shortly.</p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Files</h3>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" /> Upload
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png" />
          </div>
          {files.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No files uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const isOwnUpload = file.uploaded_by === user?.id;
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.file_name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.file_size)} • {isOwnUpload ? 'your upload' : 'from team'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDownload(file)} className="p-1.5 text-slate-400 hover:text-teal-700 rounded">
                        <Download className="w-4 h-4" />
                      </button>
                      {isOwnUpload && (
                        <button onClick={() => handleDeleteFile(file)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 flex flex-col" style={{ minHeight: '300px' }}>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Messages
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: '300px' }}>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-teal-100' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              maxLength={1000}
            />
            <Button type="submit" size="sm" disabled={sendingMessage || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>

      {payments.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payments
          </h3>
          <div className="space-y-2">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">₦{Number(pay.amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{pay.paystack_reference || 'No reference'}</p>
                </div>
                <Badge className={taskStatusColors(pay.status === 'success' ? 'completed' : pay.status === 'failed' ? 'cancelled' : 'pending')}>{pay.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
