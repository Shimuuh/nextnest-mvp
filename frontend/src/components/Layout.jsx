import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
