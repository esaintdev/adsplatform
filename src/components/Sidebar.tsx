'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: '📊', label: 'Overview' },
  { href: '/campaigns', icon: '📁', label: 'Campaigns' },
  { href: '/banners', icon: '🖼️', label: 'Banners' },
  { href: '/analytics', icon: '📈', label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">A</div>
        <div>
          <div className="logo-text">AdTrack</div>
          <div className="logo-sub">Ads Platform</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Menu</div>
          {navItems.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
