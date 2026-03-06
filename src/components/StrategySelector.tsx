import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useOptions } from '../context/useOptions';
import type { OptionLeg } from '../types/OptionTypes';
import {
    categoryThemeMap,
    categoryOrder,
    groupedStrategyPresets,
    strategyPresets,
    type StrategyCategory,
    type StrategyPreset
} from '../utils/strategyPresets';

const createLegId = (): string => Math.random().toString(36).slice(2, 11);

const materializeLegs = (preset: StrategyPreset, spotPrice: number): OptionLeg[] =>
    preset.build(spotPrice).map(leg => ({
        ...leg,
        id: createLegId(),
    }));

export default function StrategySelector() {
    const { selectedStrategy, setLegsBulk, setSelectedStrategy, spotPrice } = useOptions();
    const [activeCategory, setActiveCategory] = useState<StrategyCategory>('Bullish');
    const activeStrategyId = selectedStrategy?.id ?? null;

    const applyStrategy = (strategyId: string) => {
        const preset = strategyPresets.find(strategy => strategy.id === strategyId);

        if (!preset) {
            return;
        }

        setActiveCategory(preset.category);
        setSelectedStrategy({ id: preset.id, name: preset.name, category: preset.category });
        setLegsBulk(materializeLegs(preset, spotPrice));
    };

    const clearStrategy = () => {
        setSelectedStrategy(null);
        setLegsBulk([]);
    };

    const renderStrategyCard = (preset: StrategyPreset) => {
        const isActive = preset.id === activeStrategyId;
        const meta = categoryThemeMap[preset.category];

        return (
            <button
                key={preset.id}
                onClick={() => applyStrategy(preset.id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                    isActive
                        ? `${meta.activeCardClassName} text-white`
                        : 'border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/10'
                }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold leading-tight">{preset.name}</div>
                        <p className="mt-1 text-xs leading-5 text-foreground/60">{preset.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.badgeClassName}`}>
                        {preset.category}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <div className="mb-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
                        <BookOpen size={16} />
                        <span>Educational Presets</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-foreground/60">
                        40 widely used strategies grouped by dominant outlook or use case.
                    </p>
                </div>
                <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-base font-bold leading-none text-foreground">40</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                        Presets
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categoryOrder.map(category => {
                    const isActive = category === activeCategory;
                    const meta = categoryThemeMap[category];

                    return (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`min-w-0 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                                isActive
                                    ? meta.tabClassName
                                    : 'border-white/10 bg-white/5 text-foreground/60'
                            }`}
                        >
                            {category} ({groupedStrategyPresets[category].length})
                        </button>
                    );
                })}
            </div>

            <section className="rounded-2xl border border-white/10 bg-background/20 p-3 md:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{activeCategory}</h3>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${categoryThemeMap[activeCategory].badgeClassName}`}>
                                {groupedStrategyPresets[activeCategory].length}
                            </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-foreground/60">
                            {categoryThemeMap[activeCategory].description}
                        </p>
                    </div>
                </div>
                <div className="max-h-[30.5rem] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-2">
                        {groupedStrategyPresets[activeCategory].map(renderStrategyCard)}
                    </div>
                </div>
            </section>

            <button
                onClick={clearStrategy}
                className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
            >
                Clear Preset
            </button>
        </div>
    );
}
