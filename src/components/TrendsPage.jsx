import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { dashboardAPI } from '../services/api';
import './FeaturePages.css';

const TrendsPage = () => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadWeekly = async () => {
            try {
                const data = await dashboardAPI.getWeekly();
                setWeeklyData(data.days || []);
            } catch (err) {
                setError(err.message || 'Failed to load weekly trends');
            } finally {
                setLoading(false);
            }
        };
        loadWeekly();
    }, []);

    const maxCalories = Math.max(...weeklyData.map(d => d.calories), 2000);

    return (
        <AppShell title="Trends" subtitle="Your weekly nutrition activity">
            <div className="trends-page-wrapper">
                <article className="feature-card trends-main-card">
                    <h2>Weekly Calorie Intake</h2>
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
                                                    height: `${(day.calories / maxCalories) * 100}%`,
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
                            {weeklyData.map(day => (
                                <div key={day.date} className="macro-day-row">
                                    <span className="day-name">{day.label}</span>
                                    <div className="macro-bar-mini">
                                        <div
                                            className="segment carbs"
                                            style={{ width: `${(day.macros.carbs / (day.macros.carbs + day.macros.protein + day.macros.fat || 1)) * 100}%` }}
                                        />
                                        <div
                                            className="segment protein"
                                            style={{ width: `${(day.macros.protein / (day.macros.carbs + day.macros.protein + day.macros.fat || 1)) * 100}%` }}
                                        />
                                        <div
                                            className="segment fat"
                                            style={{ width: `${(day.macros.fat / (day.macros.carbs + day.macros.protein + day.macros.fat || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="day-total-cals">{day.calories} cal</span>
                                </div>
                            ))}
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
                    overflow: hidden;
                    position: relative;
                }
                .bar-inner {
                    width: 100%;
                    border-radius: 8px 8px 0 0;
                    transition: height 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
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
                    z-index: 10;
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
                    overflow: hidden;
                }
                .segment { height: 100%; }
                .segment.carbs { background: #56ae6d; }
                .segment.protein { background: #f09252; }
                .segment.fat { background: #e75a5a; }
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
            `}</style>
        </AppShell>
    );
};

export default TrendsPage;
