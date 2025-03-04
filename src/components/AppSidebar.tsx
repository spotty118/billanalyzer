
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Settings,
  BadgeDollarSign,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside 
      className={cn(
        "bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn(
        "flex items-center justify-between px-4 py-6",
        isCollapsed && "justify-center"
      )}>
        {!isCollapsed && <span className="font-bold text-lg dark:text-white">Carrier Bill</span>}
        <button 
          onClick={toggleSidebar}
          className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="py-4">
        <ul>
          <SidebarItem to="/" icon={<LayoutDashboard />} label="Dashboard" isCollapsed={isCollapsed} />
          <SidebarItem to="/quotes" icon={<Calculator />} label="Quote Calculator" isCollapsed={isCollapsed} />
          <SidebarItem to="/commissions" icon={<BadgeDollarSign />} label="Commission Calculator" isCollapsed={isCollapsed} />
          <SidebarItem to="/promotions" icon={<MessageSquare />} label="Promotions" isCollapsed={isCollapsed} />
        </ul>
        <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700" />
        <ul>
          <SidebarItem to="/admin-login" icon={<Settings />} label="Admin" isCollapsed={isCollapsed} />
        </ul>
      </nav>
    </aside>
  );
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

function SidebarItem({ to, icon, label, isCollapsed }: SidebarItemProps) {
  return (
    <li className="mb-1 px-2">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center p-3 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            isCollapsed ? "justify-center" : "",
            isActive ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
          )
        }
      >
        <span className="w-5 h-5">{icon}</span>
        {!isCollapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
}
