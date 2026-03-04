import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from './AppShell';
import { dashboardAPI } from '../services/api';
import './Home.css';

const mealOrder = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' }
];

const fallbackImg =
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=640&q=80';

const Home = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            setError('');

            try {
                const summary = await dashboardAPI.getSummary();
                setDashboard(summary);
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

    return (
        <AppShell title="Dashboard" subtitle={dashboard?.date || ''}>
            {loading && <div className="state-card">Loading dashboard...</div>}
            {error && <div className="state-card error">{error}</div>}

            {!loading && !error && (
                <div className="card-grid">
                    <article className="card meal-card">
                        <div className="card-head">
                            <h2>Daily Meal Log</h2>
                            <Link to="/meal-log" className="text-action">View All</Link>
                        </div>

                        <div className="meal-list">
                            {mealOrder.map(({ key, label }) => {
                                const meal = dashboard?.dailyMeals?.[key];
                                return (
                                    <div key={key} className="meal-item">
                                        <img
                                            src={meal?.imageUrl || fallbackImg}
                                            alt={meal?.name ? `${meal.name}` : `${label} placeholder`}
                                        />
                                        <h3>{label}</h3>
                                        <p className="meal-title">{meal?.name || 'No meal logged'}</p>
                                        <p className="meal-meta">{meal?.calories ?? 0} calories</p>
                                    </div>
                                );
                            })}
                        </div>
                    </article>

                    <article className="card tip-card">
                        <div className="tip-icon">Tip</div>
                        <h2>Wellness Tip</h2>
                        <p>{dashboard?.wellnessTip?.message || 'No tip available for today.'}</p>
                        <Link to="/wellness-tips" className="text-link">Learn More</Link>
                    </article>

                    <article className="card progress-card">
                        <h2>Calories Consumed</h2>
                        <div
                            className="progress-ring"
                            style={{ '--progress': `${calorieProgress}%` }}
                        >
                            <div className="ring-center">
                                {calories.totalCaloriesConsumed} / {calories.dailyCalorieGoal}
                            </div>
                        </div>
                    </article>

                    <article className="card macro-card">
                        <h2>Macronutrients</h2>
                        <div
                            className="macro-ring"
                            style={{
                                '--carbs': `${macroAngles.carbs}%`,
                                '--protein': `${macroAngles.protein}%`,
                                '--fat': `${macroAngles.fat}%`
                            }}
                        >
                            <div className="ring-center small">Today</div>
                        </div>
                        <ul className="macro-legend">
                            <li><span className="dot carbs" />Carbs {macroAngles.carbs}%</li>
                            <li><span className="dot protein" />Protein {macroAngles.protein}%</li>
                            <li><span className="dot fat" />Fat {macroAngles.fat}%</li>
                        </ul>
                    </article>
                </div>
            )}
        </AppShell>
    );
};

export default Home;
