import React, { useState } from 'react';
import { useCallRecordingsOptimized } from '../hooks/useCallRecordings';

export default function CallRecordings() {
    const [selectedBrand, setSelectedBrand] = useState('Tamtrend');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Increased limit to 50 to pull more records ("pull all" request)
    const { recordings, loading, error, isRefetching } = useCallRecordingsOptimized(selectedBrand, 50);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Înregistrări Apeluri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                        Ultimele conversații înregistrate de AI
                    </p>
                </div>
                
                <div className="flex gap-3 items-center relative z-50">
                    {isRefetching && (
                        <div className="flex items-center gap-2 text-primary text-sm animate-pulse mr-2">
                            <span className="material-icons-round text-sm">sync</span>
                            Actualizare...
                        </div>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="btn-3d-secondary px-5 py-3 rounded-xl text-sm font-normal flex items-center gap-3 tracking-wide hover:text-white transition-all min-w-[160px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round text-lg text-primary">store</span>
                                <span>{selectedBrand}</span>
                            </div>
                            <span className={`material-icons-round text-xl transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-full min-w-[160px] rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => { setSelectedBrand('Tamtrend'); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 hover:bg-white/5 ${selectedBrand === 'Tamtrend' ? 'text-white bg-white/5' : 'text-gray-400'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${selectedBrand === 'Tamtrend' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-transparent border border-gray-600'}`}></span>
                                        Tamtrend
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBrand('Vitadomus'); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 hover:bg-white/5 ${selectedBrand === 'Vitadomus' ? 'text-white bg-white/5' : 'text-gray-400'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${selectedBrand === 'Vitadomus' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-transparent border border-gray-600'}`}></span>
                                        Vitadomus
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <span className="material-icons-round">error_outline</span>
                    {error}
                </div>
            )}

            <div className="card-depth p-1 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-normal text-gray-500 uppercase tracking-wider border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-6 font-medium">Data & Ora</th>
                                <th className="py-4 px-6 font-medium">Telefon</th>
                                <th className="py-4 px-6 font-medium">Durată</th>
                                <th className="py-4 px-6 font-medium">Înregistrare</th>
                                <th className="py-4 px-6 text-right font-medium">Link</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-700/50 rounded w-32"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-700/50 rounded w-24"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-700/50 rounded w-16"></div></td>
                                        <td className="py-4 px-6"><div className="h-8 bg-gray-700/50 rounded w-64"></div></td>
                                        <td className="py-4 px-6"><div className="h-8 bg-gray-700/50 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : recordings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="material-icons-round text-4xl opacity-20">mic_off</span>
                                            <p className="font-light">Nu există înregistrări disponibile pentru {selectedBrand}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recordings.map((rec) => (
                                    <tr key={rec.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-primary">
                                                    <span className="material-icons-round text-sm">calendar_today</span>
                                                </div>
                                                <span className="dark:text-gray-200 font-light font-num">{formatDate(rec.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    className={`material-icons-round text-sm ${rec.direction === 'inbound' ? 'text-green-400' : 'text-blue-400'}`}
                                                    title={rec.direction === 'inbound' ? 'Apel Primit' : 'Apel Inițiat'}
                                                >
                                                    {rec.direction === 'inbound' ? 'call_received' : 'call_made'}
                                                </span>
                                                <span className="font-num text-gray-300 tracking-wide">{rec.phone_number || 'Necunoscut'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-round text-gray-500 text-sm">schedule</span>
                                                <span className="font-num text-gray-300">{formatDuration(rec.duration_seconds)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <audio 
                                                controls 
                                                className="h-8 w-64 opacity-80 hover:opacity-100 transition-opacity"
                                                src={rec.recording_url}
                                                preload="none"
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <a 
                                                href={rec.recording_url} 
                                                download 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 btn-3d-secondary rounded-lg inline-flex items-center justify-center hover:text-primary transition-colors"
                                                title="Descarcă înregistrarea"
                                            >
                                                <span className="material-icons-round text-lg">download</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {!loading && recordings.length > 0 && (
                <div className="text-center">
                    <p className="text-xs text-gray-500 font-light italic">
                        Se afișează ultimele {recordings.length} înregistrări pentru {selectedBrand}.
                    </p>
                </div>
            )}
        </div>
    );
}