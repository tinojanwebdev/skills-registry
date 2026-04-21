import React from 'react';
import { Home, MapPin, MessageCircle, User, Briefcase, Plus } from 'lucide-react';

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
  role: 'buyer' | 'seller';
}

export function BottomNav({ active, onNavigate, role }: BottomNavProps) {
  const buyerItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  
  const sellerItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs' },
    { id: 'posts', icon: Plus, label: 'Posts' },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  
  const items = role === 'buyer' ? buyerItems : sellerItems;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
