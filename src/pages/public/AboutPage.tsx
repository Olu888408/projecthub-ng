import { Target, Eye, Users, Award, BookOpen, Heart, Shield } from 'lucide-react';
import { Card } from '@/components/ui';

export function AboutPage() {
  const values = [
    { icon: Award, title: 'Excellence', desc: 'We strive for academic excellence in every project we support.' },
    { icon: Shield, title: 'Integrity', desc: 'We maintain the highest standards of academic integrity and originality.' },
    { icon: Heart, title: 'Student-Centered', desc: 'Every decision we make is focused on helping students succeed.' },
    { icon: BookOpen, title: 'Continuous Learning', desc: 'We stay updated with the latest academic standards and requirements.' },
  ];

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900">About ProjectHub NG</h1>
          <p className="mt-4 text-lg text-slate-600">
            We are Nigeria's leading platform for academic project assistance, dedicated to helping
            university students achieve their academic goals.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
            <p className="text-slate-600 leading-relaxed">
              ProjectHub NG was founded with a simple mission: to provide Nigerian university students
              with the academic support they need to excel in their final year projects. We understand
              the challenges students face — from choosing the right topic to defending their work —
              and we're here to help every step of the way.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              With over 500 completed projects and a 98% success rate, we have established ourselves
              as a trusted partner for students across Nigerian universities.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Target className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">500+</div>
              <div className="text-sm text-slate-500">Projects Completed</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">300+</div>
              <div className="text-sm text-slate-500">Students Helped</div>
            </Card>
            <Card className="p-6 text-center">
              <Award className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">98%</div>
              <div className="text-sm text-slate-500">Success Rate</div>
            </Card>
            <Card className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">15+</div>
              <div className="text-sm text-slate-500">Universities</div>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-4">
              <Eye className="w-4 h-4" /> Our Values
            </div>
            <h2 className="text-3xl font-bold text-slate-900">What drives us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-600">{value.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
