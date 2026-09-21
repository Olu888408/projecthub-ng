export type UserRole = 'student' | 'admin';

export type ProjectStatus =
  | 'request_submitted'
  | 'under_review'
  | 'consultation'
  | 'in_progress'
  | 'awaiting_info'
  | 'presentation_prep'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  university: string | null;
  department: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  package_id: string | null;
  service_id: string | null;
  status: ProjectStatus;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  university: string | null;
  department: string | null;
  course: string | null;
  level: string | null;
  supervisor: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  package?: Package;
  service?: Service;
}

export interface ProjectStatusHistory {
  id: string;
  project_id: string;
  old_status: ProjectStatus | null;
  new_status: ProjectStatus;
  changed_by: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  package_id: string | null;
  paystack_reference: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  project?: Project;
  task?: Task;
}

export type TaskStatus = 'pending' | 'reviewing' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  course: string | null;
  department: string | null;
  category: string;
  description: string | null;
  deadline: string | null;
  budget: number | null;
  status: TaskStatus;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string | null;
  task_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  university: string;
  content: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
