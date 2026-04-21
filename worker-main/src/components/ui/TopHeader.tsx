import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, House, MessageCircle } from 'lucide-react';

interface TopHeaderProps {
  title: string;
  role: 'buyer' | 'seller';
  onNavigateHome: () => void;
  onNavigateMessages: () => void;
  onNavigateProfile: () => void;
  onLogout: () => void;
}

export function TopHeader({
  title,
  role,
  onNavigateHome,
  onNavigateMessages,
  onNavigateProfile,
  onLogout,
}: TopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="relative z-50 border-b border-border bg-card supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
        <div className="font-semibold text-foreground truncate">{title}</div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-center border border-border"
            aria-label="Open profile menu"
          >
            <User className="w-5 h-5 text-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-lg border border-border bg-card shadow-xl overflow-hidden z-[60]">
              <button
                onClick={() => {
                  onNavigateHome();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <House className="w-4 h-4" />
                {role === 'seller' ? 'Dashboard' : 'Home'}
              </button>
              <button
                onClick={() => {
                  onNavigateMessages();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                Messages
              </button>
              <button
                onClick={() => {
                  onNavigateProfile();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary text-destructive flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
