import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { dashboardAPI } from '../services/api';
import './FeaturePages.css';

const getMacroSegments = (macros = {}) => {
    const carbs = Number(macros.carbs) || 0;
    const protein = Number(macros.protein) || 0;
    const fat = Number(macros.fat) || 0;
    const total = carbs + protein + fat;
    const safeTotal = total || 1;

    return [
        {
            key: 'carbs',
            label: 'Carbs',
            width: (carbs / safeTotal) * 100,
            percentage: Math.round((carbs / safeTotal) * 100)
        },
        {
            key: 'protein',
            label: 'Protein',
            width: (protein / safeTotal) * 100,
            percentage: Math.round((protein / safeTotal) * 100)
        },
        {
            key: 'fat',
            label: 'Fat',
            width: (fat / safeTotal) * 100,
            percentage: Math.round((fat / safeTotal) * 100)
        }
    ];
};

const getMondayFirstIndex = (dateString) => {
    if (!dateString) {
        return 0;
    }

    const date = new Date(`${dateString}T12:00:00`);
    return (date.getDay() + 6) % 7;
};

const getStartOfWeek = (date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const mondayOffset = (day + 6) % 7;
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setMilliseconds(0);
    return weekStart;
};

const formatDateLabel = (date) =>
    new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

const TrendsPage = () => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weekStartDate, setWeekStartDate] = useState(getStartOfWeek(new Date()));
    const [animateBars, setAnimateBars] = useState(false);

    const currentWeekStart = getStartOfWeek(new Date());
    const isCurrentWeek = weekStartDate.toISOString().slice(0, 10) === currentWeekStart.toISOString().slice(0, 10);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const goToPreviousWeek = () => {
        setWeekStartDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 7);
            return next;
        });
    };

    const goToNextWeek = () => {
        setWeekStartDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 7);
            return next;
        });
    };

    const jumpToCurrentWeek = () => setWeekStartDate(currentWeekStart);

    useEffect(() => {
        const loadWeekly = async () => {
            try {
                setAnimateBars(false);
                setLoading(true);
                setError('');
                const weekStart = weekStartDate.toISOString().slice(0, 10);
                const data = await dashboardAPI.getWeekly(weekStart);
                setWeeklyData(data.days || []);
            } catch (err) {
                setError(err.message || 'Failed to load weekly trends');
                setWeeklyData([]);
            } finally {
                setLoading(false);
            }
        };

        loadWeekly();
    }, [weekStartDate]);

    useEffect(() => {
        if (weeklyData.length && !loading) {
            const timer = setTimeout(() => setAnimateBars(true), 30);
            return () => clearTimeout(timer);
        }

        return undefined;
    }, [weeklyData, loading]);

    const maxCalories = Math.max(...weeklyData.map(d => d.calories), 2000);
    const mondayFirstWeeklyData = [...weeklyData].sort(
        (left, right) => getMondayFirstIndex(left.date) - getMondayFirstIndex(right.date)
    );

    return (
        <AppShell title="Trends" subtitle="Your weekly nutrition activity">
            <div className="trends-page-wrapper">
                <article className="feature-card trends-main-card">
                    <div className="trends-week-header">
                        <h2>Weekly Calorie Intake</h2>
                        <div className="week-controls">
                            <button type="button" onClick={goToPreviousWeek}>
                                ← Previous Week
                            </button>
                            <button type="button" onClick={goToNextWeek} disabled={isCurrentWeek}>
                                Next Week →
                            </button>
                            <button type="button" onClick={jumpToCurrentWeek} disabled={isCurrentWeek}>
                                This Week
                            </button>
                        </div>
                    </div>
                    <p className="week-range">
                        {formatDateLabel(weekStartDate)} - {formatDateLabel(weekEndDate)}
                    </p>
                    {loading ? (
                        <p>Loading trends...</p>
                    ) : error ? (
                        <p className="inline-error">{error}</p>
                    ) : (
                        <div className="trends-chart-container">
                            <div className="chart-bars">
                                {weeklyData.map(day => (
                                    <div key={day.date} className="trend-bar-wrapper">
                                        <div className="bar-outer">
                                            <div
                                                className="bar-inner"
                                                style={{
                                                    height: animateBars ? `${(day.calories / maxCalories) * 100}%` : '0%',
                                                    backgroundColor: day.calories > 2200 ? '#e75a5a' : '#56ae6d'
                                                }}
                                            >
                                                <span className="bar-tooltip">{day.calories} kcal</span>
                                            </div>
                                        </div>
                                        <span className="bar-label">{day.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </article>

                <div className="trends-grid">
                    <article className="feature-card">
                        <h2>Weekly Macros Summary</h2>
                        <div className="macros-weekly-list">
                            {mondayFirstWeeklyData.map(day => {
                                const macroSegments = getMacroSegments(day.macros);

                                return (
                                <div key={day.date} className="macro-day-row">
                                    <span className="day-name">{day.label}</span>
                                    <div className="macro-bar-mini">
                                        {macroSegments.map(segment => (
                                            <button
                                                key={`${day.date}-${segment.key}`}
                                                type="button"
                                                className={`segment ${segment.key}`}
                                                style={{ width: `${segment.width}%` }}
                                                aria-label={`${segment.label} ${segment.percentage}%`}
                                            >
                                                <span className="segment-tooltip">
                                                    {segment.label} {segment.percentage}%
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <span className="day-total-cals">{day.calories} cal</span>
                                </div>
                                );
                            })}
                        </div>
                    </article>

                    <article className="feature-card highlights-card">
                        <h2>Weekly Highlights</h2>
                        <div className="highlights-list">
                            <div className="highlight-item blue">
                                <span className="highlight-val">{Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7)}</span>
                                <span className="highlight-label">Avg Calories / Day</span>
                            </div>
                            <div className="highlight-item green">
                                <span className="highlight-val">
                                    {Math.max(...weeklyData.map(d => d.calories))}
                                </span>
                                <span className="highlight-label">Highest Intake Day</span>
                            </div>
                        </div>
                    </article>
                </div>
            </div>

            <style>{`
                .trends-chart-container {
                    padding: 2rem 1rem 1rem;
                    height: 250px;
                    display: flex;
                    align-items: flex-end;
                }
                .chart-bars {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    width: 100%;
                    height: 100%;
                    gap: 1rem;
                }
                .trend-bar-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }
                .bar-outer {
                    width: 100%;
                    max-width: 40px;
                    background: var(--bg);
                    border-radius: 8px;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    overflow: visible;
                    position: relative;
                }
                .bar-inner {
                    width: 100%;
                    border-radius: 8px 8px 0 0;
                    transition: height 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    z-index: 1;
                }
                .bar-inner:hover .bar-tooltip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-10px);
                }
                .bar-tooltip {
                    position: absolute;
                    top: -40px;
                    left: 50%;
                    transform: translateX(-50%) translateY(0);
                    background: var(--primary);
                    color: white;
                    padding: 0.4rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s;
                    white-space: nowrap;
                    z-index: 3;
                }
                .bar-label {
                    margin-top: 0.75rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-muted);
                }
                .macro-day-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .day-name {
                    width: 40px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .macro-bar-mini {
                    flex: 1;
                    height: 8px;
                    background: var(--bg);
                    border-radius: 10px;
                    display: flex;
                    overflow: visible;
                    position: relative;
                }
                .segment {
                    height: 100%;
                    border: none;
                    padding: 0;
                    margin: 0;
                    position: relative;
                    cursor: default;
                    min-width: 8px;
                }
                .segment:first-child { border-radius: 10px 0 0 10px; }
                .segment:last-child { border-radius: 0 10px 10px 0; }
                .segment.carbs { background: #56ae6d; }
                .segment.protein { background: #f09252; }
                .segment.fat { background: #e75a5a; }
                .segment:hover .segment-tooltip,
                .segment:focus-visible .segment-tooltip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-8px);
                    z-index: 6;
                }
                .segment-tooltip {
                    position: absolute;
                    left: 50%;
                    bottom: calc(100% + 10px);
                    transform: translateX(-50%) translateY(0);
                    background: #fff;
                    color: var(--text-muted);
                    border-radius: 8px;
                    box-shadow: 0 10px 26px rgba(26, 43, 31, 0.12);
                    padding: 0.45rem 0.65rem;
                    font-size: 0.78rem;
                    font-weight: 700;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    z-index: 5;
                }
                .day-total-cals {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--primary);
                    min-width: 60px;
                    text-align: right;
                }
                .highlights-list {
                    display: grid;
                    gap: 1rem;
                }
                .highlight-item {
                    padding: 1.5rem;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .highlight-item.blue { background: #f0f7ff; color: #0066cc; }
                .highlight-item.green { background: #f0fdf4; color: #166534; }
                .highlight-val { font-size: 2rem; font-weight: 800; }
                .highlight-label { font-size: 0.9rem; font-weight: 600; opacity: 0.8; }
                .trends-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .trends-week-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .week-controls {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .week-controls button {
                    border: 1px solid var(--border);
                    background: var(--bg);
                    color: var(--text);
                    border-radius: 8px;
                    padding: 0.3rem 0.7rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .week-controls button[disabled] {
                    opacity: 0.45;
                    cursor: not-allowed;
                }
                .week-range {
                    margin: 0.6rem 0;
                    color: var(--text-muted);
                    font-size: 0.88rem;
                    font-weight: 600;
                }
            `}</style>
        </AppShell>
    );
};

export default TrendsPage;
