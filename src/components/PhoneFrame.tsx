import { type ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="phone-frame">
      {/* Notch */}
      <div className="phone-notch">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/50 rounded-full" />
      </div>
      
      {/* Screen */}
      <div className="phone-screen">
        {children}
      </div>
      
      {/* Home indicator */}
      <div className="phone-home-indicator" />
    </div>
  );
}
