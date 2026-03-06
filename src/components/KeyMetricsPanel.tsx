import { useOptions } from '../context/useOptions';
import { calculateStrategyMetrics } from '../utils/calculations';

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

const formatBreakEvenDisplay = (metrics: ReturnType<typeof calculateStrategyMetrics>): string => {
    if (
        metrics.breakEvenRanges.length === 1 &&
        metrics.breakEvenRanges[0].start === 0 &&
        metrics.breakEvenRanges[0].end === null &&
        metrics.breakEvens.length === 0
    ) {
        return 'All prices';
    }

    const labels = [
        ...metrics.breakEvenRanges.map(range => ({
            sortValue: range.start,
            label: range.end === null
                ? `${formatCurrency(range.start)} and above`
                : `${formatCurrency(range.start)} to ${formatCurrency(range.end)}`,
        })),
        ...metrics.breakEvens.map(point => ({
            sortValue: point,
            label: formatCurrency(point),
        })),
    ].sort((left, right) => left.sortValue - right.sortValue);

    return labels.length > 0
        ? labels.map(({ label }) => label).join(', ')
        : 'None';
};

export default function KeyMetricsPanel() {
    const { legs } = useOptions();

    if (legs.length === 0) return null;

    const metrics = calculateStrategyMetrics(legs);
    const displayMaxProfit = metrics.isMaxProfitUnlimited ? 'Unlimited' : formatCurrency(metrics.maxProfit);
    const displayMaxLoss = metrics.isMaxLossUnlimited ? 'Unlimited' : formatCurrency(Math.abs(metrics.maxLoss));
    const displayBreakEvens = formatBreakEvenDisplay(metrics);

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
                    {displayBreakEvens}
                </div>
            </div>
        </div>
    );
}
