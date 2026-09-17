import { GraduationCap, Mail, Phone, MessageCircle } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { whatsappLink } from '@/lib/utils';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">ProjectHub<span className="text-teal-300">NG</span></span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Nigeria's premier platform for academic project assistance. We help university students
              achieve excellence through expert guidance and comprehensive project support.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href={whatsappLink('Hello ProjectHub NG, I would like to make an enquiry about your project support services.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-sm hover:bg-green-600/30 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/services')} className="hover:text-teal-400 transition-colors">Services</button></li>
              <li><button onClick={() => navigate('/packages')} className="hover:text-teal-400 transition-colors">Packages</button></li>
              <li><button onClick={() => navigate('/about')} className="hover:text-teal-400 transition-colors">About Us</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-teal-400 transition-colors">Contact</button></li>
              <li><button onClick={() => navigate('/faq')} className="hover:text-teal-400 transition-colors">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/legal/privacy-policy')} className="hover:text-teal-400 transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/legal/terms-of-service')} className="hover:text-teal-400 transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigate('/legal/refund-policy')} className="hover:text-teal-400 transition-colors">Refund Policy</button></li>
              <li><button onClick={() => navigate('/legal/academic-integrity')} className="hover:text-teal-400 transition-colors">Academic Integrity</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} ProjectHub NG. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> support@projecthub.ng</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> 0916 066 1570</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> 0907 339 6693</span>
          </div>
        </div>
      </div>
    </footer>
  );
}