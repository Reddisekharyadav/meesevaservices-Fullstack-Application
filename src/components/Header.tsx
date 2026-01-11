"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
}

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
}

export default function Header({ title, showLogo = true }: HeaderProps) {
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    // Fetch business info for the logged-in user
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/business/info');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBusiness(data.data);
          }
        }
      } catch (error) {
        console.log('No business info available');
      }
    };

    fetchBusinessInfo();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          {showLogo && (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative">
                <Image
                  src="/images/logos/Logo.png"
                  alt="Business Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {business?.name && (
                <h1 className="text-xl font-semibold text-gray-900">
                  {business.name}
                </h1>
              )}
              {title && !business?.name && (
                <h1 className="text-xl font-semibold text-gray-900">
                  {title}
                </h1>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}