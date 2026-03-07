import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const dummyData = [
    {
        produs: 'Tricou Clasic Alb',
        comenzi: 142, drafturi: 18, bucatiVandute: 198,
        upsellComenziPct: 24, upsellComenziHistory: [12, 18, 20, 22, 19, 24, 24],
        upsellDrafturiPct: 39, upsellDrafturiHistory: [20, 25, 30, 33, 36, 38, 39],
        sanatate: 92,
    },
    {
        produs: 'Pantaloni Sport Negri',
        comenzi: 98, drafturi: 11, bucatiVandute: 134,
        upsellComenziPct: 21, upsellComenziHistory: [8, 10, 14, 17, 18, 20, 21],
        upsellDrafturiPct: 36, upsellDrafturiHistory: [15, 22, 28, 30, 32, 35, 36],
        sanatate: 87,
    },
    {
        produs: 'Geacă Impermeabilă',
        comenzi: 76, drafturi: 23, bucatiVandute: 89,
        upsellComenziPct: 20, upsellComenziHistory: [18, 22, 20, 16, 18, 19, 20],
        upsellDrafturiPct: 39, upsellDrafturiHistory: [28, 32, 40, 36, 38, 39, 39],
        sanatate: 74,
    },
    {
        produs: 'Șosete Premium 3-Pack',
        comenzi: 210, drafturi: 5, bucatiVandute: 630,
        upsellComenziPct: 28, upsellComenziHistory: [10, 14, 18, 22, 25, 27, 28],
        upsellDrafturiPct: 40, upsellDrafturiHistory: [20, 26, 30, 35, 38, 40, 40],
        sanatate: 97,
    },
    {
        produs: 'Bluză Lână Merinos',
        comenzi: 55, drafturi: 31, bucatiVandute: 61,
        upsellComenziPct: 16, upsellComenziHistory: [20, 18, 14, 12, 15, 14, 16],
        upsellDrafturiPct: 39, upsellDrafturiHistory: [30, 34, 38, 36, 40, 38, 39],
        sanatate: 61,
    },
];

function SparkBar({
    history, pct, color, trackColor, labelColor,
}: {
    history: number[]; pct: number; color: string; trackColor: string; labelColor: string;
}) {
    const max = Math.max(...history, 1);
    const w = 56, h = 28, barW = 5, gap = 2;
    const total = history.length * barW + (history.length - 1) * gap;
    const offsetX = (w - total) / 2;
    return (
        <div className="flex items-center gap-2">
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
                {history.map((v, i) => {
                    const barH = Math.max(2, (v / max) * (h - 4));
                    const x = offsetX + i * (barW + gap);
                    const y = h - barH;
                    const isLast = i === history.length - 1;
                    return (
                        <rect key={i} x={x} y={y} width={barW} height={barH} rx={1.5}
                            fill={isLast ? color : trackColor}
                            opacity={isLast ? 1 : 0.55 + i * 0.05}
                        />
                    );
                })}
            </svg>
            <span className={`text-[11px] font-num font-semibold ${labelColor}`}>{pct}%</span>
        </div>
    );
}

function HealthBar({ value }: { value: number }) {
    const color = value >= 85 ? 'bg-emerald-500' : value >= 65 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = value >= 85 ? 'text-emerald-400' : value >= 65 ? 'text-amber-400' : 'text-red-400';
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-20">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className={`text-xs font-num font-medium ${textColor}`}>{value}%</span>
        </div>
    );
}

export default function StatisticiProduse() {
    const { profile } = useAuth();
    const userStores = profile?.stores || [];

    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* Title */}
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Statistici Vanzari per Produs</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                        {selectedBrand ? `Date statistice pentru ${selectedBrand}` : 'Date statistice pe produse'}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 items-center justify-end">
                    {/* Date range */}
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer outline-none"
                        />
                        <span className="text-gray-600">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer outline-none"
                        />
                    </div>

                    {/* Store selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[160px] flex justify-between items-center h-[42px] hover:text-white transition-all"
                        >
                            <span>{selectedBrand || 'Selectează'}</span>
                            <span className={`material-icons-round transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-md">
                                    {userStores.map(store => (
                                        <button
                                            key={store}
                                            onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedBrand === store ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-gray-600'}`} />
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-6 font-medium">Produs</th>
                                <th className="py-4 px-6 font-medium">Comenzi</th>
                                <th className="py-4 px-6 font-medium">Drafturi</th>
                                <th className="py-4 px-6 font-medium">Bucati Vandute</th>
                                <th className="py-4 px-6 font-medium">Upsell Comenzi</th>
                                <th className="py-4 px-6 font-medium">Upsell Drafturi</th>
                                <th className="py-4 px-6 font-medium">
                                    <div className="relative inline-flex items-center gap-1 group/tip cursor-default">
                                        <span>Sanatate</span>
                                        <span className="material-icons-round text-gray-600 text-sm">info</span>
                                        {/* Tooltip */}
                                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-[#13141a] border border-white/10 shadow-2xl text-gray-300 text-[11px] font-light leading-relaxed normal-case tracking-normal opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50 whitespace-normal">
                                            Reprezintă cât de rentabil este să menții upsell-urile pe acest produs. Dacă este mică, înseamnă că trebuie să schimbi produsul.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#13141a]" />
                                        </div>
                                    </div>
                                </th>
                                <th className="py-4 px-6 font-medium">
                                    <div className="relative inline-flex items-center gap-1 group/tip2 cursor-default">
                                        <span>Acțiune</span>
                                        <span className="material-icons-round text-gray-600 text-sm">info</span>
                                        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl bg-[#13141a] border border-white/10 shadow-2xl text-gray-300 text-[11px] font-light leading-relaxed normal-case tracking-normal opacity-0 group-hover/tip2:opacity-100 transition-opacity duration-200 z-50 whitespace-normal">
                                            Începe analiza apelurilor, ce a mers la upsell și ce nu a mers.
                                            <div className="absolute top-full right-4 border-4 border-transparent border-t-[#13141a]" />
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800/50">
                            {dummyData.map((row, i) => (
                                <tr key={i} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-6 text-gray-200 font-medium">{row.produs}</td>
                                    <td className="py-4 px-6 text-gray-300 font-num">{row.comenzi}</td>
                                    <td className="py-4 px-6 text-gray-300 font-num">{row.drafturi}</td>
                                    <td className="py-4 px-6 text-gray-300 font-num">{row.bucatiVandute}</td>
                                    <td className="py-4 px-6">
                                        <SparkBar
                                            history={row.upsellComenziHistory} pct={row.upsellComenziPct}
                                            color="#a855f7" trackColor="rgba(168,85,247,0.25)" labelColor="text-purple-400"
                                        />
                                    </td>
                                    <td className="py-4 px-6">
                                        <SparkBar
                                            history={row.upsellDrafturiHistory} pct={row.upsellDrafturiPct}
                                            color="#60a5fa" trackColor="rgba(96,165,250,0.25)" labelColor="text-blue-400"
                                        />
                                    </td>
                                    <td className="py-4 px-6">
                                        <HealthBar value={row.sanatate} />
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => { }}
                                            className="btn-3d-secondary px-4 py-2 rounded-xl text-xs font-medium hover:text-white transition-all whitespace-nowrap"
                                        >
                                            Analizeaza vanzare
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
