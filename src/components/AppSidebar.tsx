import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Calculator,
  Settings,
  BadgeDollarSign,
  MessageSquare,
} from 'lucide-react';

export function AppSidebar() {
  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex-shrink-0">
      <div className="px-4 py-6">
        <span className="font-bold text-lg dark:text-white">VeriPlan Quotient</span>
      </div>
      <nav className="py-4">
        <ul>
          <li className="mb-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center p-3 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Dashboard</span>
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/quotes"
              className={({ isActive }) =>
                `flex items-center p-3 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`
              }
            >
              <Calculator className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Quote Calculator</span>
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/commissions"
              className={({ isActive }) =>
                `flex items-center p-3 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`
              }
            >
              <BadgeDollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Commission Calculator</span>
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/promotions"
              className={({ isActive }) =>
                `flex items-center p-3 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`
              }
            >
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Promotions</span>
            </NavLink>
          </li>
        </ul>
        <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700" />
        <ul>
          <li>
            <NavLink
              to="/admin-login"
              className="flex items-center p-3 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Admin</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
