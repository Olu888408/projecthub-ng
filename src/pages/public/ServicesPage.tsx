import { Search, ArrowRight, BookOpen, Cpu, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { Button, Card } from '@/components/ui';

interface Service {
  name: string;
  category: string;
  description: string;
}

const SERVICES: Service[] = [
  { name: 'Civil Engineering', category: 'Engineering', description: 'Structural design, transportation, geotechnics, water resources, and construction management research support.' },
  { name: 'Electrical/Electronics Engineering', category: 'Engineering', description: 'Power systems, circuit design, electronics, telecommunications, and control systems project guidance.' },
  { name: 'Mechanical Engineering', category: 'Engineering', description: 'Thermodynamics, fluid mechanics, machine design, manufacturing, and materials engineering support.' },
  { name: 'Mechatronics Engineering', category: 'Engineering', description: 'Robotics, automation, control systems, and embedded systems project assistance.' },
  { name: 'Chemical Engineering', category: 'Engineering', description: 'Process design, reaction engineering, separation processes, and plant operations research support.' },
  { name: 'Petroleum Engineering', category: 'Engineering', description: 'Reservoir engineering, drilling, production, and petroleum geology project guidance.' },
  { name: 'Agricultural Engineering', category: 'Engineering', description: 'Farm power, irrigation, food processing, and agricultural systems research support.' },
  { name: 'Materials & Metallurgical Engineering', category: 'Engineering', description: 'Material properties, heat treatment, corrosion, and metallurgical processes project assistance.' },
  { name: 'Industrial Engineering', category: 'Engineering', description: 'Operations research, quality control, supply chain, and production systems research support.' },
  { name: 'Environmental Engineering', category: 'Engineering', description: 'Water treatment, waste management, pollution control, and environmental impact assessment.' },
  { name: 'Computer Science', category: 'Computer Science & Technology', description: 'Algorithms, software development, databases, and computational theory project guidance.' },
  { name: 'Software Engineering', category: 'Computer Science & Technology', description: 'Software architecture, development methodologies, testing, and deployment support.' },
  { name: 'Information Technology', category: 'Computer Science & Technology', description: 'IT infrastructure, network administration, cloud computing, and systems integration.' },
  { name: 'Cybersecurity', category: 'Computer Science & Technology', description: 'Network security, cryptography, threat analysis, and security auditing research support.' },
  { name: 'Data Science', category: 'Computer Science & Technology', description: 'Machine learning, statistical analysis, data visualization, and big data project guidance.' },
  { name: 'Artificial Intelligence', category: 'Computer Science & Technology', description: 'Neural networks, natural language processing, computer vision, and AI systems research support.' },
  { name: 'Computer Engineering', category: 'Computer Science & Technology', description: 'Hardware design, embedded systems, microprocessors, and computer architecture project assistance.' },
  { name: 'Information Systems', category: 'Computer Science & Technology', description: 'Systems analysis, database design, IT management, and business intelligence research support.' },
  { name: 'Networking', category: 'Computer Science & Technology', description: 'Network design, protocols, wireless communications, and network security project guidance.' },
  { name: 'Accounting', category: 'Other Departments', description: 'Financial accounting, auditing, taxation, and financial reporting research support.' },
  { name: 'Business Administration', category: 'Other Departments', description: 'Management, organizational behavior, strategic planning, and business operations project guidance.' },
  { name: 'Economics', category: 'Other Departments', description: 'Microeconomics, macroeconomics, development economics, and econometrics research support.' },
  { name: 'Public Administration', category: 'Other Departments', description: 'Public policy, governance, administrative theory, and public sector management project assistance.' },
  { name: 'Mass Communication', category: 'Other Departments', description: 'Journalism, broadcasting, public relations, media studies, and advertising research support.' },
  { name: 'Education', category: 'Other Departments', description: 'Curriculum development, educational psychology, teaching methods, and educational technology guidance.' },
  { name: 'Sociology', category: 'Other Departments', description: 'Social structures, community studies, social research methods, and demographic analysis.' },
  { name: 'Political Science', category: 'Other Departments', description: 'Political theory, comparative politics, international relations, and public policy research support.' },
  { name: 'Marketing', category: 'Other Departments', description: 'Marketing strategy, consumer behavior, digital marketing, and brand management project guidance.' },
  { name: 'Banking & Finance', category: 'Other Departments', description: 'Banking operations, financial markets, investment analysis, and risk management research support.' },
  { name: 'Agriculture', category: 'Other Departments', description: 'Crop science, animal husbandry, agricultural economics, and sustainable farming practices.' },
  { name: 'Library & Information Science', category: 'Other Departments', description: 'Information organization, digital libraries, knowledge management, and archival studies.' },
  { name: 'Psychology', category: 'Other Departments', description: 'Clinical psychology, cognitive studies, social psychology, and counseling research support.' },
  { name: 'International Relations', category: 'Other Departments', description: 'Diplomacy, global politics, conflict resolution, and international organizations project guidance.' },
];

const CATEGORIES = ['All', 'Engineering', 'Computer Science & Technology', 'Other Departments'];

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'Engineering': Calculator,
  'Computer Science & Technology': Cpu,
  'Other Departments': BookOpen,
};

export function ServicesPage() {
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = SERVICES.filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl text-slate-900">Our Services</h1>
          <p className="mt-4 text-lg text-slate-600">
            Browse our academic research support services across multiple disciplines. Select a service to request assistance.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const Icon = CATEGORY_ICONS[service.category] || BookOpen;
            return (
              <Card key={service.name} className="p-6 hover:border-slate-300 transition-colors flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-xs font-medium text-teal-600 mb-1">{service.category}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{service.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{service.description}</p>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate('/signup')}>
                  Request This Service <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">No services found matching your search.</div>
        )}
      </section>
    </div>
  );
}
