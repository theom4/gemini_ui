import React, { useState, useEffect, useRef } from 'react';
import { useCallRecordingsOptimized, CallRecording } from '../hooks/useCallRecordings';
import { useAuth } from '../contexts/AuthContext';

export default function CallRecordings() {
    const { session, profile } = useAuth();
    const userId = session?.user?.id || '';
    const userStores = profile?.stores || [];

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
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

    useEffect(() => {
        setPage(1);
    }, [selectedBrand, startDate, endDate, activeSearch, statusFilter]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { recordings, totalCount, loading, error, isRefetching } = useCallRecordingsOptimized(
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
        return <span className={`px-2 py-0.5 rounded text-[10px] border ${colorClass}`}>{status}</span>;
    };

    if (userStores.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <span className="material-icons-round text-6xl text-gray-700 mb-4">storefront</span>
                <h2 className="text-2xl font-light text-white mb-2">Niciun magazin configurat</h2>
                <p className="text-gray-500 max-w-md">Contactați suportul Nanoassist.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Înregistrări Apeluri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Ultimele conversații AI</p>
                </div>
                
                <div className="flex-1 max-w-lg w-full relative group">
                    <input 
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchInput)}
                        placeholder="Cauta ID sau telefon..."
                        className="w-full pl-10 pr-24 py-3 bg-[#13141a] border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button onClick={() => setActiveSearch(searchInput)} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-surface-dark-lighter border border-white/5 text-gray-400 text-xs rounded-lg">Caută</button>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-gray-200 text-sm outline-none cursor-pointer" />
                        <span className="text-gray-600">-</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-gray-200 text-sm outline-none cursor-pointer" />
                    </div>

                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[160px] flex justify-between items-center">
                            <span>{selectedBrand || 'Selectează'}</span>
                            <span className="material-icons-round">expand_more</span>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden">
                                {userStores.map(store => (
                                    <button 
                                        key={store} 
                                        onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5"
                                    >
                                        {store}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-depth p-1 rounded-2xl overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-6">Data</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Telefon</th>
                                <th className="py-4 px-6">Durată</th>
                                <th className="py-4 px-6">Înregistrare</th>
                                <th className="py-4 px-6 text-right">Detalii</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800/50">
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Se încarcă...</td></tr>
                            ) : recordings.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Fără rezultate.</td></tr>
                            ) : (
                                recordings.map((rec) => (
                                    <tr key={rec.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 text-gray-300">{formatDate(rec.created_at)}</td>
                                        <td className="py-4 px-6">{getStatusBadge(rec.status)}</td>
                                        <td className="py-4 px-6 text-gray-300">{rec.phone_number || 'Necunoscut'}</td>
                                        <td className="py-4 px-6 text-gray-300">{formatDuration(rec.duration_seconds)}</td>
                                        <td className="py-4 px-6">
                                            <audio controls className="h-8 w-64 opacity-80" src={rec.recording_url} preload="none" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button onClick={() => setSelectedRecording(rec)} className="w-8 h-8 btn-3d-secondary rounded-lg inline-flex items-center justify-center">
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
            
            {!loading && totalCount > 0 && (
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs text-gray-500 italic">Total: {totalCount} înregistrări</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 btn-3d-secondary rounded-lg disabled:opacity-50"><span className="material-icons-round">chevron_left</span></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 btn-3d-secondary rounded-lg disabled:opacity-50"><span className="material-icons-round">chevron_right</span></button>
                    </div>
                </div>
            )}
        </div>
    );
}