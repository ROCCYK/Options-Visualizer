import { useState } from 'react';
import StrategySelector from './StrategySelector';
import OptionLegEditor from './OptionLegEditor';
import { useOptions } from '../context/useOptions';
import { categoryThemeMap, type StrategyCategory } from '../utils/strategyPresets';

type BuilderView = 'presets' | 'legs';

const tabBaseClassName =
    'flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all';

export default function StrategyBuilderPanel() {
    const { legs, selectedStrategy } = useOptions();
    const [activeView, setActiveView] = useState<BuilderView>('presets');

    const strategyLabel = selectedStrategy?.name ?? 'Custom Strategy';
    const strategyCategory = selectedStrategy?.category ?? 'Manual';
    const activeCategoryBadgeClassName = selectedStrategy
        ? categoryThemeMap[selectedStrategy.category as StrategyCategory]?.badgeClassName
        : null;

    return (
        <div className="glass rounded-3xl p-4 md:p-6 lg:flex lg:max-h-[calc(100vh-4rem)] lg:flex-col lg:overflow-hidden">
            <div className="border-b border-white/10 pb-4 lg:shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold md:text-xl">Strategy Builder</h2>
                        <p className="mt-1 text-sm text-foreground/55">
                            Build from presets or refine the current position manually.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="text-base font-bold leading-none text-foreground">{legs.length}</div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
                            Legs
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/45">
                                Active Setup
                            </div>
                            <div className="truncate text-base font-semibold text-foreground">{strategyLabel}</div>
                        </div>
                        <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                activeCategoryBadgeClassName ?? 'border-white/10 bg-white/5 text-foreground/65'
                            }`}
                        >
                            {strategyCategory}
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 rounded-2xl border border-white/10 bg-background/40 p-1">
                    <button
                        onClick={() => setActiveView('presets')}
                        className={`${tabBaseClassName} ${
                            activeView === 'presets'
                                ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.12)]'
                                : 'border-transparent bg-transparent text-foreground/55 hover:text-foreground'
                        }`}
                    >
                        Presets
                    </button>
                    <button
                        onClick={() => setActiveView('legs')}
                        className={`${tabBaseClassName} ${
                            activeView === 'legs'
                                ? 'border-primary/30 bg-primary/12 text-primary-foreground shadow-[0_10px_30px_rgba(139,92,246,0.14)]'
                                : 'border-transparent bg-transparent text-foreground/55 hover:text-foreground'
                        }`}
                    >
                        Legs
                    </button>
                </div>
            </div>

            <div className="mt-4 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:pb-6">
                {activeView === 'presets' ? (
                    <StrategySelector
                        onStrategyApplied={() => setActiveView('legs')}
                        useInternalScroll={false}
                    />
                ) : (
                    <OptionLegEditor />
                )}
            </div>
        </div>
    );
}
