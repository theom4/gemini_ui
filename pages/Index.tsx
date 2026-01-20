import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useCallRecordingsOptimized } from '../hooks/useCallRecordings';
import { useChartData, ChartPeriod } from '../hooks/useChartData';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
    const [selectedBrand, setSelectedBrand] = useState('Tamtrend');
    const { latestMetrics, loading } = useDashboardMetrics(selectedBrand);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Date state for dashboard (Range)
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    // Chart Period State
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week');
    
    // Fetch Chart Data
    const { data: chartData, isLoading: isChartLoading } = useChartData(selectedBrand, chartPeriod);

    // Fetch recent recordings for the activity table (Limit 3) using the date range
    const { recordings: recentRecordings, loading: recordingsLoading } = useCallRecordingsOptimized(
        selectedBrand,
        startDate,
        endDate,
        1, // Page 1
        3  // Limit 3
    );

    const isInitialLoading = loading && !latestMetrics;
    const { session } = useAuth();

    // Pie Chart Data based on latest metrics or default
    const conversionRate = latestMetrics?.rata_conversie || 0;
    const abandonedRate = 100 - conversionRate;
    
    const conversionData = [
        { name: 'Finalizate', value: conversionRate },
        { name: 'Abandonate', value: abandonedRate < 0 ? 0 : abandonedRate },
    ];
    const conversionColors = ['#8b5cf6', '#374151'];

    // Dynamic Data for "Conversie Drafturi" from rata_conversie_drafturi
    const draftConversionRate = latestMetrics?.rata_conversie_drafturi || 0;
    const draftAbandonedRate = 100 - draftConversionRate;

    const draftData = [
        { name: 'Finalizate', value: draftConversionRate },
        { name: 'Abandonate', value: draftAbandonedRate < 0 ? 0 : draftAbandonedRate },
    ];
    // Using Emerald green (#10b981) similar to "Comenzi Confirmate" / "Cosuri Recuperate" accents
    const draftColors = ['#10b981', '#374151'];

    // Widget Data
    const totalComenzi = latestMetrics?.total_comenzi || 0;
    const cosuriRecuperate = latestMetrics?.cosuri_recuperate || 0;
    const comenziConfirmate = latestMetrics?.comenzi_confirmate || 0; 
    const vanzariGenerate = latestMetrics?.vanzari_generate || 0;

    // Helper for loading state
    const displayValue = (val: number | string) => {
        if (isInitialLoading) return '...';
        return val;
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Bine ai revenit, Admin! <span className="inline-block animate-bounce">👋</span></h2>
                </div>
                <div className="flex flex-wrap gap-3 relative z-50">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Widget 1: Total Comenzi */}
                <div className="widget-sculpted-3d p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="icon-cart-v3">
                                <span className="material-icons-round icon-cart-v3-symbol">shopping_cart</span>
                            </div>
                            <span className="flex items-center text-xs font-normal text-neon-green bg-[#00FF88]/10 px-2 py-1 rounded-lg border border-[#00FF88]/20 shadow-[0_0_10px_rgba(0,255,136,0.1)] font-num">
                                <span className="material-icons-round text-sm mr-1">trending_up</span> +12.35<span className="text-[0.6em] ml-0.5">%</span>
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-light mb-1">Comenzi Totale</p>
                            <h3 className="text-5xl font-light dark:text-white tracking-tight drop-shadow-md font-num glow-text">
                                {displayValue(totalComenzi.toLocaleString())}
                            </h3>
                        </div>
                        <div className="w-full h-1.5 bg-[#0a0b14] mt-5 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[70%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        </div>
                    </div>
                </div>

                {/* Widget 2: Cosuri Recuperate */}
                <div className="widget-sculpted-3d p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="icon-cart-v3">
                                <span className="material-icons-round icon-symbol-blue">check_circle</span>
                            </div>
                            <span className="flex items-center text-xs font-normal text-neon-green bg-[#00FF88]/10 px-2 py-1 rounded-lg border border-[#00FF88]/20 shadow-[0_0_10px_rgba(0,255,136,0.1)] font-num">
                                <span className="material-icons-round text-sm mr-1">trending_up</span> +5.12<span className="text-[0.6em] ml-0.5">%</span>
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-light mb-1">Coșuri Recuperate</p>
                            <h3 className="text-5xl font-light dark:text-white tracking-tight drop-shadow-md font-num glow-text">
                                {displayValue(cosuriRecuperate.toLocaleString())}
                            </h3>
                        </div>
                        <div className="w-full h-1.5 bg-[#0a0b14] mt-5 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-[85%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                    </div>
                </div>

                {/* Widget 3: Comenzi Confirmate */}
                <div className="widget-sculpted-3d p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="icon-cart-v3">
                                <span className="material-icons-round icon-symbol-emerald">verified</span>
                            </div>
                            <span className="flex items-center text-xs font-normal text-neon-green bg-[#00FF88]/10 px-2 py-1 rounded-lg border border-[#00FF88]/20 shadow-[0_0_10px_rgba(0,255,136,0.1)] font-num">
                                <span className="material-icons-round text-sm mr-1">trending_up</span> +8.45<span className="text-[0.6em] ml-0.5">%</span>
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-light mb-1">Comenzi Confirmate</p>
                            <h3 className="text-5xl font-light dark:text-white tracking-tight drop-shadow-md font-num glow-text">
                                {displayValue(comenziConfirmate.toLocaleString())}
                            </h3>
                        </div>
                        <div className="w-full h-1.5 bg-[#0a0b14] mt-5 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 w-[65%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                    </div>
                </div>

                {/* Widget 4: Vanzari Generate - FIXED BORDER */}
                <div className="widget-sculpted-3d p-6 rounded-2xl bg-gradient-to-b from-[#090a0e] from-10% via-[#1a0f30] to-[#5943b6] text-white shadow-[0_20px_30px_-4px_rgba(0,0,0,0.6),-2px_-2px_4px_rgba(255,255,255,0.03),inset_4px_4px_15px_rgba(0,0,0,0.9),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <div className="icon-cart-v3">
                                <span className="material-icons-round icon-symbol-purple">payments</span>
                            </div>
                            <span className="text-white flex items-center text-xs font-normal bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 font-num">
                                +18.25<span className="text-[0.6em] ml-0.5">%</span> azi
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-purple-200 font-light mb-1">Vânzări Generate</p>
                            <h3 className="text-4xl font-light mt-1 drop-shadow-md font-num glow-text">
                                {displayValue(loading && !latestMetrics ? '...' : `${vanzariGenerate.toLocaleString()} RON`)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Orders Chart - Now spans 2 columns */}
                <div className="lg:col-span-2 card-depth p-6 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-light dark:text-white tracking-tight">Volum</h3>
                        </div>
                        <div className="flex p-1 bg-surface-dark-lighter rounded-xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setChartPeriod('day')}
                                className={`px-4 py-1.5 text-xs font-normal rounded-lg transition-colors ${chartPeriod === 'day' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Zi
                            </button>
                            <button 
                                onClick={() => setChartPeriod('week')}
                                className={`px-4 py-1.5 text-xs font-normal rounded-lg transition-colors ${chartPeriod === 'week' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Săptămână
                            </button>
                            <button 
                                onClick={() => setChartPeriod('month')}
                                className={`px-4 py-1.5 text-xs font-normal rounded-lg transition-colors ${chartPeriod === 'month' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Lună
                            </button>
                        </div>
                    </div>
                    <div className="h-80 w-full relative">
                         <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none rounded-xl"></div>
                        <ResponsiveContainer width="100%" height="100%">
                            {isChartLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">Se încarcă graficul...</div>
                            ) : (
                                <AreaChart data={chartData || []}>
                                    <defs>
                                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDrafts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(22, 24, 34, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                                        itemStyle={{ color: '#cbd5e1' }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="calls" name="Apeluri" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                                    <Area yAxisId="left" type="monotone" dataKey="orders" name="Comenzi" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                                    <Area yAxisId="left" type="monotone" dataKey="drafts" name="Drafturi" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorDrafts)" />
                                    <Area yAxisId="right" type="monotone" dataKey="sales" name="Vânzări" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* NEW CARD: Conversie Drafturi */}
                <div className="lg:col-span-1 card-depth p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-light dark:text-white tracking-tight">Conversie Drafturi</h3>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="material-icons-round text-emerald-500 text-lg">drafts</span>
                        </div>
                    </div>
                    <div className="relative w-56 h-56 mx-auto my-4 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                        <div className="relative w-full h-full z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={draftData}
                                        innerRadius={75}
                                        outerRadius={90}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {draftData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={draftColors[index % draftColors.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none z-20">
                            <span className="text-5xl font-light dark:text-white drop-shadow-lg font-num glow-text">
                                {displayValue(draftConversionRate.toFixed(2))}<span className="text-2xl align-top">%</span>
                            </span>
                            <span className="text-xs font-normal text-gray-400 uppercase tracking-wide mt-1">Conversie</span>
                        </div>
                    </div>
                    <div className="space-y-3 bg-surface-dark-lighter/50 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-gray-400 font-light">Finalizate</span>
                            </div>
                            <span className="font-normal dark:text-white font-num">{displayValue(draftConversionRate.toFixed(2))}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"></span>
                                <span className="text-gray-400 font-light">Abandonate</span>
                            </div>
                            <span className="font-normal dark:text-white font-num">{displayValue(draftAbandonedRate.toFixed(2))}%</span>
                        </div>
                    </div>
                </div>

                {/* Conversion Chart - Upsell (Moved to span 1 in 4-col grid) */}
                <div className="lg:col-span-1 card-depth p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-light dark:text-white tracking-tight">Conversie Upsell</h3>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <span className="material-icons-round text-green-500 text-lg">trending_up</span>
                        </div>
                    </div>
                    <div className="relative w-56 h-56 mx-auto my-4 flex items-center justify-center">
                        <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                        <div className="relative w-full h-full z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={conversionData}
                                        innerRadius={75}
                                        outerRadius={90}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {conversionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={conversionColors[index % conversionColors.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none z-20">
                            <span className="text-5xl font-light dark:text-white drop-shadow-lg font-num glow-text">
                                {displayValue(conversionRate.toFixed(2))}<span className="text-2xl align-top">%</span>
                            </span>
                            <span className="text-xs font-normal text-gray-400 uppercase tracking-wide mt-1">Conversie</span>
                        </div>
                    </div>
                    <div className="space-y-3 bg-surface-dark-lighter/50 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
                                <span className="text-gray-400 font-light">Finalizate</span>
                            </div>
                            <span className="font-normal dark:text-white font-num">{displayValue(conversionRate.toFixed(2))}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"></span>
                                <span className="text-gray-400 font-light">Abandonate</span>
                            </div>
                            <span className="font-normal dark:text-white font-num">{displayValue(abandonedRate.toFixed(2))}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-depth p-6 rounded-2xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light dark:text-white tracking-tight">Activitate Recentă</h3>
                    <a className="text-sm text-primary hover:text-purple-300 font-normal flex items-center gap-1 transition-colors" href="/#/call-recordings">
                        Vezi toate
                        <span className="material-icons-round text-base">arrow_forward</span>
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-normal text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                <th className="py-4 px-4">ID Comandă</th>
                                <th className="py-4 px-4">Telefon</th>
                                <th className="py-4 px-4">Tip</th>
                                <th className="py-4 px-4">Durată</th>
                                <th className="py-4 px-4">Dată</th>
                                <th className="py-4 px-4 text-right">Acțiune</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {recordingsLoading ? (
                                <tr className="animate-pulse">
                                    <td colSpan={6} className="py-8 text-center text-gray-500 font-light">Se încarcă...</td>
                                </tr>
                            ) : recentRecordings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500 font-light">Nu există activitate recentă pentru perioada selectată.</td>
                                </tr>
                            ) : (
                                recentRecordings.map((rec) => (
                                    <tr key={rec.id} className="group hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0">
                                        <td className="py-4 px-4 font-light dark:text-white font-num">
                                            {rec.client_personal_id ? `#${rec.client_personal_id}` : <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="dark:text-gray-300 font-light font-num">{rec.phone_number || 'Necunoscut'}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-normal ${rec.direction === 'inbound' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'} shadow-sm inline-flex items-center gap-1`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${rec.direction === 'inbound' ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                                                {rec.direction === 'inbound' ? 'Primit' : 'Inițiat'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-light dark:text-white font-num">
                                            {formatDuration(rec.duration_seconds)}
                                        </td>
                                        <td className="py-4 px-4 text-gray-500 font-light">
                                            {formatDate(rec.created_at)}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <audio controls className="h-8 w-32 inline-block opacity-60 hover:opacity-100 transition-opacity" src={rec.recording_url} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Index;