import { useState } from 'react';
import { useOptions } from '../context/OptionContext';
import { generateChartData } from '../utils/calculations';

export default function PayoffTable() {
    const { legs, spotPrice } = useOptions();
    const [showMath, setShowMath] = useState(false);

    if (legs.length === 0) return null;

    // Generate a few key data points: min strike, max strike, ATM, and +/- 10% ranges
    const strikes = legs.map(l => l.strike);
    const minStrike = Math.min(...strikes, spotPrice * 0.9);
    const maxStrike = Math.max(...strikes, spotPrice * 1.1);

    // Create 5-7 meaningful rows
    const step = Math.ceil((maxStrike - minStrike) / 6);
    const data = generateChartData(legs, Math.floor(minStrike), Math.ceil(maxStrike), step > 0 ? step : 1);

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
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
            <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-foreground/60">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Spot Price</th>
                            {legs.map((leg, i) => (
                                <th key={leg.id} className="px-4 py-3 font-normal whitespace-nowrap">Leg {i + 1} ({leg.type})</th>
                            ))}
                            <th className="px-4 py-3 text-primary font-bold whitespace-nowrap">Total Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium">${row.spotPrice.toFixed(2)}</td>
                                {legs.map(leg => {
                                    const val = row[leg.id];

                                    // Math breakdown
                                    const isCall = leg.type === 'Call';
                                    const isLong = leg.position === 'Long';
                                    const intrinsicValue = isCall ? Math.max(0, row.spotPrice - leg.strike) : Math.max(0, leg.strike - row.spotPrice);

                                    // Recreating the text explanation to avoid modifying calculations.ts heavily
                                    const payoff = intrinsicValue * leg.quantity;
                                    const cost = leg.premium * leg.quantity;
                                    const mathText = isLong
                                        ? `(${payoff.toFixed(0)} Payoff - ${cost.toFixed(0)} Cost)`
                                        : `(${cost.toFixed(0)} Credit - ${payoff.toFixed(0)} Payoff)`;

                                    // Moneyness
                                    let moneyness = 'ATM';
                                    let moneyColor = 'text-foreground/50 bg-white/5';
                                    if (row.spotPrice === leg.strike) {
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
                                    } else { // Put
                                        if (row.spotPrice < leg.strike) {
                                            moneyness = 'ITM';
                                            moneyColor = 'text-green-400/80 bg-green-400/10';
                                        } else {
                                            moneyness = 'OTM';
                                            moneyColor = 'text-red-400/80 bg-red-400/10';
                                        }
                                    }

                                    return (
                                        <td key={leg.id} className="px-4 py-3 min-w-[120px]">
                                            <div className={`font-medium ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {val >= 0 ? '+' : ''}${val.toFixed(2)}
                                            </div>
                                            {showMath && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80 flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 bg-background/50 w-fit px-1.5 py-0.5 rounded border border-white/5">
                                                        <span className={`px-1 rounded-[3px] font-bold ${moneyColor}`}>{moneyness}</span>
                                                        <span>IV: ${intrinsicValue.toFixed(2)}</span>
                                                    </div>
                                                    <span className="opacity-70">{mathText}</span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className={`px-4 py-3 font-bold ${row.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {row.totalProfit >= 0 ? '+' : ''}${row.totalProfit.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
