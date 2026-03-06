import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { OptionLeg } from '../types/OptionTypes';

interface OptionContextType {
    legs: OptionLeg[];
    addLeg: (leg: OptionLeg) => void;
    updateLeg: (id: string, leg: Partial<OptionLeg>) => void;
    removeLeg: (id: string) => void;
    clearLegs: () => void;
    setLegsBulk: (legs: OptionLeg[]) => void;
    spotPrice: number;
    setSpotPrice: (price: number) => void;
}

const OptionContext = createContext<OptionContextType | undefined>(undefined);

const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export const OptionProvider = ({ children }: { children: ReactNode }) => {
    const [legs, setLegs] = useState<OptionLeg[]>([]);
    const [spotPrice, setSpotPrice] = useState<number>(100);

    const getNextColor = (currentLegs: OptionLeg[]) => {
        const usedColors = currentLegs.map(l => l.color);
        const available = COLORS.filter(c => !usedColors.includes(c));
        return available.length > 0 ? available[0] : COLORS[currentLegs.length % COLORS.length];
    };

    const addLeg = (leg: OptionLeg) => setLegs(prev => [...prev, { ...leg, color: leg.color || getNextColor(prev) }]);
    const updateLeg = (id: string, updated: Partial<OptionLeg>) => setLegs(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    const removeLeg = (id: string) => setLegs(prev => prev.filter(l => l.id !== id));
    const clearLegs = () => setLegs([]);
    const setLegsBulk = (newLegs: OptionLeg[]) => {
        const coloredLegs = newLegs.map((leg, i) => ({
            ...leg,
            color: leg.color || COLORS[i % COLORS.length]
        }));
        setLegs(coloredLegs);
    };

    return (
        <OptionContext.Provider value={{ legs, addLeg, updateLeg, removeLeg, clearLegs, setLegsBulk, spotPrice, setSpotPrice }}>
            {children}
        </OptionContext.Provider>
    );
};

export const useOptions = () => {
    const context = useContext(OptionContext);
    if (!context) throw new Error("useOptions must be used within OptionProvider");
    return context;
};
