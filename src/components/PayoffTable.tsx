import { useEffect, useMemo, useRef, useState } from 'react';
import { useOptions } from '../context/useOptions';
import {
    calculateDisplayDomain,
    calculateEntryCost,
    calculateGrossLegValueAtExpiration,
    calculateOptionIntrinsicValue,
    generateChartData
} from '../utils/calculations';

export default function PayoffTable() {
    const { legs, spotPrice } = useOptions();
    const [showMath, setShowMath] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const spotRowRef = useRef<HTMLTableRowElement | null>(null);
    const hasLegs = legs.length > 0;
    const domain = useMemo(() => (
        hasLegs ? calculateDisplayDomain(legs, spotPrice) : null
    ), [hasLegs, legs, spotPrice]);
    const data = useMemo(() => (
        domain
            ? generateChartData(legs, domain.chartMinSpot, domain.chartMaxSpot, domain.chartStep, [spotPrice])
            : []
    ), [domain, legs, spotPrice]);
    const closestSpotIndex = data.reduce((closestIndex, row, index) => {
        const currentDistance = Math.abs(row.spotPrice - spotPrice);
        const closestDistance = Math.abs(data[closestIndex].spotPrice - spotPrice);

        return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const row = spotRowRef.current;

        if (!hasLegs || !container || !row) {
            return;
        }

        const targetScrollTop = row.offsetTop - ((container.clientHeight - row.clientHeight) / 2);
        container.scrollTop = Math.max(0, targetScrollTop);
    }, [closestSpotIndex, hasLegs, showMath]);

    if (!hasLegs) return null;

    return (
        <div className="mt-8">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-4">
                <h3 className="text-lg font-bold text-purple-300">Payoff Table</h3>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/70 hover:text-foreground transition-colors">
                    <input
                        type="checkbox"
                        checked={showMath}
                        onChange={(e) => setShowMath(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    Show detailed math
                </label>
            </div>
            <div ref={scrollContainerRef} className="overflow-auto rounded-xl border border-white/10 max-h-[500px]">
                <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                    <thead className="bg-background/95 backdrop-blur sticky top-0 border-b border-white/10 uppercase text-xs text-foreground/60 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap bg-background">Spot Price</th>
                            {legs.map((leg, i) => (
                                <th key={leg.id} className="px-4 py-3 font-normal whitespace-nowrap bg-background">
                                    Leg {i + 1} <span className={leg.position === 'Long' ? 'text-green-400' : 'text-red-400'}>({leg.position === 'Long' ? 'Buy' : 'Sell'} {leg.type})</span>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-primary font-bold whitespace-nowrap bg-background">Total Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => {
                            const isCurrentSpotRow = i === closestSpotIndex;

                            return (
                                <tr
                                    key={i}
                                    ref={isCurrentSpotRow ? spotRowRef : null}
                                    className={`border-b border-white/5 transition-colors ${
                                        isCurrentSpotRow ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className={isCurrentSpotRow ? 'text-primary font-semibold' : ''}>
                                                ${row.spotPrice.toFixed(2)}
                                            </span>
                                            {isCurrentSpotRow && (
                                                <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                                                    Current Spot
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                {legs.map(leg => {
                                    const val = row[leg.id];
                                    const isCall = leg.type === 'Call';
                                    const isStock = leg.type === 'Stock';
                                    const isLong = leg.position === 'Long';
                                    const intrinsicValue = calculateOptionIntrinsicValue(row.spotPrice, leg);
                                    const grossValue = calculateGrossLegValueAtExpiration(row.spotPrice, leg);
                                    const cost = calculateEntryCost(leg);
                                    const mathText = isLong
                                        ? `(${grossValue.toFixed(2)} Payoff - ${cost.toFixed(2)} Cost)`
                                        : `(${cost.toFixed(2)} Credit - ${grossValue.toFixed(2)} Payoff)`;

                                    let moneyness = 'ATM';
                                    let moneyColor = 'text-foreground/50 bg-white/5';
                                    if (isStock) {
                                        moneyness = 'N/A';
                                    } else if (row.spotPrice === leg.strike) {
                                        moneyness = 'ATM';
                                        moneyColor = 'text-yellow-400/80 bg-yellow-400/10';
                                    } else if (isCall) {
                                        if (row.spotPrice > leg.strike) {
                                            moneyness = 'ITM';
                                            moneyColor = 'text-green-400/80 bg-green-400/10';
                                        } else {
                                            moneyness = 'OTM';
                                            moneyColor = 'text-red-400/80 bg-red-400/10';
                                        }
                                    } else if (row.spotPrice < leg.strike) {
                                        moneyness = 'ITM';
                                        moneyColor = 'text-green-400/80 bg-green-400/10';
                                    } else {
                                        moneyness = 'OTM';
                                        moneyColor = 'text-red-400/80 bg-red-400/10';
                                    }

                                    const payoffFormulaStr = isCall
                                        ? `max(0, ${row.spotPrice.toFixed(0)} - ${leg.strike})`
                                        : `max(0, ${leg.strike} - ${row.spotPrice.toFixed(0)})`;

                                    const payoffString = leg.quantity > 1
                                        ? `${payoffFormulaStr} x ${leg.quantity}`
                                        : payoffFormulaStr;

                                    return (
                                        <td key={leg.id} className="px-4 py-3 min-w-[120px]">
                                            <div className={`font-medium ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {val >= 0 ? '+' : ''}${val.toFixed(2)}
                                            </div>
                                            {showMath && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80 flex flex-col gap-1">
                                                    {isStock ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 bg-background/50 w-fit px-1.5 py-0.5 rounded border border-white/5">
                                                                <span className={`px-1 rounded-[3px] font-bold ${moneyColor}`}>{moneyness}</span>
                                                                <span>Value: ${grossValue.toFixed(2)}</span>
                                                            </div>
                                                            <span className="opacity-70">
                                                                PnL: {isLong
                                                                    ? `(${row.spotPrice.toFixed(2)} Spot - ${leg.premium.toFixed(2)} Entry) x ${leg.quantity}`
                                                                    : `(${leg.premium.toFixed(2)} Entry - ${row.spotPrice.toFixed(2)} Spot) x ${leg.quantity}`}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-1.5 bg-background/50 w-fit px-1.5 py-0.5 rounded border border-white/5">
                                                                <span className={`px-1 rounded-[3px] font-bold ${moneyColor}`}>{moneyness}</span>
                                                                <span>IV: ${intrinsicValue.toFixed(2)}</span>
                                                            </div>
                                                            <span className="opacity-70">
                                                                Payoff: {payoffString} = {grossValue.toFixed(2)}
                                                            </span>
                                                            <span className="opacity-70">
                                                                PnL: {mathText}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className={`px-4 py-3 font-bold ${row.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {row.totalProfit >= 0 ? '+' : ''}${row.totalProfit.toFixed(2)}
                                </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
