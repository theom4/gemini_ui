import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

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
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

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
                            Comenzi: <span style="color: #fff; font-weight: 600;">${value}</span>
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
                    roam: true, // Allow zooming/panning
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
            <div>
                <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Statistici Adrese</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Distribuția pe județe a comenzilor sosite</p>
            </div>

            <div className="card-depth rounded-2xl border border-white/5 relative flex-1 min-h-[500px] flex items-center justify-center overflow-hidden">
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
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
