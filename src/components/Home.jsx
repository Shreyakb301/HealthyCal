import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from './AppShell';
import { dashboardAPI, mealsAPI } from '../services/api';
import './Home.css';

const mealOrder = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snack' }
];

const fallbackImg =
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=640&q=80';

const formatOneDecimal = (value) => (Number(value) || 0).toFixed(1);
const formatMetric = (value) => {
    const numeric = Number(value) || 0;
    const rounded = Math.round(numeric * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};
const normalizeMealLog = (meal) => ({
    id: meal?.id || meal?._id || `${meal?.mealType || 'meal'}-${meal?.date || meal?.createdAt || meal?.name || meal?.food || 'entry'}`,
    mealType: meal?.mealType || 'snack',
    name: meal?.name || meal?.food || meal?.amount || 'Meal',
    amount: meal?.amount || '',
    calories: Number(meal?.calories) || 0,
    date: meal?.date || meal?.createdAt || null,
    macros: {
        carbs: Number(meal?.macros?.carbs) || 0,
        protein: Number(meal?.macros?.protein) || 0,
        fat: Number(meal?.macros?.fat) || 0,
        fiber: Number(meal?.macros?.fiber) || 0,
        sugar: Number(meal?.macros?.sugar) || 0,
        sodium: Number(meal?.macros?.sodium) || 0,
        cholesterol: Number(meal?.macros?.cholesterol) || 0,
        saturatedFat: Number(meal?.macros?.saturatedFat) || 0
    }
});

const Home = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedMealId, setExpandedMealId] = useState(null);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            setError('');

            try {
                const summary = await dashboardAPI.getSummary();
                let todayMealLogs = Array.isArray(summary?.todayMealLogs)
                    ? summary.todayMealLogs.map(normalizeMealLog)
                    : [];

                try {
                    const meals = await mealsAPI.getByDate(summary.date);
                    if (Array.isArray(meals) && meals.length > 0) {
                        todayMealLogs = meals.map(normalizeMealLog);
                    }
                } catch {
                    // Keep the dashboard summary data if the meals fallback request fails.
                }

                setDashboard({
                    ...summary,
                    todayMealLogs
                });
            } catch (err) {
                if (!String(err.message).toLowerCase().includes('token')) {
                    setError(err.message || 'Failed to load dashboard data.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const calories = dashboard?.dailyCalorieSummary ?? {
        totalCaloriesConsumed: 0,
        dailyCalorieGoal: 2000
    };

    const calorieProgress = useMemo(() => {
        if (!calories.dailyCalorieGoal) return 0;
        return Math.min((calories.totalCaloriesConsumed / calories.dailyCalorieGoal) * 100, 100);
    }, [calories.dailyCalorieGoal, calories.totalCaloriesConsumed]);

    const macroAngles = {
        carbs: dashboard?.macronutrientSummary?.percentages?.carbs || 0,
        protein: dashboard?.macronutrientSummary?.percentages?.protein || 0,
        fat: dashboard?.macronutrientSummary?.percentages?.fat || 0
    };
    const groupedTodayMeals = useMemo(() => {
        const todayMealLogs = Array.isArray(dashboard?.todayMealLogs) ? dashboard.todayMealLogs : [];

        return mealOrder
            .map(({ key, label }) => {
                const meals = todayMealLogs.filter((meal) => meal.mealType === key);

                if (!meals.length) {
                    return null;
                }

                return {
                    key,
                    label,
                    meals
                };
            })
            .filter(Boolean);
    }, [dashboard?.todayMealLogs]);

    return (
        <AppShell title="Dashboard" subtitle={dashboard?.date || ''}>
            {loading && <div className="state-card">Loading dashboard...</div>}
            {error && <div className="state-card error">{error}</div>}

            {!loading && !error && (
                <div className="card-grid">
                    <article className="card daily-calories-card">
                        <div className="card-header">
                            <h2>Daily Calories</h2>
                            <p className="subtle-metric">Today's track</p>
                        </div>
                        <div className="calories-content">
                            <div className="calories-main">
                                <div className="calories-numbers">
                                    <span className="current">{calories.totalCaloriesConsumed.toLocaleString()}</span>
                                    <span className="goal">/ {calories.dailyCalorieGoal.toLocaleString()} kcal</span>
                                </div>
                                <div className="calories-remaining">
                                    {Math.max(0, calories.dailyCalorieGoal - calories.totalCaloriesConsumed).toLocaleString()} kcal remaining
                                </div>

                                <div className="macros-grid">
                                    <div className="macro-item">
                                        <div className="macro-label"><span className="dot carbs" /> Carbs</div>
                                        <div className="macro-value">{formatOneDecimal(dashboard?.macronutrientSummary?.totals?.carbs)}g</div>
                                    </div>
                                    <div className="macro-item">
                                        <div className="macro-label"><span className="dot protein" /> Protein</div>
                                        <div className="macro-value">{formatOneDecimal(dashboard?.macronutrientSummary?.totals?.protein)}g</div>
                                    </div>
                                    <div className="macro-item">
                                        <div className="macro-label"><span className="dot fat" /> Fat</div>
                                        <div className="macro-value">{formatOneDecimal(dashboard?.macronutrientSummary?.totals?.fat)}g</div>
                                    </div>
                                </div>
                            </div>
                            <div className="calories-chart">
                                <div
                                    className="progress-ring-v2"
                                    style={{ '--progress': `${calorieProgress}%` }}
                                >
                                    <div className="ring-center-v2">
                                        <div className="percentage">{Math.round(calorieProgress)}%</div>
                                        <div className="of-goal">of goal</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="card tip-card">
                        <div className="tip-header">
                            <div className="tip-icon-orb">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                            </div>
                            <span className="tip-tag">Daily Insight</span>
                        </div>
                        <div className="tip-body">
                            <h2>Wellness Tip</h2>
                            <p>{dashboard?.wellnessTip?.message || 'Focus on nutrient-dense foods today to keep your energy levels steady throughout the afternoon.'}</p>
                        </div>
                        <Link to="/wellness-tips" className="text-link">
                            Explore more tips
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </Link>
                    </article>

                    <article className="card progress-card today-meals-card">
                        <div className="card-header">
                            <h2>Today's Meals</h2>
                        </div>
                        {groupedTodayMeals.length === 0 ? (
                            <div className="today-meals-empty">
                                <p>No meals logged yet.</p>
                                <span>Head to Meal Log to add breakfast, lunch, dinner, or snacks.</span>
                            </div>
                        ) : (
                            <div className="today-meals-list">
                                {groupedTodayMeals.map((group) => (
                                    <section key={group.key} className="today-meal-type">
                                        <div className="today-meal-type-header">
                                            <span className="today-meal-type-label">{group.label}</span>
                                        </div>

                                        <div className="today-meal-entries">
                                            {group.meals.map((meal) => {
                                                const isExpanded = expandedMealId === meal.id;

                                                return (
                                                    <div
                                                        key={meal.id}
                                                        className={`today-meal-entry ${isExpanded ? 'expanded' : ''}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="today-meal-toggle"
                                                            onClick={() =>
                                                                setExpandedMealId((current) =>
                                                                    current === meal.id ? null : meal.id
                                                                )
                                                            }
                                                        >
                                                            <div className="today-meal-summary">
                                                                <div className="today-meal-copy">
                                                                    <strong>{meal.name || 'Meal'}</strong>
                                                                    <span>
                                                                        {meal.amount?.trim() || '1 serving'}
                                                                    </span>
                                                                </div>
                                                                <div className="today-meal-summary-side">
                                                                    <span className="today-meal-cals">
                                                                        {formatMetric(meal.calories)} kcal
                                                                    </span>
                                                                    <span className="today-meal-expand">
                                                                        {isExpanded ? '-' : '+'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="today-meal-expanded">
                                                                <div className="today-meal-detail-grid">
                                                                    <div className="today-meal-detail">
                                                                        <span>Carbs</span>
                                                                        <strong>{formatMetric(meal.macros?.carbs)}g</strong>
                                                                    </div>
                                                                    <div className="today-meal-detail">
                                                                        <span>Protein</span>
                                                                        <strong>{formatMetric(meal.macros?.protein)}g</strong>
                                                                    </div>
                                                                    <div className="today-meal-detail">
                                                                        <span>Fat</span>
                                                                        <strong>{formatMetric(meal.macros?.fat)}g</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="card macro-card">
                        <h2>Macronutrients</h2>
                        <div className="macro-card-flex-content">
                            <div
                                className="macro-donut-premium"
                                style={{
                                    '--carbs': `${macroAngles.carbs}%`,
                                    '--protein': `${macroAngles.protein}%`,
                                    '--fat': `${macroAngles.fat}%`
                                }}
                            >
                                <div className="ring-center-v2">
                                    <span className="center-text-muted">Today</span>
                                </div>
                            </div>
                            <ul className="macro-legend-premium">
                                <li><span className="dot carbs" />Carbs {macroAngles.carbs}%</li>
                                <li><span className="dot protein" />Protein {macroAngles.protein}%</li>
                                <li><span className="dot fat" />Fat {macroAngles.fat}%</li>
                            </ul>
                        </div>
                    </article>
                </div>
            )}
        </AppShell>
    );
};

export default Home;
