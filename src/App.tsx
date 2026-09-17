import { useEffect } from 'react';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { Spinner } from '@/components/ui';

import { LandingPage } from '@/pages/public/LandingPage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import { PackagesPage } from '@/pages/public/PackagesPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { LegalPage } from '@/pages/public/LegalPage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { FAQPage } from '@/pages/public/FAQPage';

import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { NewProjectPage } from '@/pages/student/NewProjectPage';
import { ProjectDetailPage } from '@/pages/student/ProjectDetailPage';
import { ProfilePage } from '@/pages/student/ProfilePage';
import { NotificationsPage } from '@/pages/student/NotificationsPage';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage';
import { AdminProjectDetailPage } from '@/pages/admin/AdminProjectDetailPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminMessagesPage } from '@/pages/admin/AdminMessagesPage';
import { AdminTestimonialsPage } from '@/pages/admin/AdminTestimonialsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage';
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage';
import { AdminPackagesPage } from '@/pages/admin/AdminPackagesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (!loading && !user) navigate('/signin');
  }, [loading, user, navigate]);
  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><Spinner className="h-8 w-8" /></div>;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) navigate('/');
  }, [loading, user, profile, navigate]);
  if (loading || !user || profile?.role !== 'admin') return <div className="flex items-center justify-center min-h-screen"><Spinner className="h-8 w-8" /></div>;
  return <>{children}</>;
}

function AuthRedirect({ isAdmin }: { isAdmin: boolean }) {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate(isAdmin ? '/admin' : '/dashboard');
  }, [isAdmin, navigate]);
  return <div className="flex items-center justify-center min-h-screen"><Spinner className="h-8 w-8" /></div>;
}

function Routes() {
  const { path } = useRouter();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner className="h-8 w-8" /></div>;
  }

  const parts = path.split('/').filter(Boolean);

  // Public routes
  if (path === '/' || path === '') return <LandingPage />;
  if (path === '/services') return <ServicesPage />;
  if (path === '/packages') return <PackagesPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/how-it-works') return <HowItWorksPage />;
  if (path === '/faq') return <FAQPage />;
  if (path === '/contact') return <ContactPage />;
  if (parts[0] === 'legal' && parts[1]) return <LegalPage />;
  if (parts[0] === 'privacy') return <LegalPage />;
  if (parts[0] === 'terms') return <LegalPage />;
  if (parts[0] === 'refund-policy') return <LegalPage />;
  if (parts[0] === 'academic-integrity') return <LegalPage />;

  // Auth routes
  if (path === '/signin' || path === '/signup') {
    if (user) return <AuthRedirect isAdmin={profile?.role === 'admin'} />;
    return path === '/signin' ? <SignInPage /> : <SignUpPage />;
  }
  if (path === '/reset-password') return <ResetPasswordPage />;

  // Student routes (protected)
  if (path === '/dashboard') return <ProtectedRoute><StudentDashboard /></ProtectedRoute>;
  if (path === '/projects/new') return <ProtectedRoute><NewProjectPage /></ProtectedRoute>;
  if (parts[0] === 'projects' && parts[1]) return <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>;
  if (path === '/profile') return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
  if (path === '/notifications') return <ProtectedRoute><NotificationsPage /></ProtectedRoute>;

  // Admin routes (protected + admin role)
  if (path === '/admin') return <AdminRoute><AdminDashboard /></AdminRoute>;
  if (path === '/admin/projects') return <AdminRoute><AdminProjectsPage /></AdminRoute>;
  if (parts[0] === 'admin' && parts[1] === 'projects' && parts[2]) return <AdminRoute><AdminProjectDetailPage /></AdminRoute>;
  if (path === '/admin/payments') return <AdminRoute><AdminPaymentsPage /></AdminRoute>;
  if (path === '/admin/messages') return <AdminRoute><AdminMessagesPage /></AdminRoute>;
  if (path === '/admin/students') return <AdminRoute><AdminStudentsPage /></AdminRoute>;
  if (path === '/admin/services') return <AdminRoute><AdminServicesPage /></AdminRoute>;
  if (path === '/admin/packages') return <AdminRoute><AdminPackagesPage /></AdminRoute>;
  if (path === '/admin/testimonials') return <AdminRoute><AdminTestimonialsPage /></AdminRoute>;
  if (path === '/admin/settings') return <AdminRoute><AdminSettingsPage /></AdminRoute>;

  // 404
  return (
    <div className="container-page py-24 text-center flex flex-col items-center">
      <p className="text-sm font-semibold text-teal-600 mb-2">404</p>
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600 max-w-sm">The page you're looking for doesn't exist or may have been moved.</p>
      <a href="#/" className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-6 py-3 text-base bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800">
        Back to Home
      </a>
    </div>
  );
}

function AppContent() {
  const { path } = useRouter();
  const { user, profile } = useAuth();

  const parts = path.split('/').filter(Boolean);
  const isAdminArea = parts[0] === 'admin';
  const isAuthArea = path === '/signin' || path === '/signup' || path === '/reset-password';
  const showChrome = !isAdminArea && !isAuthArea;

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome && <Navbar />}
      <main className="flex-1">
        <Routes />
      </main>
      {showChrome && <Footer />}
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;