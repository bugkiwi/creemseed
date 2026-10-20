import Link from 'next/link';
import { site } from '@/lib/config';

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${site.name} home`}>
      <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true">
        <path
          d="M16 28V15M16 20C6 20 3 14 4 5c9-1 15 2 15 12M16 15C16 7 21 3 29 4c0 8-4 13-12 13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {site.name}
    </Link>
  );
}
