import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Upload, Download, Trash2, MessageSquare, FileText, Send, CreditCard, History, Loader2 } from 'lucide-react';
import { useParams, useRouter } from '@/components/RouteHelpers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate, formatFileSize, validateFile, sanitizeFilename } from '@/lib/utils';
import type { Project, ProjectFile, Message, ProjectStatusHistory, Payment, Package } from '@/types/database';

export function ProjectDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ProjectStatusHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pkg, setPkg] = useState<Package | null>(null);
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
      const [{ data: projData }, { data: fileData }, { data: msgData }, { data: histData }, { data: payData }] = await Promise.all([
        supabase.from('projects').select('*, package:packages(*)').eq('id', id).maybeSingle(),
        supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('project_status_history').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      if (projData) {
        setProject(projData as Project);
        if (projData.package) setPkg(projData.package as Package);
      }
      if (fileData) setFiles(fileData as ProjectFile[]);
      if (msgData) setMessages(msgData as Message[]);
      if (histData) setHistory(histData as ProjectStatusHistory[]);
      if (payData) setPayments(payData as Payment[]);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !project || !user) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
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
      showToast('Failed to save file record', 'error');
      return;
    }
    showToast('File uploaded successfully', 'success');
    const { data } = await supabase.from('project_files').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    if (data) setFiles(data as ProjectFile[]);
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
    if (!confirm('Are you sure you want to delete this file?')) return;
    await supabase.storage.from('project-files').remove([file.file_path]);
    await supabase.from('project_files').delete().eq('id', file.id);
    setFiles(files.filter((f) => f.id !== file.id));
    showToast('File deleted', 'success');
  }

  async function handleBankTransferSubmit() {
    if (!project || !user) return;
    const pkgPrice = pkg ? Number(pkg.price) : 0;
    if (pkgPrice <= 0) {
      showToast('Please select a package with a price to pay', 'error');
      return;
    }
    setPaying(true);
    const { error } = await supabase.from('payments').insert({
      project_id: project.id,
      user_id: user.id,
      amount: pkgPrice,
      currency: 'NGN',
      package_id: project.package_id,
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
    const { data: payData } = await supabase.from('payments').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (payData) setPayments(payData as Payment[]);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !project || !user) return;
    setSendingMessage(true);
    const recipientId = isAdmin ? project.user_id : (project.assigned_admin_id || null);
    const { data, error } = await supabase.from('messages').insert({
      project_id: project.id,
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

  if (!project) {
    return (
      <div className="container-page py-20">
        <EmptyState icon={<FileText className="w-12 h-12" />} title="Project not found" action={<Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <button onClick={() => navigate(isAdmin ? '/admin/projects' : '/dashboard')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

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

      {pkg && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Package</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{pkg.title}</p>
              <p className="text-sm text-slate-500">{pkg.description}</p>
            </div>
            <p className="text-lg font-bold text-slate-900">₦{pkg.price.toLocaleString()}</p>
          </div>
          {!isAdmin && (
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
                className="w-full mb-3 px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              <Button onClick={handleBankTransferSubmit} disabled={paying} variant="outline" className="w-full">
                {paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> I've Sent ₦{pkg.price.toLocaleString()}</>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-2">We'll confirm your payment and update your project status shortly.</p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files */}
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
                      <p className="text-xs text-slate-400">{formatFileSize(file.file_size)} • {isOwnUpload ? 'your upload' : 'deliverable from team'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDownload(file)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded">
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

        {/* Messages */}
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
                  <div className={`max-w-[75%] px-4 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
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
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              maxLength={1000}
            />
            <Button type="submit" size="sm" disabled={sendingMessage || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>

      {/* Status History */}
      {history.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-4 h-4" /> Status History
          </h3>
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

      {/* Payments */}
      {payments.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payments
          </h3>
          <div className="space-y-2">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">₦{pay.amount.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{pay.paystack_reference || 'No reference'}</p>
                </div>
                <Badge className={statusColors(pay.status)}>{statusLabel(pay.status)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}