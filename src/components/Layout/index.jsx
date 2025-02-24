import React, { Suspense } from 'react';
import { useData } from '../../stores/DataContext';
import Header from './Header';
import LeftNav from './LeftNav';
import MessageCenter from './MessageCenter';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const CatalogPage = React.lazy(() => import('../pages/CatalogPage'));
const WorkflowPage = React.lazy(() => import('../pages/WorkflowPage'));
const TracePage = React.lazy(() => import('../pages/TracePage'));
const SDKPage = React.lazy(() => import('../pages/SDKPage'));

const Layout = () => {
  const { settings, isLoading } = useData();
  
  const renderPage = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    switch (settings?.view) {
      case 'dashboard':
        return <DashboardPage />;
      case 'catalog':
        return <CatalogPage />;
      case 'node':
        return <WorkflowPage />;
      case 'trace':
        return <TracePage />;
      case 'documentation':
        return <SDKPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <main id="main" className="flex h-screen">
      <LeftNav />
      <div className="flex-1 flex flex-col">
        <Header />
        <MessageCenter />
        <div className="flex-1 overflow-auto p-4">
          <Suspense fallback={<LoadingSpinner />}>
            {renderPage()}
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default Layout;
