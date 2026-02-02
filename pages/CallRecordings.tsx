import React, { useState, useEffect, useRef } from 'react';
import { useCallRecordingsOptimized, CallRecording } from '../hooks/useCallRecordings';
import { useAuth } from '../contexts/AuthContext';

export default function CallRecordings() {
    const { profile, loading: authLoading } = useAuth();

    // Explicitly derive ID and Stores
    const userId = profile?.id || '';
    const userStores = profile?.stores || [];

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Auto-select first brand on load
    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            console.log(`🎯 [CallRecordings] Auto-selecting initial store: ${userStores[0]}`);
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [selectedBrand, startDate, endDate, activeSearch, statusFilter]);

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedRecording(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { recordings, totalCount, loading: recordingsLoading, isFetching, error } = useCallRecordingsOptimized(
        userId,
        selectedBrand,
        startDate,
        endDate,
        page,
        pageSize,
        activeSearch,
        statusFilter
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
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) return <span className="text-gray-500 font-light italic text-xs">Nespecificat</span>;
        const s = status.toLowerCase();
        let colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        if (s.includes('confirm')) colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        else if (s.includes('anulat')) colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
        else if (s.includes('neraspuns')) colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return <span className={`px-2 py-0.5 rounded-lg text-[10px] border font-medium ${colorClass}`}>{status}</span>;
    };

    if (!authLoading && userStores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <span className="material-icons-round text-6xl text-gray-700 mb-4 p-4 rounded-full bg-surface-dark-lighter border border-white/5">storefront</span>
                <h2 className="text-2xl font-light text-white mb-2">Niciun magazin configurat</h2>
                <p className="text-gray-500 max-w-md font-light">Contactați suportul Nanoassist pentru configurare.</p>
            </div>
        );
    }

    const isLoadingData = (recordingsLoading || isFetching) && recordings.length === 0;

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Înregistrări Apeluri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                        {selectedBrand ? `Conversații pentru ${selectedBrand}` : 'Selectați un magazin'}
                    </p>
                </div>

                <div className="flex-1 max-w-lg w-full relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-round text-gray-500">search</span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchInput)}
                        placeholder="Cauta dupa ID comanda sau telefon..."
                        className="w-full pl-10 pr-24 py-3 bg-[#13141a] border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-gray-200"
                    />
                    <button onClick={() => setActiveSearch(searchInput)} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-surface-dark-lighter border border-white/5 text-gray-400 hover:text-white text-xs font-medium rounded-lg transition-colors">Caută</button>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer outline-none" />
                        <span className="text-gray-600">-</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer outline-none" />
                    </div>

                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[160px] flex justify-between items-center h-[42px] hover:text-white transition-all">
                            <span>{selectedBrand || 'Selectează'}</span>
                            <span className={`material-icons-round transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-md">
                                    {userStores.map(store => (
                                        <button
                                            key={store}
                                            onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedBrand === store ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                            {store}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-depth p-1 rounded-2xl overflow-hidden min-h-[400px] border border-white/5 relative">
                {isFetching && !recordingsLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden">
                        <div className="h-full bg-primary animate-progress-indefinite w-1/3"></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-6 font-medium">Data</th>
                                <th className="py-4 px-6 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>Status</span>
                                        <div className="relative" ref={statusDropdownRef}>
                                            <button
                                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                                className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors"
                                                title="Filtrează după status"
                                            >
                                                <span className="material-icons-round text-sm">filter_list</span>
                                            </button>
                                            {isStatusDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)}></div>
                                                    <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-md">
                                                        <button
                                                            onClick={() => { setStatusFilter('all'); setIsStatusDropdownOpen(false); }}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'all' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                                            Toate
                                                        </button>
                                                        <button
                                                            onClick={() => { setStatusFilter('Confirmata'); setIsStatusDropdownOpen(false); }}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Confirmata' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                                            Confirmata
                                                        </button>
                                                        <button
                                                            onClick={() => { setStatusFilter('Anulata'); setIsStatusDropdownOpen(false); }}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Anulata' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                                            Anulata
                                                        </button>
                                                        <button
                                                            onClick={() => { setStatusFilter('Upsell'); setIsStatusDropdownOpen(false); }}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Upsell' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                                            Upsell
                                                        </button>
                                                        <button
                                                            onClick={() => { setStatusFilter('Neraspuns'); setIsStatusDropdownOpen(false); }}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Neraspuns' ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`}></span>
                                                            Neraspuns
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </th>
                                <th className="py-4 px-6 font-medium">Telefon</th>
                                <th className="py-4 px-6 font-medium">Durată</th>
                                <th className="py-4 px-6 font-medium">Înregistrare</th>
                                <th className="py-4 px-6 text-right font-medium">Acțiune</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800/50">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></span>
                                            <span className="text-gray-500 font-light italic">Se încarcă înregistrările...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : recordings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <span className="material-icons-round text-5xl mb-2">history</span>
                                            <span className="text-gray-500 font-light italic text-base">Nu s-au găsit înregistrări pentru perioada selectată.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recordings.map((rec) => (
                                    <tr key={rec.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 text-gray-300 font-num">{formatDate(rec.created_at)}</td>
                                        <td className="py-4 px-6">{getStatusBadge(rec.status)}</td>
                                        <td className="py-4 px-6 text-gray-300 font-num">{rec.phone_number || 'Necunoscut'}</td>
                                        <td className="py-4 px-6 text-gray-300 font-num">{formatDuration(rec.duration_seconds)}</td>
                                        <td className="py-4 px-6">
                                            <audio
                                                controls
                                                className="h-8 w-64 opacity-30 group-hover:opacity-100 transition-opacity"
                                                src={rec.recording_url}
                                                preload="none"
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button onClick={() => setSelectedRecording(rec)} className="w-8 h-8 btn-3d-secondary rounded-lg inline-flex items-center justify-center hover:text-white transition-colors">
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

            {!recordingsLoading && totalCount > 0 && (
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs text-gray-500 italic font-light">Afișare {recordings.length} din {totalCount} înregistrări</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 btn-3d-secondary rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">
                            <span className="material-icons-round">chevron_left</span>
                        </button>
                        <div className="px-4 flex items-center text-xs text-gray-400 font-num">
                            {page} / {totalPages}
                        </div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-9 h-9 btn-3d-secondary rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">
                            <span className="material-icons-round">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Recording Details Modal */}
            {selectedRecording && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedRecording(null)}
                    ></div>

                    {/* Modal Content */}
                    <div className="glass-panel-3d w-full max-w-2xl rounded-2xl overflow-hidden relative z-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-light text-white flex items-center gap-2">
                                <span className="material-icons-round text-primary">analytics</span>
                                Detalii Înregistrare
                                {selectedRecording.client_personal_id && (
                                    <span className="ml-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium">
                                        #{selectedRecording.client_personal_id}
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={() => setSelectedRecording(null)}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Client / Telefon</p>
                                    <p className="text-xl text-white font-num flex items-center gap-2">
                                        <span className="material-icons-round text-primary/70 text-lg">phone</span>
                                        {selectedRecording.phone_number || 'Necunoscut'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Dată & Oră</p>
                                    <p className="text-xl text-white font-num flex items-center gap-2">
                                        <span className="material-icons-round text-primary/70 text-lg">event</span>
                                        {formatDate(selectedRecording.created_at)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Durată Apel</p>
                                    <p className="text-xl text-white font-num flex items-center gap-2">
                                        <span className="material-icons-round text-primary/70 text-lg">schedule</span>
                                        {formatDuration(selectedRecording.duration_seconds)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Status Conversație</p>
                                    <div className="mt-1 flex">{getStatusBadge(selectedRecording.status)}</div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4 shadow-inner">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Ascultă Înregistrarea</p>
                                    <span className="text-[10px] text-gray-600 font-mono">ID: {selectedRecording.id}</span>
                                </div>
                                <audio controls className="w-full h-10 filter brightness-110" src={selectedRecording.recording_url} autoPlay={false} />
                            </div>

                            {selectedRecording.recording_transcript ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-round text-primary text-sm">auto_awesome</span>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Transcriere AI</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 max-h-60 overflow-y-auto text-sm text-gray-300 font-light leading-relaxed scrollbar-thin hover:border-white/10 transition-colors">
                                        {selectedRecording.recording_transcript}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl border border-dashed border-white/5 text-center">
                                    <span className="material-icons-round text-gray-700 text-3xl mb-2">description</span>
                                    <p className="text-xs text-gray-600 font-light italic">Nu există o transcriere disponibilă pentru acest apel.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-black/20 border-t border-white/5 flex justify-end items-center gap-4">
                            <p className="text-[10px] text-gray-600 mr-auto flex items-center gap-1 uppercase tracking-tighter">
                                <span className="material-icons-round text-xs">shield</span> SECURED BY NANOASSIST AI
                            </p>
                            <button
                                onClick={() => setSelectedRecording(null)}
                                className="btn-3d-secondary px-8 py-2.5 rounded-xl text-sm font-medium hover:text-white"
                            >
                                ÎNCHIDE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes progress-indefinite {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                .animate-progress-indefinite {
                    animation: progress-indefinite 1.5s infinite linear;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.2);
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.4);
                }
            `}</style>
        </div>
    );
}
