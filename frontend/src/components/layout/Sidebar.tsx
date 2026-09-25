import React from 'react';
import {
  BarChart3,
  MapPin,
  Search,
  BookOpen,
  GitFork,
  Flame,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
    { id: 'geographic', label: 'Province', icon: MapPin },
    { id: 'search', label: 'Universal Search Hub', icon: Search },
    { id: 'books', label: 'Books & Page Explorer', icon: BookOpen },
    { id: 'relationships', label: 'Family Tree & Lineage', icon: GitFork }
  ];

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent / Responsive Cyber-HUD Sidebar */}
      <aside
        className={`w-64 border-r border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-2xl flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto shadow-sm transition-transform duration-200 z-50 md:z-30 ${
          isOpenMobile
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
            : 'hidden md:flex'
        }`}
      >
        <div>
          {/* Brand Header / Home Button */}
          <div className="border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-[#05070d]/60">
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className="flex-1 p-4 sm:p-5 flex items-center space-x-3 hover:bg-slate-100/90 dark:hover:bg-white/[0.04] transition-all cursor-pointer group text-left focus:outline-none select-none"
              title="Return to Executive Overview (صفحه اصلی)"
              aria-label="Kochi Manager - Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 group-hover:scale-105 group-hover:shadow-emerald-500/40 group-active:scale-95 transition-all duration-200">
                <Flame className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <span>KOCHI MANAGER</span>
                </h2>
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-tight truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  <span>Civil Registry Platform</span>
                </p>
              </div>
            </button>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-2 mr-3 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Menu"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-black/20 text-emerald-100'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Info & Telemetry Status */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05070d]/80 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SYSTEM ONLINE</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Synced</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>24,399,444 Rows</span>
            <span>Zero Loss</span>
          </div>
        </div>
      </aside>
    </>
  );
};
