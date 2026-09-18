import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui';
import { validateEmail } from '@/lib/utils';

export function SignInPage() {
  const { navigate } = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    showToast('Welcome back!', 'success');
    navigate('/dashboard');
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
            Research. Build. Present.<br />With confidence.
          </p>
          <p className="mt-4 text-sm text-slate-400 max-w-sm">
            Sign in to track your project, message your consultant, and manage payments.
          </p>
        </div>
        <p className="text-xs text-slate-500">Nigerian university research support</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-serif text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your ProjectHub NG account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            <button onClick={() => navigate('/reset-password')} className="text-teal-700 hover:underline">
              Forgot your password?
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="text-teal-700 hover:underline font-medium">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
