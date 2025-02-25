'use client'
import { ReactNode, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useData } from '@/context/DataContext';
import EnvInfo from '@/components/debug/EnvInfo';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { view, changeAllStateValues } = useData();

  // Load settings from URL hash on mount
  useEffect(() => {
    const loadSettingsFromHash = () => {
      const hash = decodeURI(document.location.hash.slice(1)) || '';
      
      if (hash === '') {
        const defaultView = localStorage.getItem('default-view');
        if (defaultView) {
          document.location.hash = localStorage.getItem(defaultView) || '{}';
          return;
        }
      }
      
      try {
        const values = JSON.parse(decodeURI(hash || '') || '{}');
        
        changeAllStateValues(
          values.selected || [],
          values.timePeriod || { interval: 'hour_6' },
          values.view || 'dashboard',
          values.offset || [0, 0],
          values.node || '',
          values.zoom || 1,
          (values.details && values.selected && values.selected.length > 0) || false
        );
      } catch (e) {
        console.error('Invalid URL hash', e);
      }
    };
    
    loadSettingsFromHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', loadSettingsFromHash);
    
    return () => {
      window.removeEventListener('hashchange', loadSettingsFromHash);
    };
  }, [changeAllStateValues]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Only show sidebar on certain views */}
        {(view === 'dashboard' || view === 'node' || view === 'catalog') && <Sidebar />}
        
        <main className="flex-1 overflow-auto bg-white">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Environment info component (only visible in development) */}
      <EnvInfo />
      
    </div>
  );
} 