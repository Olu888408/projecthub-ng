import { useEffect, useState } from 'react';
import { CreditCard, Search, Check, X } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, Badge, Spinner, EmptyState, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { statusColors, statusLabel, formatDate, formatCurrency } from '@/lib/utils';
import type { Payment } from '@/types/database';

export function AdminPaymentsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, project:projects(*)')
        .order('created_at', { ascending: false });
      if (data) setPayments(data as Payment[]);
      setLoading(false);
    })();
  }, []);

  async function updateStatus(paymentId: string, status: 'success' | 'failed') {
    setUpdatingId(paymentId);
    const current = payments.find((p) => p.id === paymentId);
    const { error } = await supabase.from('payments').update({ status }).eq('id', paymentId);
    if (!error) {
      await supabase.from('payment_status_history').insert({
        payment_id: paymentId,
        old_status: current?.status ?? null,
        new_status: status,
        changed_by: user?.id ?? null,
      });
    }
    setUpdatingId(null);
    if (error) {
      showToast('Failed to update payment status', 'error');
      return;
    }
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status } : p)));
  }

  const filtered = payments.filter((p) =>
    !search || p.paystack_reference?.toLowerCase().includes(search.toLowerCase()) || p.project?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <Card className="px-5 py-3">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference or project title..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<CreditCard className="w-12 h-12" />} title="No payments found" /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((pay) => (
            <Card key={pay.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{formatCurrency(Number(pay.amount))}</p>
                  <p className="text-sm text-slate-500 mt-1 truncate">
                    {pay.project?.title || 'Unknown project'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{formatDate(pay.created_at)}</span>
                    {pay.paystack_reference && <span>&bull; Ref: {pay.paystack_reference}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pay.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === pay.id}
                        onClick={() => updateStatus(pay.id, 'success')}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Check className="w-4 h-4" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === pay.id}
                        onClick={() => updateStatus(pay.id, 'failed')}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Badge className={statusColors(pay.status)}>{statusLabel(pay.status)}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}