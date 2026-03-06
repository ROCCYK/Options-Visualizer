import { createContext } from 'react';
import type { OptionLeg } from '../types/OptionTypes';

export interface SelectedStrategyMeta {
    id: string;
    name: string;
    category: string;
}

export interface OptionContextType {
    legs: OptionLeg[];
    addLeg: (leg: OptionLeg) => void;
    updateLeg: (id: string, leg: Partial<OptionLeg>) => void;
    removeLeg: (id: string) => void;
    clearLegs: () => void;
    setLegsBulk: (legs: OptionLeg[]) => void;
    spotPrice: number;
    setSpotPrice: (price: number) => void;
    selectedStrategy: SelectedStrategyMeta | null;
    setSelectedStrategy: (strategy: SelectedStrategyMeta | null) => void;
}

export const OptionContext = createContext<OptionContextType | undefined>(undefined);
