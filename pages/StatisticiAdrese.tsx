import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAuth } from '../contexts/AuthContext';
import StoreSelector from '../components/StoreSelector';

interface CountyData {
    name: string;
    value: number;
}

// Mock data with specific values for requested counties
const MOCK_DATA: CountyData[] = [
    { name: 'Bucharest', value: 1500 },
    { name: 'Cluj', value: 800 },
    { name: 'Timis', value: 500 },
    // Rest are 0 by default, ECharts handles missing data as 0 or we can seed them if the JSON names match
];

export default function StatisticiAdrese() {
    const { profile } = useAuth();
    const userStores = profile?.stores || [];

    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
    const [randomOrders, setRandomOrders] = useState<number>(0);
    const [randomWrong, setRandomWrong] = useState<number>(0);

    // Auto-select first store
    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    useEffect(() => {
        // Fetch local Romania GeoJSON
        const fetchGeoJson = async () => {
            try {
                // Fetch the GeoJSON which we saved to the public directory
                const res = await fetch('/romania-counties.json');
                if (!res.ok) throw new Error('Network response was not ok');
                const geojson = await res.json();
                echarts.registerMap('ROMANIA_COUNTIES', geojson);
                setMapLoaded(true);
            } catch (e) {
                console.warn('Failed to fetch local GeoJSON', e);
                setMapError('Nu s-a putut încărca harta județelor (Eroare rețea). Verificați dacă fisierul exista in public/romania-counties.json');
            }
        };

        fetchGeoJson();
    }, []);

    const getEchartsOption = () => {
        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(19, 20, 26, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textStyle: {
                    color: '#e5e7eb', // gray-200
                    fontFamily: 'Inter, sans-serif'
                },
                padding: [12, 16],
                formatter: (params: any) => {
                    const value = params.value || 0;
                    // Provide a nice fallback name
                    let countyName = params.name || 'Necunoscut';
                    if (countyName === 'Bucharest') countyName = 'București';
                    if (countyName === 'Timis') countyName = 'Timiș';

                    return `
                        <div style="font-weight: 600; margin-bottom: 4px; color: #a855f7;">${countyName}</div>
                        <div style="font-size: 13px; color: #9ca3af;">
                            Total comenzi: <span style="color: #fff; font-weight: 600;">${value}</span>
                        </div>
                    `;
                }
            },
            visualMap: {
                min: 0,
                max: 1500,
                left: 'right',
                bottom: '10%',
                text: ['1500+', '0'], // High, Low
                textStyle: { color: '#9ca3af' }, // gray-400
                calculable: true,
                inRange: {
                    // Start deeply neutral (for 0 values), go up to bright purple/cyan
                    color: ['#1e1f2e', '#4f46e5', '#8b5cf6', '#a855f7', '#d946ef']
                },
                itemWidth: 15,
                itemHeight: 120,
            },
            series: [
                {
                    name: 'Comenzi',
                    type: 'map',
                    map: 'ROMANIA_COUNTIES',
                    roam: false, // Disables zooming/panning
                    zoom: 1.1, // Initial zoom
                    aspectScale: 1.1, // <-- this makes it wider horizontally (fixes the vertical stretch)
                    itemStyle: {
                        borderColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        areaColor: '#1e1f2e', // Default fallback map color
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#3b82f6', // bright blue on hover
                            shadowBlur: 10,
                            shadowColor: 'rgba(59, 130, 246, 0.5)'
                        },
                        label: {
                            show: true,
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    },
                    select: {
                        itemStyle: {
                            areaColor: '#a855f7'
                        },
                        label: { show: true, color: '#fff' }
                    },
                    data: MOCK_DATA
                }
            ]
        };
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Statistici Adrese</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                        {selectedBrand ? `Distribuția comenzilor pe județe pentru ${selectedBrand}` : 'Distribuția pe județe a comenzilor sosite'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-3 pr-3 py-2 bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer font-num outline-none" />
                        <span className="text-gray-600">-</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-3 pr-3 py-2 bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer font-num outline-none" />
                    </div>

                    <StoreSelector
                        selectedBrand={selectedBrand}
                        setSelectedBrand={setSelectedBrand}
                        userStores={userStores}
                    />
                </div>
            </div>

            <div className="card-depth rounded-2xl border border-white/5 relative flex-1 min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute top-6 right-6 z-10 bg-[#13141a]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg min-w-[280px] max-w-xs pointer-events-auto">
                    {!selectedCounty ? (
                        <p className="text-gray-300 text-sm font-medium leading-relaxed">
                            Selecteaza judetul pentru a vedea numarul de comenzi si adrese gresite
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-white tracking-tight">{selectedCounty}</h3>
                                <button onClick={() => setSelectedCounty(null)} className="text-gray-500 hover:text-white transition-colors flex items-center justify-center">
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Total comenzi:</span>
                                    <span className="font-num font-semibold text-purple-400 text-base">{randomOrders}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Adrese greșite:</span>
                                    <span className="font-num font-semibold text-red-400 text-base">{randomWrong}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {mapError && (
                    <div className="text-red-400 text-sm">{mapError}</div>
                )}

                {!mapLoaded && !mapError && (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <span className="material-icons-round animate-spin text-2xl text-purple-500">autorenew</span>
                        <span className="text-sm">Se încarcă harta județelor...</span>
                    </div>
                )}

                {mapLoaded && (
                    <div className="absolute inset-0 w-full h-full p-2">
                        <ReactECharts
                            option={getEchartsOption()}
                            style={{ height: '100%', width: '100%' }}
                            notMerge={true}
                            lazyUpdate={true}
                            onEvents={{
                                click: (params: any) => {
                                    if (params.name) {
                                        let countyName = params.name;
                                        if (countyName === 'Bucharest') countyName = 'București';
                                        if (countyName === 'Timis') countyName = 'Timiș';

                                        setSelectedCounty(countyName);
                                        setRandomOrders(Math.floor(Math.random() * 900) + 100);
                                        setRandomWrong(Math.floor(Math.random() * 90) + 10);
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
