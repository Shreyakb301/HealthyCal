import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { dashboardAPI, nutritionAPI } from '../services/api';
import './FeaturePages.css';

const NUTRITION_FIELDS = [
    { key: 'carbs', label: 'Carbs', unit: 'g' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'fat', label: 'Fat', unit: 'g' },
    { key: 'fiber', label: 'Fiber', unit: 'g' },
    { key: 'sugar', label: 'Sugar', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
    { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g' }
];

const formatMetric = (value) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return '0';
    }

    const rounded = Math.round(parsed * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const formatSearchMacroSummary = (food) =>
    `${formatMetric(food?.macros?.carbs)} / ${formatMetric(food?.macros?.protein)} / ${formatMetric(food?.macros?.fat)} g`;

const formatNutrientValue = (value, unit) => `${formatMetric(value)}${unit}`;

const NutritionPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedFoodId, setSelectedFoodId] = useState(null);
    const [popularFoods, setPopularFoods] = useState([]);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [popular, dashboard] = await Promise.all([
                    nutritionAPI.getPopular(),
                    dashboardAPI.getSummary()
                ]);
                setPopularFoods(popular.foods || []);
                setSummary(dashboard);
            } catch (err) {
                if (!String(err.message).toLowerCase().includes('token')) {
                    setError(err.message || 'Unable to load nutrition data.');
                }
            }
        };

        load();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            setSelectedFoodId(null);
            return;
        }

        setError('');
        try {
            const data = await nutritionAPI.search(query);
            setResults(data.results || []);
            setSelectedFoodId(null);
        } catch (err) {
            setError(err.message || 'Search failed');
        }
    };

    const macroSummary = useMemo(() => {
        const percentages = summary?.macronutrientSummary?.percentages || { carbs: 0, protein: 0, fat: 0 };
        return `Carbs ${percentages.carbs}% | Protein ${percentages.protein}% | Fat ${percentages.fat}%`;
    }, [summary]);

    const selectedFood = results.find((food) => food.id === selectedFoodId) || null;

    return (
        <AppShell title="Nutrition" subtitle="Search and explore food nutrition data">
            <section className="feature-layout single-column nutrition-container">
                <article className="feature-card search-card search-main-card">
                    <div className="card-fixed-header card-fixed-header-search">
                        <div className="card-header-with-icon">
                            <h3>Nutrition Search</h3>
                        </div>

                        <div className="search-input-container">
                            <svg
                                className="inner-search-icon"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="20" y1="20" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                                placeholder="Search foods, e.g. chicken breast..."
                            />
                            <button
                                type="button"
                                className="search-inline-btn"
                                onClick={handleSearch}
                                aria-label="Search foods"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle cx="11" cy="11" r="7.5" />
                                    <line x1="20" y1="20" x2="16.65" y2="16.65" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {error && <p className="inline-error">{error}</p>}

                    {results.length > 0 ? (
                        <div className="search-results-shell">
                            <div className="search-results-list">
                                {results.map((food) => {
                                    const isSelected = selectedFood?.id === food.id;

                                    return (
                                        <button
                                            key={food.id}
                                            type="button"
                                            className={`search-result-item search-result-select nutrition-search-result ${isSelected ? 'active' : ''}`}
                                            onClick={() =>
                                                setSelectedFoodId((current) => (current === food.id ? null : food.id))
                                            }
                                            aria-pressed={isSelected}
                                        >
                                            <div className="food-details">
                                                <span className="food-name">{food.name}</span>
                                                <small className="food-serv">
                                                    {food.serving || 'Serving unavailable'}
                                                </small>
                                            </div>

                                            <div className="food-actions">
                                                <span className="food-cals-bold">
                                                    {formatMetric(food.calories)} kcal
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedFood ? (
                                <div className="custom-food-detail search-result-detail-card">
                                    <div className="search-result-detail-header">
                                        <div>
                                            <h3>{selectedFood.name}</h3>
                                            <p>{selectedFood.serving || 'Serving unavailable'}</p>
                                        </div>
                                    </div>

                                    <div className="custom-food-detail-grid">
                                        <div>
                                            <span>Calories</span>
                                            <strong>{formatMetric(selectedFood.calories)} kcal</strong>
                                        </div>
                                        {NUTRITION_FIELDS.map((nutrient) => (
                                            <div key={nutrient.key}>
                                                <span>{nutrient.label}</span>
                                                <strong>
                                                    {formatNutrientValue(selectedFood.macros?.[nutrient.key], nutrient.unit)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="search-selection-note">
                                    Click a food result to view the full nutrition values.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="inline-empty-note">
                            {query.trim()
                                ? 'No foods found for that search. Try a different term.'
                                : 'Search for a food to see matching results and nutrition values.'}
                        </div>
                    )}
                </article>

                <article className="feature-card popular-card">
                    <h3>Popular Foods</h3>
                    <div className="pill-list">
                        {popularFoods.map((food) => (
                            <button
                                key={food.id}
                                type="button"
                                className="food-pill"
                                onClick={() => {
                                    setQuery(food.name);
                                    setResults([food]);
                                    setSelectedFoodId(food.id);
                                }}
                            >
                                <span className="food-name">{food.name}</span>
                                <span className="food-cal">({food.calories} cal)</span>
                            </button>
                        ))}
                    </div>
                </article>
            </section>
        </AppShell>
    );
};

export default NutritionPage;
