import React from 'react';
import { Briefcase, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary to-[#10B981] px-6">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <Briefcase className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-white">Worker</h1>
          <p className="text-xl text-white/90 max-w-sm mx-auto">
            Find trusted workers near you
          </p>
        </div>
        
        <Button
          variant="accent"
          size="lg"
          onClick={onContinue}
          className="shadow-xl"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

