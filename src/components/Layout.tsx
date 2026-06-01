import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, FileSignature, History, BarChart2, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { to: "/", icon: Home, label: "ទំព័រដើម" },
  { to: "/add", icon: FileSignature, label: "បញ្ចូលថ្មី" },
  { to: "/history", icon: History, label: "ប្រវត្តិ" },
  { to: "/reports", icon: BarChart2, label: "របាយការណ៍" },
  { to: "/settings", icon: Settings, label: "ការកំណត់" }
];

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex-row">
      <main className="flex-1 w-full max-w-lg mx-auto md:max-w-4xl relative">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 md:relative md:border-t-0 md:border-r md:w-64 md:flex-col md:justify-start md:py-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-50">
        <div className="flex justify-around md:flex-col md:gap-4 max-w-lg mx-auto md:max-w-none px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-colors text-xs md:text-sm font-medium",
                  isActive 
                    ? "text-brand-600 md:bg-brand-50" 
                    : "text-gray-500 hover:text-gray-900 md:hover:bg-gray-100"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
