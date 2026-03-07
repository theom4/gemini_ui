import React, { useState } from 'react';

// Approximate SVG paths for Romania, Bulgaria, Hungary, Serbia
// ViewBox: lon 14–32 → x 0–900, lat 41–50 → y 0–560  (scale: 50px/deg lon, 62.5px/deg lat)
// toX(lon) = (lon - 14) * 50    toY(lat) = (50 - lat) * 62.5

const COUNTRIES = [
    {
        id: 'hungary',
        name: 'Ungaria',
        color: '#a855f7',
        glow: 'rgba(168,85,247,0.35)',
        labelX: 250,
        labelY: 175,
        // Rough outline of Hungary
        d: 'M 105,156 L 145,125 L 205,112 L 270,94 L 345,100 L 395,106 L 445,119 L 450,150 L 430,181 L 395,194 L 330,200 L 270,194 L 215,200 L 175,213 L 145,213 L 105,200 Z',
    },
    {
        id: 'romania',
        name: 'România',
        color: '#22d3ee',
        glow: 'rgba(34,211,238,0.35)',
        labelX: 555,
        labelY: 188,
        // Rough outline of Romania
        d: 'M 395,106 L 445,88 L 505,62 L 570,75 L 640,81 L 705,100 L 770,125 L 795,175 L 790,238 L 775,288 L 750,313 L 695,319 L 635,325 L 580,319 L 530,325 L 490,313 L 455,281 L 450,250 L 450,213 L 430,181 L 395,194 L 395,175 L 395,106 Z',
    },
    {
        id: 'serbia',
        name: 'Serbia',
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.35)',
        labelX: 310,
        labelY: 300,
        // Rough outline of Serbia
        d: 'M 215,200 L 270,194 L 330,200 L 395,194 L 450,213 L 450,250 L 455,281 L 450,313 L 430,344 L 395,375 L 360,394 L 320,406 L 285,394 L 265,369 L 250,344 L 235,319 L 215,294 L 200,269 L 205,238 L 215,213 Z',
    },
    {
        id: 'bulgaria',
        name: 'Bulgaria',
        color: '#34d399',
        glow: 'rgba(52,211,153,0.35)',
        labelX: 555,
        labelY: 363,
        // Rough outline of Bulgaria
        d: 'M 450,313 L 490,313 L 530,325 L 580,319 L 635,325 L 695,319 L 750,313 L 765,344 L 755,388 L 720,425 L 670,444 L 610,456 L 550,463 L 490,456 L 440,444 L 405,425 L 385,400 L 360,394 L 395,375 L 430,344 L 450,313 Z',
    },
];

export default function StatisticiAdrese() {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Statistici Adrese</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Distribuția geografică a comenzilor</p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
                {COUNTRIES.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-gray-400">{c.name}</span>
                    </div>
                ))}
            </div>

            <div className="card-depth rounded-2xl border border-white/5 p-6 flex items-center justify-center">
                <svg
                    viewBox="70 50 760 450"
                    className="w-full max-w-4xl"
                    style={{ filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.6))' }}
                >
                    {/* Background grid lines — subtle */}
                    <defs>
                        <pattern id="grid" width="50" height="62.5" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 62.5" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </pattern>
                        {COUNTRIES.map(c => (
                            <filter key={c.id} id={`glow-${c.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feFlood floodColor={c.color} floodOpacity="0.4" result="color" />
                                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        ))}
                    </defs>
                    <rect x="70" y="50" width="760" height="450" fill="url(#grid)" rx="12" />

                    {/* Surrounding area (sea / neighboring countries feel) */}
                    <rect x="70" y="50" width="760" height="450" fill="rgba(13,14,25,0.6)" rx="12" />

                    {/* Countries */}
                    {COUNTRIES.map(c => {
                        const isHovered = hovered === c.id;
                        return (
                            <g
                                key={c.id}
                                onMouseEnter={() => setHovered(c.id)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                filter={isHovered ? `url(#glow-${c.id})` : undefined}
                            >
                                <path
                                    d={c.d}
                                    fill={isHovered ? c.color : `${c.color}33`}
                                    stroke={c.color}
                                    strokeWidth={isHovered ? 2.5 : 1.5}
                                    strokeLinejoin="round"
                                    style={{ transition: 'fill 0.2s, stroke-width 0.2s' }}
                                />
                                {/* Country label */}
                                <text
                                    x={c.labelX}
                                    y={c.labelY}
                                    textAnchor="middle"
                                    fill={isHovered ? '#fff' : c.color}
                                    fontSize="13"
                                    fontWeight={isHovered ? '600' : '400'}
                                    fontFamily="Inter, sans-serif"
                                    style={{ transition: 'fill 0.2s, font-weight 0.2s', pointerEvents: 'none' }}
                                >
                                    {c.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
