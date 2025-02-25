'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useSettings } from '@/hooks/useQueries';
import ApiStatus from '@/components/common/ApiStatus';
import AuthStatus from '@/components/common/AuthStatus';

// Define the settings type
interface Settings {
  user?: {
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export default function Header() {
  const { view, changeView } = useData();
  const { data: settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cast settings to the correct type
  const typedSettings = settings as Settings | undefined;

  const handleViewChange = (newView: string) => {
    changeView(newView);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Bot Monitoring</h1>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'dashboard' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleViewChange('node')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'node' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Node View
              </button>
              <button
                onClick={() => handleViewChange('catalog')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'catalog' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Catalog
              </button>
              <button
                onClick={() => handleViewChange('trace')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'trace' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Trace
              </button>
              <button
                onClick={() => handleViewChange('sdk')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'sdk' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                SDK Info
              </button>
            </nav>
          </div>

          {/* User Info / Settings */}
          <div className="flex items-center space-x-4">
            {/* API Status Indicator */}
            <ApiStatus />
            
            {/* Auth Status Indicator */}
            <AuthStatus />
            
            <div className="text-sm">
              {typedSettings?.user?.name ? (
                <span>{typedSettings.user.name}</span>
              ) : (
                <span>Guest User</span>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
            <button
              onClick={() => handleViewChange('dashboard')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                view === 'dashboard' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleViewChange('node')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                view === 'node' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Node View
            </button>
            <button
              onClick={() => handleViewChange('catalog')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                view === 'catalog' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => handleViewChange('trace')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                view === 'trace' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Trace
            </button>
            <button
              onClick={() => handleViewChange('sdk')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                view === 'sdk' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              SDK Info
            </button>
          </nav>
        )}
      </div>
    </header>
  );
} 