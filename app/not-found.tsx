'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'hsl(222.2 47% 11%)',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#60a5fa' }}>404</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Page Not Found</div>
      <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
        The page you are looking for does not exist.
      </div>
      <Link
        href="/dashboard"
        style={{
          marginTop: '1rem',
          padding: '0.6rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
