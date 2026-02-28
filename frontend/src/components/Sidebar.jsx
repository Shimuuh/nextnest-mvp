import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    BookOpen,
    Briefcase,
    LogOut,
    Settings
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        {
            name: 'Dashboard',
            icon: LayoutDashboard,
            path: user?.role === 'admin' ? '/' : user?.role === 'donor' ? '/donor' : '/orphanage',
            roles: ['admin', 'orphanage', 'donor']
        },
        {
            name: 'Children Profile',
            icon: Users,
            path: '/children',
            roles: ['orphanage', 'admin']
        },
        {
            name: 'Support a Future',
            icon: Users,
            path: '/donor',
            roles: ['donor']
        },
        {
            name: 'Risk Alerts',
            icon: ShieldAlert,
            path: '/alerts',
            roles: ['admin', 'orphanage']
        },
        {
            name: 'Govt Schemes',
            icon: BookOpen,
            path: '/schemes',
            roles: ['admin', 'orphanage']
        },
        {
            name: 'Opportunities',
            icon: Briefcase,
            path: '/opportunities',
            roles: ['admin', 'orphanage']
        }
    ];

    return (
        <div className="flex flex-col w-64 bg-white border-r border-slate-200 text-slate-600 transition-all duration-300 overflow-y-auto shadow-sm z-20">
            <div className="p-6">
                <h2 className="text-2xl font-black text-blue-800 flex items-center h-8 tracking-tight">
                    <span className="text-emerald-600 mr-2">✦</span> NextNest
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems
                    .filter(item => item.roles.includes(user?.role))
                    .map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center space-x-3 px-4 py-3 transition-all duration-200 group font-medium",
                                isActive
                                    ? "bg-blue-50 text-blue-700 rounded-lg shadow-sm"
                                    : "hover:bg-slate-50 hover:text-slate-900 rounded-lg text-slate-600"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
                                    )} />
                                    <span>{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-1">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger_toast', { detail: { message: 'Advanced System Settings are restricted to SuperAdmins.', type: 'error' } }))}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium group">
                    <Settings className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                    <span>Settings</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-50 text-slate-600 hover:text-red-600 font-medium group"
                >
                    <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
