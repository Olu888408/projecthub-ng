import { useEffect, useRef, useState } from 'react';
import { GraduationCap, Menu, X, LayoutDashboard, LogOut, User, Bell, Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui';
import { cn, whatsappLink } from '@/lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenu]);

  const isAdmin = profile?.role === 'admin';

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Packages', path: '/packages' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
  ];

  function handleNav(p: string) {
    navigate(p);
    setMobileOpen(false);
  }

  function handleSignOut() {
    signOut();
    navigate('/');
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => handleNav('/')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">ProjectHub<span className="text-teal-600">NG</span></span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  path === link.path ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleNav('/notifications')}>
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleNav('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => handleNav('/admin')}>
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                )}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100"
                    aria-label="Open account menu"
                    aria-expanded={userMenu}
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-medium">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50" onClick={() => setUserMenu(false)}>
                      <button onClick={() => handleNav('/profile')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="w-4 h-4" /> Profile
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleNav('/admin')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </button>
                      )}
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <a href={whatsappLink('Hello ProjectHub NG, I would like to make an enquiry about your project support services.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 border border-green-200">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleNav('/signin')}>Sign In</Button>
                <Button size="sm" onClick={() => handleNav('/signup')}>Get Started</Button>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={cn(
                  'block w-full text-left px-3 py-2 rounded-lg text-sm font-medium',
                  path === link.path ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              {user ? (
                <>
                  <button onClick={() => handleNav('/dashboard')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Dashboard
                  </button>
                  <button onClick={() => handleNav('/notifications')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Notifications
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleNav('/admin')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                      Admin Panel
                    </button>
                  )}
                  <button onClick={() => handleNav('/profile')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Profile
                  </button>
                  <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleNav('/signin')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Sign In
                  </button>
                  <button onClick={() => handleNav('/signup')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}