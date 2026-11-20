'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadSession, type WebSession } from '../lib/session';

export function HeaderAuth() {
  const [session, setSession] = useState<WebSession | null>(null);

  useEffect(() => {
    setSession(loadSession());
    function onStorage(event: StorageEvent) {
      if (event.key === 'tarweej.web.session') {
        setSession(loadSession());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (session?.tokens.accessToken) {
    return (
      <>
        <Link className="btn btn-primary" href="/dashboard/listings">
          + أضف إعلان
        </Link>
        <Link className="btn btn-ghost" href="/dashboard">
          حسابي
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className="btn btn-primary" href="/login">
        + أضف إعلان
      </Link>
      <Link className="btn btn-ghost" href="/login">
        دخول
      </Link>
    </>
  );
}
