import { useEffect, useState } from 'react';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { validateEmail } from '@/lib/utils';

export function ResetPasswordPage() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Fix: complete password-recovery flow. Supabase's client (detectSessionInUrl
  // is on in src/lib/supabase.ts) processes the recovery link's tokens
  // automatically and fires a PASSWORD_RECOVERY auth event — we listen for
  // that to switch into "enter your new password" mode instead of just
  // stopping at "email sent".
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
    });
    setLoading(false);
    if (error) {
      showToast('Failed to send reset email. Please try again.', 'error');
      return;
    }
    setSent(true);
    showToast('Password reset instructions sent to your email.', 'success');
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);
    if (error) {
      showToast(error.message || 'Failed to update password. Please try again.', 'error');
      return;
    }
    setUpdated(true);
    showToast('Password updated successfully.', 'success');
  }

  if (recoveryMode) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-serif text-slate-900">Set a New Password</h1>
            <p className="mt-1 text-sm text-slate-600">Choose a new password for your account</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8">
            {updated ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-700">Your password has been updated.</p>
                <Button className="w-full mt-6" onClick={() => navigate('/signin')}>
                  Continue to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8">
            <h1 className="text-2xl font-serif text-slate-900">Reset Password</h1>
            <p className="mt-1 text-sm text-slate-600">We'll send you instructions to reset your password</p>
          </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-700">If an account exists for <span className="font-medium">{email}</span>, you'll receive reset instructions shortly.</p>
              <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/signin')}>
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
              <button type="button" onClick={() => navigate('/signin')} className="w-full text-center text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
