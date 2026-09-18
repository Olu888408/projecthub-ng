import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui';
import { validateEmail } from '@/lib/utils';

export function SignUpPage() {
  const { navigate } = useRouter();
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(form.email, form.password, form.fullName);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsEmailConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    showToast('Account created successfully!', 'success');
    navigate('/dashboard');
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-10 h-10 text-teal-700 mx-auto mb-4" />
          <h1 className="text-xl font-serif text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            We've sent a confirmation link to <span className="font-medium text-slate-900">{form.email}</span>.
            Verify your email, then sign in.
          </p>
          <Button className="w-full mt-6" onClick={() => navigate('/signin')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden lg:flex lg:w-5/12 bg-teal-950 flex-col justify-between p-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-md bg-amber-600 flex items-center justify-center">
            <span className="font-serif text-white text-base leading-none">P</span>
          </div>
          <span className="font-serif text-lg text-white">ProjectHub <span className="text-amber-500">NG</span></span>
        </button>
        <div>
          <p className="font-serif text-2xl text-white leading-snug">
            Join students already getting structured research support.
          </p>
          <p className="mt-4 text-sm text-slate-400 max-w-sm">
            Submit a request, get matched with a consultant, and track everything from one dashboard.
          </p>
        </div>
        <p className="text-xs text-slate-500">Nigerian university research support</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-serif text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join ProjectHub NG and get started today</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/signin')} className="text-teal-700 hover:underline font-medium">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
