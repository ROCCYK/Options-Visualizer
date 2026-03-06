import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useOptions } from '../context/OptionContext';
import { calculateDisplayDomain, generateChartData } from '../utils/calculations';
import { categoryThemeMap, type StrategyCategory } from '../utils/strategyPresets';

export default function ChartVisualizer() {
    const { legs, selectedStrategy, spotPrice } = useOptions();
    const domain = useMemo(() => calculateDisplayDomain(legs, spotPrice), [legs, spotPrice]);

    const data = useMemo(() => {
        return generateChartData(legs, domain.chartMinSpot, domain.chartMaxSpot, domain.chartStep);
    }, [domain, legs]);

    if (legs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-foreground/50 py-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                <p>Add an option leg to view the payoff chart.</p>
            </div>
        );
    }

    // Find min/max profit for custom domain if needed, or let recharts handle it
    // Customizing tooltip to show positive in green, negative in red
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass p-3 rounded-xl border border-white/10 text-sm">
                    <p className="font-bold mb-2">Spot: ${label}</p>
                    {payload.map((entry: any, index: number) => {
                        const val = Number(entry.value);
                        const isTotal = entry.dataKey === 'totalProfit';
                        const colorClass = val >= 0 ? 'text-green-400' : 'text-red-400';
                        return (
                            <div key={index} className={`flex justify-between gap-4 items-center ${isTotal ? 'font-bold mt-2 pt-2 border-t border-white/10' : 'text-foreground/70'}`}>
                                <div className="flex items-center gap-2">
                                    {!isTotal && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>}
                                    <span>{isTotal ? 'Total PnL' : `Leg ${entry.dataKey.substring(0, 4)}`}</span>
                                </div>
                                <span className={colorClass}>{val >= 0 ? '+' : ''}${val.toFixed(2)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    const maxProfit = Math.max(...data.map(d => d.totalProfit), 0);
    const minProfit = Math.min(...data.map(d => d.totalProfit), 0);
    const gradientOffset = (maxProfit === minProfit) ? 0 : maxProfit / (maxProfit - minProfit);
    const displayStrategy = selectedStrategy ?? { name: 'Custom Strategy', category: 'Manual' };
    const categoryBadgeClassName = displayStrategy.category in categoryThemeMap
        ? categoryThemeMap[displayStrategy.category as StrategyCategory].badgeClassName
        : 'border-white/10 bg-white/5 text-foreground/65';

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-1">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">Selected Strategy</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{displayStrategy.name}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${categoryBadgeClassName}`}>
                    {displayStrategy.category}
                </span>
            </div>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={gradientOffset} stopColor="#4ade80" stopOpacity={1} />
                            <stop offset={gradientOffset} stopColor="#f87171" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="spotPrice"
                        type="number"
                        domain={[domain.chartMinSpot, domain.chartMaxSpot]}
                        stroke="rgba(255,255,255,0.3)"
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fontSize: 12 }}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <ReferenceLine x={spotPrice} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: 'Current Spot', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />

                    {legs.map((leg) => (
                        <Line
                            key={leg.id}
                            type="linear"
                            dataKey={leg.id}
                            stroke={leg.color || "white"}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={0.7}
                        />
                    ))}

                    <Line
                        type="linear"
                        dataKey="totalProfit"
                        stroke="url(#splitColor)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: 'white', stroke: 'black' }}
                    />

                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
