import { ClipboardList, Code2, Wrench, Calculator, PenLine, ArrowRight } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/ui';
import { TASK_CATEGORIES } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, typeof ClipboardList> = {
  'Assignments': ClipboardList,
  'Mini Projects': Wrench,
  'Coursework': PenLine,
  'Practical/Lab Work': Wrench,
  'Programming Tasks': Code2,
  'Web Development': Code2,
  'Computer Science': Code2,
  'Engineering': Wrench,
  'Business & Management': ClipboardList,
  'Mathematics': Calculator,
  'Statistics': Calculator,
  'Research & Writing': PenLine,
  'Other': ClipboardList,
};

export function SmallProjectsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  function handlePostTask() {
    navigate(user ? '/tasks/new' : '/signup');
  }

  function handleCategoryClick(cat: string) {
    if (user) {
      sessionStorage.setItem('prefill_task_category', cat);
      navigate('/tasks');
    } else {
      navigate('/signup');
    }
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl text-slate-900">Small Projects &amp; Assignments</h1>
          <p className="mt-4 text-lg text-slate-600">
            Get help with assignments, mini-projects, practicals, and other academic tasks —
            for work that's smaller in scope than a final-year project.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handlePostTask}>
              Post a Task <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(user ? '/tasks' : '/signup')}>
              {user ? 'View My Tasks' : 'Get Started'}
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-serif text-2xl text-slate-900 mb-2">What this covers</h2>
        <p className="text-slate-600 max-w-2xl mb-8">
          This is separate from our final-year project support — meant for the smaller,
          more frequent academic work that comes up throughout a semester.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TASK_CATEGORIES.filter((c) => c !== 'Other').map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || ClipboardList;
            return (
              <Card key={cat} className="p-5 flex items-center gap-3 cursor-pointer hover:border-teal-300 transition-colors" onClick={() => handleCategoryClick(cat)}>
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-teal-700" />
                </div>
                <span className="font-medium text-slate-800">{cat}</span>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page max-w-2xl">
          <h2 className="font-serif text-2xl text-slate-900 mb-6">How it works</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="font-serif text-teal-700 text-xl flex-shrink-0">01</span>
              <p className="text-slate-600">Post your task with the course, category, description, deadline, and budget.</p>
            </li>
            <li className="flex gap-4">
              <span className="font-serif text-teal-700 text-xl flex-shrink-0">02</span>
              <p className="text-slate-600">Our team reviews it and gets in touch through the built-in messaging.</p>
            </li>
            <li className="flex gap-4">
              <span className="font-serif text-teal-700 text-xl flex-shrink-0">03</span>
              <p className="text-slate-600">Track status from pending through to completed, right from your dashboard.</p>
            </li>
          </ol>
          <Button className="mt-8" onClick={handlePostTask}>
            Post a Task <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
