"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Business } from "@/types";

interface HeaderProps {
  title: string;
  showLogo?: boolean;
}

export default function Header({ title, showLogo = true }: HeaderProps) {
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (showLogo) {
      fetchBusinessInfo();
    }
  }, [showLogo]);

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch('/api/business/info');
      const data = await response.json();
      if (data.success) {
        setBusiness(data.data);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showLogo && business && (
              <div className="flex items-center space-x-3">
                {business.logo ? (
                  <Link 
                    href={business.website || '#'} 
                    target={business.website ? "_blank" : "_self"}
                    className="flex items-center hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={business.logo} 
                      alt={business.name}
                      className="h-10 w-auto object-contain cursor-pointer"
                    />
                  </Link>
                ) : (
                  <Link 
                    href={business.website || '#'} 
                    target={business.website ? "_blank" : "_self"}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer">
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                )}
                
                <div className="hidden sm:block">
                  <Link 
                    href={business.website || '#'} 
                    target={business.website ? "_blank" : "_self"}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {business.name}
                  </Link>
                </div>
              </div>
            )}
            
            <div className="h-6 border-l border-gray-300 hidden sm:block" />
            
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
          </div>

          {business && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {business.phone && (
                <span className="hidden md:block">
                  📞 {business.phone}
                </span>
              )}
              {business.email && (
                <span className="hidden md:block">
                  📧 {business.email}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}