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
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 overflow-y-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex justify-center items-center h-8">
                    NextNest
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems
                    .filter(item => item.roles.includes(user?.role))
                    .map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30"
                                    : "hover:bg-slate-800/50 hover:text-slate-100"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-colors",
                                location.pathname === item.path ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </NavLink>
                    ))}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                <button className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 group">
                    <Settings className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
                    <span className="font-medium">Settings</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-500/10 text-slate-400 hover:text-red-400 group"
                >
                    <LogOut className="h-5 w-5 text-slate-500 group-hover:text-red-400" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
