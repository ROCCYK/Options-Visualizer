import { useOptions } from '../context/OptionContext';
import { calculateStrategyMetrics } from '../utils/calculations';

export default function KeyMetricsPanel() {
    const { legs } = useOptions();

    if (legs.length === 0) return null;

    const metrics = calculateStrategyMetrics(legs);
    const displayMaxProfit = metrics.isMaxProfitUnlimited ? "Unlimited" : `$${metrics.maxProfit.toFixed(2)}`;
    const displayMaxLoss = metrics.isMaxLossUnlimited ? "Unlimited" : `$${Math.abs(metrics.maxLoss).toFixed(2)}`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Max Profit</div>
                <div className={`text-xl font-bold ${metrics.isMaxProfitUnlimited ? 'text-green-400' : 'text-primary'}`}>
                    {displayMaxProfit}
                </div>
            </div>

            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Max Risk (Loss)</div>
                <div className={`text-xl font-bold ${displayMaxLoss === 'Unlimited' ? 'text-red-500' : 'text-red-400'}`}>
                    {displayMaxLoss}
                </div>
            </div>

            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Break-Even Point(s)</div>
                <div className="text-xl font-bold text-foreground overflow-x-auto whitespace-nowrap">
                    {metrics.breakEvens.length > 0
                        ? metrics.breakEvens.map(bp => `$${bp.toFixed(2)}`).join(', ')
                        : 'None'}
                </div>
            </div>
        </div>
    );
}
