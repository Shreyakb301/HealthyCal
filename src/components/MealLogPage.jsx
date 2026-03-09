import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { mealsAPI, nutritionAPI } from '../services/api';
import './FeaturePages.css';

const initialForm = {
    name: '',
    amount: '',
    calories: '',
    mealType: 'breakfast',
    imageUrl: '',
    carbs: '',
    protein: '',
    fat: ''
};

const MealLogPage = () => {
    const [formData, setFormData] = useState(initialForm);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Search & Calculator state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [calculatorItems, setCalculatorItems] = useState([]);

    const loadMeals = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await mealsAPI.getAll();
            setMeals(data);
        } catch (err) {
            setError(err.message || 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeals();
    }, []);

    const totalCalories = useMemo(
        () => meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0),
        [meals]
    );

    const calculatorTotals = useMemo(() => {
        return calculatorItems.reduce((acc, item) => ({
            calories: acc.calories + (Number(item.calories) || 0),
            carbs: acc.carbs + (Number(item.macros?.carbs) || 0),
            protein: acc.protein + (Number(item.macros?.protein) || 0),
            fat: acc.fat + (Number(item.macros?.fat) || 0)
        }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    }, [calculatorItems]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

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

    const addToCalculator = (food) => {
        setCalculatorItems(prev => [...prev, { ...food, calcId: Date.now() + Math.random() }]);
    };

    const removeFromCalculator = (calcId) => {
        setCalculatorItems(prev => prev.filter(item => item.calcId !== calcId));
    };

    const logCalculatorResults = async () => {
        if (calculatorItems.length === 0) return;

        const combinedName = calculatorItems.map(i => i.name).join(', ');
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        try {
            await mealsAPI.create({
                name: timeNow,
                amount: `Combined: ${combinedName.substring(0, 50)}${combinedName.length > 50 ? '...' : ''}`,
                calories: calculatorTotals.calories,
                mealType: 'snack',
                macros: {
                    carbs: calculatorTotals.carbs,
                    protein: calculatorTotals.protein,
                    fat: calculatorTotals.fat
                }
            });
            setCalculatorItems([]);
            await loadMeals();
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to add calculator results to log');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.amount.trim() || !formData.calories) {
            setError('Please fill name, amount, and calories.');
            return;
        }

        try {
            await mealsAPI.create({
                name: formData.name.trim(),
                amount: formData.amount.trim(),
                calories: Number(formData.calories),
                mealType: formData.mealType,
                imageUrl: formData.imageUrl.trim(),
                macros: {
                    carbs: Number(formData.carbs) || 0,
                    protein: Number(formData.protein) || 0,
                    fat: Number(formData.fat) || 0
                }
            });
            setFormData(initialForm);
            await loadMeals();
        } catch (err) {
            setError(err.message || 'Failed to add meal');
        }
    };

    const handleDelete = async (id) => {
        try {
            await mealsAPI.delete(id);
            await loadMeals();
        } catch (err) {
            setError(err.message || 'Failed to delete meal');
        }
    };

    return (
        <AppShell title="Meal Log" subtitle={`Total logged calories: ${totalCalories}`}>
            <div className="meal-log-page-wrapper">
                {/* Section 1: Traditional Log & Recent Side-by-Side */}
                <section className="meal-log-top-grid">
                    <article className="feature-card">
                        <h2>Add Meal</h2>
                        <form className="feature-form" onSubmit={handleSubmit}>
                            <input type="time" name="name" placeholder="Time" value={formData.name} onChange={handleChange} />
                            <input name="amount" placeholder="What did you eat?" value={formData.amount} onChange={handleChange} />
                            <div className="search-row">
                                <input name="calories" type="number" min="0" placeholder="Calories" value={formData.calories} onChange={handleChange} />
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
                        {error && <p className="inline-error">{error}</p>}
                    </article>

                    <article className="feature-card">
                        <h2>Recent Meals</h2>
                        {loading ? (
                            <p>Loading meals...</p>
                        ) : (
                            <div className="list-grid">
                                {meals.map((meal) => (
                                    <div className="list-row" key={meal._id || meal.id}>
                                        <div className="meal-info-compact">
                                            <strong>{meal.amount}</strong>
                                            <p>{meal.mealType} • {meal.name} • {meal.calories} cal</p>
                                        </div>
                                        <button type="button" className="delete-icon-btn" onClick={() => handleDelete(meal._id || meal.id)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                ))}
                                {meals.length === 0 && <p className="empty-msg">No meals logged yet today.</p>}
                            </div>
                        )}
                    </article>
                </section>

                {/* Section 2: Nutrition Search (Matches Image) */}
                <article className="feature-card search-main-card">
                    <div className="card-header-with-icon">
                        <div className="header-icon-orange">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <h3>Nutrition Search</h3>
                    </div>

                    <div className="search-input-fancy">
                        <svg className="inner-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="chicken"
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results-list">
                            {searchResults.map((food) => (
                                <div key={food.id} className="search-result-item">
                                    <div className="food-details">
                                        <span className="food-name">{food.name} ({food.serving || '100g'})</span>
                                        <small className="food-serv">{food.serving || '100g'}</small>
                                    </div>
                                    <div className="food-actions">
                                        <span className="food-cals-bold">{food.calories} kcal</span>
                                        <button type="button" className="add-to-calc-btn" onClick={() => addToCalculator(food)}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                {/* Section 3: Nutrition Calculator (Matches Image) */}
                <article className="feature-card calculator-card">
                    <div className="card-header-with-icon">
                        <div className="header-icon-blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14"></line><line x1="16" y1="18" x2="16" y2="18"></line><line x1="12" y1="14" x2="12" y2="14"></line><line x1="12" y1="18" x2="12" y2="18"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="8" y1="18" x2="8" y2="18"></line></svg>
                        </div>
                        <h3>Nutrition Calculator</h3>
                    </div>

                    {calculatorItems.length === 0 ? (
                        <div className="calculator-empty-state">
                            <p>Search and add foods above to calculate nutrition totals</p>
                        </div>
                    ) : (
                        <div className="calculator-active-state">
                            <div className="calculator-items-list">
                                {calculatorItems.map(item => (
                                    <div key={item.calcId} className="calc-item-row">
                                        <span className="calc-item-name">{item.name}</span>
                                        <div className="calc-item-right">
                                            <span className="calc-item-cals">{item.calories} kcal</span>
                                            <button className="remove-calc-item" onClick={() => removeFromCalculator(item.calcId)}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="calculator-summary">
                                <div className="total-badge">
                                    <strong>Total: {calculatorTotals.calories} kcal</strong>
                                    <span>{calculatorTotals.carbs}C {calculatorTotals.protein}P {calculatorTotals.fat}F</span>
                                </div>
                                <button className="log-calculator-btn" onClick={logCalculatorResults}>
                                    Add results to Meal Log
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
