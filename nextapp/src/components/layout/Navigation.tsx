"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CircleStackIcon, 
  RectangleStackIcon, 
  DocumentTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Node View', href: '/node', icon: CircleStackIcon },
  { name: 'Catalog', href: '/catalog', icon: RectangleStackIcon },
  { name: 'Trace', href: '/trace', icon: DocumentTextIcon },
  { name: 'SDK Info', href: '/sdk', icon: CodeBracketIcon },
];

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-gray-900 text-white w-64 shrink-0 h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold flex items-center space-x-2">
          <span className="text-blue-400">Event</span>
          <span>Bus</span>
        </h1>
      </div>
      
      <div className="mt-6">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center p-3 space-x-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-800 text-white' 
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
} 