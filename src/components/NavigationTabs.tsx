import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  Sparkles,
  UserRoundCog,
  CalendarCheck,
  BarChart3,
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount?: number;
  totalAppointments?: number;
  totalDoctors?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  totalAppointments = 0,
  totalDoctors = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด',
      sublabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'appointment-form',
      label: 'จองคิวนัดหมาย',
      sublabel: 'Appointment Form',
      icon: CalendarPlus,
      highlight: true,
    },
    {
      id: 'ai-recommend',
      label: 'AI แนะนำแผนก',
      sublabel: 'AI Triage & Recommendation',
      icon: Sparkles,
      aiBadge: true,
    },
    {
      id: 'appointments',
      label: 'จัดการการนัดหมาย',
      sublabel: 'Appointment Management',
      icon: CalendarCheck,
      badge: pendingCount > 0 ? pendingCount : totalAppointments,
      badgeColor: pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
    },
    {
      id: 'doctors',
      label: 'จัดการข้อมูลแพทย์',
      sublabel: 'Doctor Management',
      icon: UserRoundCog,
      badge: totalDoctors,
    },
    {
      id: 'reports',
      label: 'รายงานและสถิติ',
      sublabel: 'Hospital Reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-white'
                      : tab.aiBadge
                      ? 'text-sky-500'
                      : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                />
                <span className="tracking-tight">{tab.label}</span>

                {tab.aiBadge && !isActive && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full">
                    AI
                  </span>
                )}

                {tab.badge !== undefined && tab.badge > 0 && !isActive && (
                  <span
                    className={`ml-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      tab.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
