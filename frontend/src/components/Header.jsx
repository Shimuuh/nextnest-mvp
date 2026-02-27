import { Bell, Search, UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-10 w-full transition-all">
            <div className="flex-1 flex items-center">
                <div className="relative w-full max-w-md hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Search children, schemes, or opportunities..."
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-900"></span>
                </button>

                <div className="flex items-center space-x-2 pl-4 border-l border-slate-800 cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
                        {user?.role === 'admin' ? 'SA' : 'HO'}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-slate-200 leading-none group-hover:text-blue-400 transition-colors">
                            {user?.role === 'admin' ? 'System Admin' : 'Hope Orphanage'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 capitalize">{user?.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-300 ml-1 transition-colors" />
                </div>
            </div>
        </header>
    );
}
