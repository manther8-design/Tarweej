'use client';

import { DashboardShell } from '../../../components/DashboardShell';

export default function DashboardPaymentsPage() {
  return (
    <DashboardShell>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>المدفوعات</h1>
        <p style={{ color: 'var(--muted)' }}>
          ترقية الإعلانات المميزة تتم بعد تأكيد الدفع من الخادم. يمكنك متابعة حالة إعلاناتك من قائمة
          الإعلانات.
        </p>
        <div className="state-box">لا توجد عمليات دفع معروضة هنا بعد.</div>
      </section>
    </DashboardShell>
  );
}
