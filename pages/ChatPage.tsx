import React from 'react';

export default function ChatPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
             <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 flex items-center justify-center border border-purple-500/30 mb-8 shadow-[0_0_40px_rgba(168,85,247,0.15)] relative group">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <span className="material-icons-round text-5xl text-purple-400 relative z-10 drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">smart_toy</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-light dark:text-white mb-6 tracking-tight max-w-xl leading-relaxed">
                Contactează echipa Nanoassist pentru a activa Chat AI
            </h2>
            
            <button className="btn-3d-primary px-8 py-3.5 rounded-xl text-white font-medium text-sm tracking-wide flex items-center gap-3 hover:scale-105 transition-transform duration-200 group">
                <span className="material-icons-round text-lg group-hover:animate-bounce">support_agent</span>
                Contactează Suport
            </button>
        </div>
    );
}