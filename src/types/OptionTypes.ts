export type OptionType = 'Call' | 'Put';
export type PositionType = 'Long' | 'Short';

export interface OptionLeg {
    id: string;
    type: OptionType;
    position: PositionType;
    strike: number;
    premium: number;
    quantity: number;
    color?: string;
    // Options for TV/IV calculation (simplified for now)
    dte?: number;  // Days to Expiry
    iv?: number;   // Implied Volatility
}

export interface ChartDataPoint {
    spotPrice: number;
    totalProfit: number;
    [legId: string]: number; // individual leg profits
}
