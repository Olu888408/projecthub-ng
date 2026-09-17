import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function statusColors(status: string): string {
  const colors: Record<string, string> = {
    request_submitted: 'bg-amber-100 text-amber-800 border-amber-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    consultation: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
    await_info: 'bg-orange-100 text-orange-800 border-orange-200',
    awaiting_info: 'bg-orange-100 text-orange-800 border-orange-200',
    presentation_prep: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    review: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    request_submitted: 'Request Submitted',
    under_review: 'Under Review',
    consultation: 'Consultation',
    in_progress: 'In Progress',
    awaiting_info: 'Awaiting Student Info',
    presentation_prep: 'Presentation Prep',
    completed: 'Completed',
    closed: 'Closed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    review: 'Under Review',
    success: 'Successful',
    failed: 'Failed',
  };
  return labels[status] || status;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[+]?[\d\s-]{7,15}$/.test(phone);
}

export const WHATSAPP_NUMBERS = ['2349160661570', '2349073396693'];

export function whatsappLink(message: string, numberIndex: number = 0): string {
  const number = WHATSAPP_NUMBERS[numberIndex] || WHATSAPP_NUMBERS[0];
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith('234')) {
    return '0' + phone.slice(3);
  }
  return phone;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, CSV, TXT, JPG, PNG files are accepted.' };
  }
  return { valid: true };
}
