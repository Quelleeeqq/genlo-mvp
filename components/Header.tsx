"use client";
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard')) return null;
  return (
    <header className="bg-white border-b border-black sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Spacer to push navigation and user menu to the right */}
          <div className="flex-grow" />

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">

            <Link 
              href="/pricing" 
              className="text-black hover:text-gray-700 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
} 