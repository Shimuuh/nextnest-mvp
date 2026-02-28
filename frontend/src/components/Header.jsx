import { Bell, Search, UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 w-full transition-all shadow-sm">
            <div className="flex-1 flex items-center">
                <div className="relative w-full max-w-md hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                        placeholder="Search children, schemes, or opportunities..."
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger_toast', { detail: { message: 'You have no new notifications.', type: 'info' } }))}
                    className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
                </button>

                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger_toast', { detail: { message: 'User profile management is locked in this demo space.', type: 'info' } }))}
                    className="flex items-center space-x-2 pl-4 border-l border-slate-200 cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-100">
                        {user?.role === 'admin' ? 'SA' : 'HO'}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-blue-700 transition-colors">
                            {user?.role === 'admin' ? 'System Admin' : 'Hope Orphanage'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 capitalize font-medium">{user?.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 ml-1 transition-colors" />
                </div>
            </div>
        </header>
    );
}
