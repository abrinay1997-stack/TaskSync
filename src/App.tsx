import React, { useState, useEffect } from 'react';
import { initAuth, logout, googleSignIn } from './lib/auth';
import { User } from './types';

import { useTasks } from './hooks/useTasks';
import { useAccounts } from './hooks/useAccounts';
import { exportToPDF, copyReportToClipboard } from './lib/export';

// Layout & Views
import { AmbientBackground } from './components/layout/AmbientBackground';
import { Header } from './components/layout/Header';
import { MobileMenu } from './components/layout/MobileMenu';
import { MobileTabs } from './components/layout/MobileTabs';
import { BentoGrid } from './components/dashboard/BentoGrid';
import { AccountsManager } from './components/accounts/AccountsManager';
import { Login } from './components/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'progress' | 'accounts'>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { allTasks, pendingTasks, completedTasks } = useTasks();
  const { accounts } = useAccounts();

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setIsAuthenticated(true);
      },
      () => {
        setUser(null);
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    googleSignIn();
  };

  const handleExportPDF = () => {
    exportToPDF(allTasks);
  };

  const handleCopyReport = () => {
    copyReportToClipboard(allTasks);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 flex flex-col font-sans p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden relative selection:bg-purple-500/30">
      <AmbientBackground />

      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
        onExportPDF={handleExportPDF}
        onCopyReport={handleCopyReport}
      />

      <MobileMenu 
        isAuthenticated={isAuthenticated}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
        onExportPDF={handleExportPDF}
        onCopyReport={handleCopyReport}
      />

      <MobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated && activeTab === 'tasks' && (
        <div className="md:hidden mb-4 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4 relative z-10">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full">Modo Offline Activo</span>
          </div>
          <Login onSuccess={() => {}} />
        </div>
      )}

      {activeTab === 'accounts' ? (
        <div className="flex-1 relative z-10 w-full max-w-5xl mx-auto">
          <AccountsManager accounts={accounts} />
        </div>
      ) : (
        <BentoGrid 
          activeTab={activeTab}
          isAuthenticated={isAuthenticated}
          accounts={accounts}
          allTasks={allTasks}
          pendingTasks={pendingTasks}
          completedTasks={completedTasks}
        />
      )}
    </div>
  );
}
