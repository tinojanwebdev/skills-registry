import React from 'react';
import { UserCircle, Briefcase } from 'lucide-react';
import { Button } from '../ui/button';

interface RoleSelectionProps {
  onSelectRole: (role: 'buyer' | 'seller') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Welcome to Worker</h2>
          <p className="text-muted-foreground">Choose how you want to continue</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => onSelectRole('buyer')}
            className="w-full p-6 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                <UserCircle className="w-8 h-8 text-primary group-hover:text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold">Continue as Buyer</h3>
                <p className="text-sm text-muted-foreground">Find and hire local workers</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => onSelectRole('seller')}
            className="w-full p-6 bg-card border-2 border-border rounded-2xl hover:border-[#10B981] hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-[#10B981]/10 rounded-xl flex items-center justify-center group-hover:bg-[#10B981] group-hover:scale-110 transition-all">
                <Briefcase className="w-8 h-8 text-[#10B981] group-hover:text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold">Continue as Worker</h3>
                <p className="text-sm text-muted-foreground">Offer your services and get hired</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

