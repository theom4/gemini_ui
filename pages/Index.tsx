import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

const Index = () => {
    const { latestMetrics, historyMetrics, loading } = useDashboardMetrics();

    // Format history data for Area Chart
    const orderData = historyMetrics.length > 0 
        ? historyMetrics.map(metric => ({
            name: new Date(metric.created_at).toLocaleDateString('ro-RO', { weekday: 'short' }),
            confirmed: metric.comenzi_confirmate || 0,
            abandoned: metric.cosuri_abandonate || 0
          }))
        : [
            { name: 'Lun', confirmed: 0, abandoned: 0 },
            { name: 'Mar', confirmed: 0, abandoned: 0 },
            { name: 'Mie', confirmed: 0, abandoned: 0 },
            { name: 'Joi', confirmed: 0, abandoned: 0 },
            { name: 'Vin', confirmed: 0, abandoned: 0 },
            { name: 'Sâm', confirmed: 0, abandoned: 0 },
            { name: 'Dum', confirmed: 0, abandoned: 0 },
        ];

    // Pie Chart Data based on latest metrics or default
    const conversionRate = latestMetrics?.rata_conversie || 0;
    const abandonedRate = 100 - conversionRate;
    
    const conversionData = [
        { name: 'Finalizate', value: conversionRate },
        { name: 'Abandonate', value: abandonedRate < 0 ? 0 : abandonedRate },
    ];
    const conversionColors = ['#8b5cf6', '#374151'];

    // Widget Data
    const totalComenzi = latestMetrics?.total_comenzi || 0;
    const cosuriRecuperate = latestMetrics?.cosuri_recuperate || 0;
    const comenziConfirmate = latestMetrics?.comenzi_confirmate || 0; 
    const vanzariGenerate = latestMetrics?.vanzari_generate || 0;

    // Helper for loading state
    const displayValue = (val: number | string) => {
        if (loading && !latestMetrics) return '...';
        return val;
    };

    return (
        <>
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Bine ai revenit, Admin! <span className="inline-block animate-bounce">👋</span></h2>
                </div>
                <div className="flex gap-3">
                    <button className="btn-3d-secondary px-6 py-3 rounded-xl text-sm font-normal flex items-center gap-2 tracking-wide">
                        <span className="material-icons-round text-base">file_download</span>
                        EXPORTĂ
                    </button>
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

                {/* Widget 4: Vanzari Generate */}
                <div className="widget-sculpted-3d p-6 rounded-2xl bg-gradient-to-b from-[#0a0b14] via-[#1a0f30] to-[#5943b6] text-white shadow-[0_20px_30px_-4px_rgba(0,0,0,0.6),-2px_-2px_4px_rgba(255,255,255,0.03),inset_4px_4px_15px_rgba(0,0,0,0.9),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border border-white/5">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Orders Chart */}
                <div className="lg:col-span-2 card-depth p-6 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-light dark:text-white tracking-tight">Volum Recuperări</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1">Coșuri recuperate vs abandonate (ultimele 7 zile)</p>
                        </div>
                        <div className="flex p-1 bg-surface-dark-lighter rounded-xl border border-white/5 shadow-inner">
                            <button className="px-4 py-1.5 text-xs font-normal rounded-lg text-gray-400 hover:text-white transition-colors">Zi</button>
                            <button className="px-4 py-1.5 text-xs font-normal rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">Săptămână</button>
                            <button className="px-4 py-1.5 text-xs font-normal rounded-lg text-gray-400 hover:text-white transition-colors">Lună</button>
                        </div>
                    </div>
                    <div className="h-80 w-full relative">
                         <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none rounded-xl"></div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={orderData}>
                                <defs>
                                    <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(22, 24, 34, 0.9)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#fff' }}
                                    itemStyle={{ color: '#cbd5e1' }}
                                />
                                <Area type="monotone" dataKey="confirmed" name="Recuperate" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorConfirmed)" />
                                <Area type="monotone" dataKey="abandoned" name="Abandonate" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorAbandoned)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Chart */}
                <div className="lg:col-span-1 card-depth p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-light dark:text-white tracking-tight">Rată de Conversie</h3>
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
                    <a className="text-sm text-primary hover:text-purple-300 font-normal flex items-center gap-1 transition-colors" href="#">
                        Vezi toate
                        <span className="material-icons-round text-base">arrow_forward</span>
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-normal text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                <th className="py-4 px-4">ID Comandă</th>
                                <th className="py-4 px-4">Client</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4">Valoare</th>
                                <th className="py-4 px-4">Dată</th>
                                <th className="py-4 px-4 text-right">Acțiune</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="group hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0">
                                <td className="py-4 px-4 font-light dark:text-white font-num">#ORD-7782</td>
                                <td className="py-4 px-4">
                                    <span className="dark:text-gray-300 font-light">John Doe</span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-lg text-xs font-normal bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)] inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        Confirmat
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-light dark:text-white font-num">450.00 RON</td>
                                <td className="py-4 px-4 text-gray-500 font-light">Acum 2 min</td>
                                <td className="py-4 px-4 text-right">
                                    <button className="w-9 h-9 btn-3d-secondary rounded-lg flex items-center justify-center ml-auto">
                                        <span className="material-icons-round">arrow_forward</span>
                                    </button>
                                </td>
                            </tr>
                            <tr className="group hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0">
                                <td className="py-4 px-4 font-light dark:text-white font-num">#CRT-2991</td>
                                <td className="py-4 px-4">
                                    <span className="dark:text-gray-300 font-light">Ana Smith</span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-lg text-xs font-normal bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)] inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                        Anulat
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-light dark:text-white font-num">1,200.00 RON</td>
                                <td className="py-4 px-4 text-gray-500 font-light">Acum 15 min</td>
                                <td className="py-4 px-4 text-right">
                                    <button className="w-9 h-9 btn-3d-secondary rounded-lg flex items-center justify-center ml-auto">
                                        <span className="material-icons-round">arrow_forward</span>
                                    </button>
                                </td>
                            </tr>
                             <tr className="group hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0">
                                <td className="py-4 px-4 font-light dark:text-white font-num">#ORD-7781</td>
                                <td className="py-4 px-4">
                                    <span className="dark:text-gray-300 font-light">Maria Pop</span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-lg text-xs font-normal bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)] inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        Confirmat
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-light dark:text-white font-num">230.50 RON</td>
                                <td className="py-4 px-4 text-gray-500 font-light">Acum 42 min</td>
                                <td className="py-4 px-4 text-right">
                                    <button className="w-9 h-9 btn-3d-secondary rounded-lg flex items-center justify-center ml-auto">
                                        <span className="material-icons-round">arrow_forward</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Index;