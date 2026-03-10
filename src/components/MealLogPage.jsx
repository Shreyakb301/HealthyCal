import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { mealsAPI, nutritionAPI } from '../services/api';
import './FeaturePages.css';

/* ─── helpers ─────────────────────────────────────────── */
const toDateStr = (d) => d.toISOString().slice(0, 10);          // YYYY-MM-DD
const todayStr = () => toDateStr(new Date());

const formatDisplayDate = (dateStr) => {
    const today = todayStr();
    const yesterday = toDateStr(new Date(Date.now() - 86400000));
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_ICONS = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
};

const initialForm = {
    food: '',
    calories: '',
    mealType: 'breakfast',
    carbs: '',
    protein: '',
    fat: '',
};

/* ─── component ───────────────────────────────────────── */
const MealLogPage = () => {
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [formData, setFormData] = useState(initialForm);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Nutrition search & calculator
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [calcItems, setCalcItems] = useState([]);

    /* ── load meals for the selected date ── */
    const loadMeals = async (date = selectedDate) => {
        setLoading(true);
        setError('');
        try {
            const data = await mealsAPI.getByDate(date);
            setMeals(data);
        } catch (err) {
            setError(err.message || 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMeals(selectedDate); }, [selectedDate]);

    /* ── date navigation ── */
    const changeDate = (delta) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        const next = toDateStr(d);
        // don't go into the future
        if (next <= todayStr()) setSelectedDate(next);
    };
    const isToday = selectedDate === todayStr();

    /* ── totals ── */
    const dayTotals = useMemo(() =>
        meals.reduce((acc, m) => ({
            calories: acc.calories + (Number(m.calories) || 0),
            carbs: acc.carbs + (Number(m.macros?.carbs) || 0),
            protein: acc.protein + (Number(m.macros?.protein) || 0),
            fat: acc.fat + (Number(m.macros?.fat) || 0),
        }), { calories: 0, carbs: 0, protein: 0, fat: 0 }),
        [meals]);

    const byType = useMemo(() =>
        MEAL_TYPES.reduce((acc, t) => ({
            ...acc,
            [t]: meals.filter((m) => m.mealType === t)
        }), {}),
        [meals]);

    const calcTotals = useMemo(() =>
        calcItems.reduce((acc, item) => ({
            calories: acc.calories + (Number(item.calories) || 0),
            carbs: acc.carbs + (Number(item.macros?.carbs) || 0),
            protein: acc.protein + (Number(item.macros?.protein) || 0),
            fat: acc.fat + (Number(item.macros?.fat) || 0),
        }), { calories: 0, carbs: 0, protein: 0, fat: 0 }),
        [calcItems]);

    /* ── handlers ── */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const flashSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.food.trim() || !formData.calories) {
            setError('Please enter what you ate and the calories.');
            return;
        }
        try {
            await mealsAPI.create({
                name: formData.food.trim(),
                food: formData.food.trim(),
                amount: formData.food.trim(),
                calories: Number(formData.calories),
                mealType: formData.mealType,
                date: selectedDate,
                macros: {
                    carbs: Number(formData.carbs) || 0,
                    protein: Number(formData.protein) || 0,
                    fat: Number(formData.fat) || 0,
                },
            });
            setFormData(initialForm);
            flashSuccess('Meal saved!');
            await loadMeals(selectedDate);
        } catch (err) {
            setError(err.message || 'Failed to add meal');
        }
    };

    const handleDelete = async (id) => {
        try {
            await mealsAPI.delete(id);
            await loadMeals(selectedDate);
        } catch (err) {
            setError(err.message || 'Failed to delete meal');
        }
    };

    /* ── nutrition search ── */
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setError('');
        try {
            const data = await nutritionAPI.search(searchQuery);
            setSearchResults(data.results || []);
        } catch (err) {
            setError(err.message || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const addToCalc = (food) => setCalcItems((p) => [...p, { ...food, calcId: Date.now() + Math.random() }]);
    const removeFromCalc = (cid) => setCalcItems((p) => p.filter((i) => i.calcId !== cid));

    const fillFormFromCalc = () => {
        if (!calcItems.length) return;
        const combined = calcItems.map((i) => i.name).join(' + ');
        setFormData({
            food: combined.slice(0, 100),
            calories: String(calcTotals.calories),
            mealType: 'snack',
            carbs: String(calcTotals.carbs),
            protein: String(calcTotals.protein),
            fat: String(calcTotals.fat),
        });
        setCalcItems([]);
        // scroll smoothly to the top of the page so user sees the filled form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        flashSuccess('Calculator values filled into Add Meal — review and save!');
    };

    /* ── render ── */
    return (
        <AppShell
            title="Meal Log"
            subtitle={`${formatDisplayDate(selectedDate)} · ${dayTotals.calories} kcal logged`}
        >
            <div className="meal-log-page-wrapper">

                {/* ── Date Navigation Bar ── */}
                <div className="date-nav-bar">
                    <button className="date-nav-btn" onClick={() => changeDate(-1)} title="Previous day">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <div className="date-nav-center">
                        <span className="date-display-label">{formatDisplayDate(selectedDate)}</span>
                        <span className="date-display-sub">{new Date(selectedDate).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric'
                        })}</span>
                    </div>

                    <div className="date-nav-right-group">
                        <input
                            type="date"
                            className="date-picker-input"
                            value={selectedDate}
                            max={todayStr()}
                            onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
                            title="Jump to date"
                        />
                        <button
                            className="date-nav-btn"
                            onClick={() => changeDate(1)}
                            disabled={isToday}
                            title="Next day"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        {!isToday && (
                            <button className="today-btn" onClick={() => setSelectedDate(todayStr())}>
                                Today
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Day Summary Strip ── */}
                <div className="day-summary-strip">
                    <div className="summary-pill">
                        <span className="pill-val">{dayTotals.calories}</span>
                        <span className="pill-label">kcal</span>
                    </div>
                    <div className="summary-pill carbs-pill">
                        <span className="pill-val">{dayTotals.carbs}g</span>
                        <span className="pill-label">Carbs</span>
                    </div>
                    <div className="summary-pill protein-pill">
                        <span className="pill-val">{dayTotals.protein}g</span>
                        <span className="pill-label">Protein</span>
                    </div>
                    <div className="summary-pill fat-pill">
                        <span className="pill-val">{dayTotals.fat}g</span>
                        <span className="pill-label">Fat</span>
                    </div>
                    <div className="summary-pill count-pill">
                        <span className="pill-val">{meals.length}</span>
                        <span className="pill-label">Meals</span>
                    </div>
                </div>

                {error && <p className="inline-error">{error}</p>}
                {success && <p className="inline-success">{success}</p>}

                {/* ── Top 2-col grid ── */}
                <section className="meal-log-top-grid">

                    {/* Add Meal Card */}
                    <article className="feature-card add-meal-card">
                        <h2>Add Meal</h2>
                        <form className="feature-form" onSubmit={handleSubmit}>
                            <input
                                name="food"
                                placeholder="What did you eat?"
                                value={formData.food}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                            <div className="search-row">
                                <input
                                    name="calories"
                                    type="number"
                                    min="0"
                                    placeholder="Calories"
                                    value={formData.calories}
                                    onChange={handleChange}
                                />
                                <select name="mealType" value={formData.mealType} onChange={handleChange}>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                            <div className="triple-grid">
                                <input name="carbs" type="number" min="0" placeholder="Carbs (g)" value={formData.carbs} onChange={handleChange} />
                                <input name="protein" type="number" min="0" placeholder="Protein (g)" value={formData.protein} onChange={handleChange} />
                                <input name="fat" type="number" min="0" placeholder="Fat (g)" value={formData.fat} onChange={handleChange} />
                            </div>

                            <button type="submit" className="save-meal-btn">Save Meal</button>
                        </form>
                    </article>

                    {/* Daily Meals Card — grouped by meal type */}
                    <article className="feature-card meals-by-type-card">
                        <h2>
                            {isToday ? "Today's Meals" : `Meals — ${formatDisplayDate(selectedDate)}`}
                        </h2>
                        {loading ? (
                            <div className="loading-state">Loading meals…</div>
                        ) : meals.length === 0 ? (
                            <div className="empty-day-state">
                                <div className="empty-icon">🍽️</div>
                                <p>No meals logged for {isToday ? 'today' : 'this day'} yet.</p>
                                <span>Add your first meal using the form on the left.</span>
                            </div>
                        ) : (
                            <div className="meals-type-list">
                                {MEAL_TYPES.map((type) =>
                                    byType[type].length > 0 && (
                                        <div key={type} className="meal-type-section">
                                            <div className="meal-type-header">
                                                <span className="meal-type-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                <span className="meal-type-cals">
                                                    {byType[type].reduce((s, m) => s + (Number(m.calories) || 0), 0)} kcal
                                                </span>
                                            </div>
                                            {byType[type].map((meal) => (
                                                <div key={meal._id || meal.id} className="meal-entry-row">
                                                    <div className="meal-entry-info">
                                                        <strong className="meal-entry-name">{meal.name || meal.food || meal.amount}</strong>
                                                        <span className="meal-entry-meta">
                                                            {meal.calories} cal
                                                            {meal.macros?.carbs ? ` · C:${meal.macros.carbs}g` : ''}
                                                            {meal.macros?.protein ? ` P:${meal.macros.protein}g` : ''}
                                                            {meal.macros?.fat ? ` F:${meal.macros.fat}g` : ''}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="delete-icon-btn"
                                                        onClick={() => handleDelete(meal._id || meal.id)}
                                                        title="Delete meal"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </article>
                </section>

                {/* ── Nutrition Search ── */}
                <article className="feature-card search-main-card">
                    <div className="card-header-with-icon">
                        <div className="header-icon-orange">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <h3>Nutrition Search</h3>
                    </div>

                    <div className="search-input-container">
                        <svg className="inner-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search foods, e.g. chicken breast…"
                        />
                        <button className="search-inline-btn" onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? '…' : 'Search'}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results-list">
                            {searchResults.map((food) => (
                                <div key={food.id} className="search-result-item">
                                    <div className="food-details">
                                        <span className="food-name">{food.name}</span>
                                        <small className="food-serv">{food.serving || '100g'}</small>
                                    </div>
                                    <div className="food-actions">
                                        <span className="food-cals-bold">{food.calories} kcal</span>
                                        <button type="button" className="add-to-calc-btn" onClick={() => addToCalc(food)}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                {/* ── Nutrition Calculator ── */}
                <article className="feature-card calculator-card">
                    <div className="card-header-with-icon">
                        <div className="header-icon-blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                <line x1="8" y1="6" x2="16" y2="6" />
                            </svg>
                        </div>
                        <h3>Nutrition Calculator</h3>
                    </div>

                    {calcItems.length === 0 ? (
                        <div className="calculator-empty-state">
                            <p>Search and add foods above to calculate nutrition totals</p>
                        </div>
                    ) : (
                        <div className="calculator-active-state">
                            <div className="calculator-items-list">
                                {calcItems.map((item) => (
                                    <div key={item.calcId} className="calc-item-row">
                                        <span className="calc-item-name">{item.name}</span>
                                        <div className="calc-item-right">
                                            <span className="calc-item-cals">{item.calories} kcal</span>
                                            <button className="remove-calc-item" onClick={() => removeFromCalc(item.calcId)}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="calculator-summary">
                                <div className="total-badge">
                                    <strong>Total: {calcTotals.calories} kcal</strong>
                                    <span>{calcTotals.carbs}C · {calcTotals.protein}P · {calcTotals.fat}F</span>
                                </div>
                                <button className="log-calculator-btn" onClick={fillFormFromCalc}>
                                    Fill into Add Meal ↑
                                </button>
                            </div>
                        </div>
                    )}
                </article>
            </div>
        </AppShell>
    );
};

export default MealLogPage;
