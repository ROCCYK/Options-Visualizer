import type { OptionLeg, ChartDataPoint } from '../types/OptionTypes';

export const calculatePayoff = (spot: number, leg: OptionLeg): number => {
    const isCall = leg.type === 'Call';
    const isLong = leg.position === 'Long';

    let intrinsicValue = 0;
    if (isCall) {
        intrinsicValue = Math.max(0, spot - leg.strike);
    } else {
        intrinsicValue = Math.max(0, leg.strike - spot);
    }

    const payoff = intrinsicValue * leg.quantity;
    const cost = leg.premium * leg.quantity;

    // Profit = Payoff - Initial Cost (if long), Cost - Payoff (if short)
    const profit = isLong ? (payoff - cost) : (cost - payoff);

    return profit; // Assuming multiplier of 100 is handled at the display level if needed. Lecture just uses standard units.
};

export const generateChartData = (
    legs: OptionLeg[],
    minSpot: number,
    maxSpot: number,
    step = 1
): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];

    for (let spot = minSpot; spot <= maxSpot; spot += step) {
        const point: ChartDataPoint = {
            spotPrice: spot,
            totalProfit: 0,
        };

        let total = 0;
        legs.forEach(leg => {
            const legProfit = calculatePayoff(spot, leg);
            point[leg.id] = legProfit;
            total += legProfit;
        });

        point.totalProfit = total;
        data.push(point);
    }

    return data;
};

// Simplified Black-Scholes estimate for educational purposes (IV + TV)
// Option Value = Intrinsic Value + Time Value
// For expiration PnL, Time Value = 0, so Option Value = Intrinsic Value.
// The educational visualizer could use this if the user wants to see "Today" vs "Expiration" curves.
