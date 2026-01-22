import React, { useState, useEffect } from 'react';
import { useCallRecordingsOptimized, CallRecording } from '../hooks/useCallRecordings';

export default function CallRecordings() {
    const [selectedBrand, setSelectedBrand] = useState('Tamtrend');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Default to current date
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Modal state
    const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [selectedBrand, startDate, endDate, activeSearch]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Fetch data based on range, pagination and search
    // Note: The hook logic handles ignoring the date range if activeSearch is present
    const { recordings, totalCount, loading, error, isRefetching } = useCallRecordingsOptimized(
        selectedBrand, 
        startDate, 
        endDate, 
        page, 
        pageSize,
        activeSearch
    );

    const totalPages = Math.ceil(totalCount / pageSize);

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
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Înregistrări Apeluri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                        Ultimele conversații înregistrate de AI
                    </p>
                </div>
                
                {/* Search Bar */}
                <div className="flex-1 max-w-lg w-full mx-auto xl:mx-8 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons-round text-gray-500 text-lg group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input 
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Cauta dupa numar comanda..."
                        className="w-full pl-10 pr-24 py-3 bg-[#13141a] border border-white/5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner font-light"
                    />
                    <button 
                        onClick={handleSearch}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-surface-dark-lighter border border-white/5 hover:bg-primary/20 hover:text-white hover:border-primary/30 text-gray-400 text-xs font-medium rounded-lg transition-all uppercase tracking-wider shadow-sm"
                    >
                        Caută
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center relative z-50 xl:min-w-fit justify-end">
                    {isRefetching && (
                        <div className="flex items-center gap-2 text-primary text-sm animate-pulse mr-2">
                            <span className="material-icons-round text-sm">sync</span>
                            Actualizare...
                        </div>
                    )}

                    {/* Date Range Selectors - Disabled if searching */}
                    <div className={`flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner transition-opacity duration-200 ${activeSearch ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-round text-gray-500 text-sm">event</span>
                            </div>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-transparent text-gray-200 text-sm border-none focus:ring-0 rounded-lg cursor-pointer font-num outline-none hover:bg-white/5 transition-colors"
                            />
                        </div>
                        <span className="text-gray-600">-</span>
                        <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-round text-gray-500 text-sm">event</span>
                            </div>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-transparent text-gray-200 text-sm border-none focus:ring-0 rounded-lg cursor-pointer font-num outline-none hover:bg-white/5 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Brand Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm font-normal flex items-center gap-3 tracking-wide hover:text-white transition-all min-w-[160px] justify-between h-[42px]"
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
                                <th className="py-4 px-6 text-right font-medium">Detalii</th>
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
                                            {activeSearch ? (
                                                <>
                                                    <span className="material-icons-round text-4xl opacity-20">search_off</span>
                                                    <p className="font-light">Nu s-au găsit înregistrări pentru comanda "{activeSearch}".</p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-icons-round text-4xl opacity-20">mic_off</span>
                                                    <p className="font-light">Nu există înregistrări pentru perioada selectată ({startDate} - {endDate}).</p>
                                                </>
                                            )}
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
                                            <button
                                                onClick={() => setSelectedRecording(rec)}
                                                className="w-9 h-9 btn-3d-secondary rounded-lg inline-flex items-center justify-center hover:text-primary transition-colors group-hover:bg-purple-500/20"
                                                title="Vezi detalii și ID client"
                                            >
                                                <span className="material-icons-round text-lg">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Pagination Controls */}
            {!loading && totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <p className="text-xs text-gray-500 font-light italic">
                        Se afișează {recordings.length} din {totalCount} înregistrări.
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-9 h-9 btn-3d-secondary rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-colors"
                        >
                            <span className="material-icons-round">chevron_left</span>
                        </button>
                        
                        <span className="text-sm font-num text-gray-400 min-w-[80px] text-center">
                            Pagina {page} din {totalPages || 1}
                        </span>

                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="w-9 h-9 btn-3d-secondary rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-colors"
                        >
                            <span className="material-icons-round">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Recording Details Modal */}
            {selectedRecording && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRecording(null)}>
                    <div className="w-full max-w-2xl bg-[#13141a] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        
                        {/* Background effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
                            <div>
                                <h3 className="text-2xl text-white font-light tracking-tight">Detalii Înregistrare</h3>
                                <p className="text-sm text-gray-400 font-num mt-1 flex items-center gap-2">
                                    <span className="material-icons-round text-base">calendar_today</span>
                                    {formatDate(selectedRecording.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRecording(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="space-y-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Client ID Highlight */}
                            <div className="p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[30px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-purple-300 uppercase tracking-widest font-medium mb-2 flex items-center gap-2">
                                        <span className="material-icons-round text-sm">badge</span>
                                        ID Comanda
                                    </span>
                                    <span className={`text-2xl md:text-3xl font-mono tracking-wider ${selectedRecording.client_personal_id ? 'text-white text-shadow-glow' : 'text-gray-500 italic'}`}>
                                        {selectedRecording.client_personal_id || 'Nespecificat'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0a0b14]/50 rounded-xl p-4 border border-white/5">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Număr Telefon</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`material-icons-round text-base ${selectedRecording.direction === 'inbound' ? 'text-green-400' : 'text-blue-400'}`}>
                                            {selectedRecording.direction === 'inbound' ? 'call_received' : 'call_made'}
                                        </span>
                                        <span className="text-lg text-gray-200 font-num tracking-wide">{selectedRecording.phone_number || 'Necunoscut'}</span>
                                    </div>
                                </div>

                                <div className="bg-[#0a0b14]/50 rounded-xl p-4 border border-white/5">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Durată Apel</span>
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-round text-base text-gray-400">schedule</span>
                                        <span className="text-lg text-gray-200 font-num">{formatDuration(selectedRecording.duration_seconds)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Player Section */}
                            <div className="bg-[#0a0b14] rounded-xl p-4 border border-white/5 shadow-inner">
                                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3 pl-1">Redare Audio</span>
                                <audio
                                    controls
                                    className="w-full h-10 opacity-90"
                                    src={selectedRecording.recording_url}
                                />
                            </div>

                            {/* Transcript Section - NEW */}
                            <div className="bg-[#0a0b14]/80 rounded-xl p-5 border border-white/5 relative overflow-hidden">
                                <span className="text-xs text-purple-400 uppercase tracking-widest font-medium mb-3 flex items-center gap-2 relative z-10">
                                    <span className="material-icons-round text-sm">subtitles</span>
                                    Transcriere
                                </span>
                                <div className="max-h-[200px] overflow-y-auto pr-2 relative z-10 space-y-2">
                                    {selectedRecording.recording_transcript ? (
                                        <p className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-line font-sans">
                                            {selectedRecording.recording_transcript}
                                        </p>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-600 gap-2">
                                            <span className="material-icons-round text-2xl opacity-50">mic_off</span>
                                            <span className="text-xs italic">Indisponibilă</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/5 relative z-10 shrink-0">
                            <a
                                href={selectedRecording.recording_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 text-gray-300 hover:text-white transition-all hover:-translate-y-0.5"
                            >
                                <span className="material-icons-round text-lg">download</span>
                                Descarcă Audio
                            </a>
                            <button
                                onClick={() => setSelectedRecording(null)}
                                className="btn-3d-primary px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:brightness-110 transition-all hover:-translate-y-0.5"
                            >
                                Închide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}