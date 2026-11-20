'use client';

import { DashboardShell } from '../../../components/DashboardShell';

export default function DashboardMessagesPage() {
  return (
    <DashboardShell>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>الرسائل</h1>
        <p style={{ color: 'var(--muted)' }}>
          محادثات الإعلانات متاحة عبر واجهة المحادثات في الجوال. هذه الصفحة محمية بالجلسة لتفادي
          صفحات 404 بعد تسجيل الدخول.
        </p>
        <div className="state-box">لا توجد محادثات للعرض في الويب بعد.</div>
      </section>
    </DashboardShell>
  );
}
