import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { dashboardAPI, nutritionAPI } from '../services/api';
import './FeaturePages.css';

const NutritionPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
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
        setError('');
        try {
            const data = await nutritionAPI.search(query);
            setResults(data.results || []);
        } catch (err) {
            setError(err.message || 'Search failed');
        }
    };

    const macroSummary = useMemo(() => {
        const percentages = summary?.macronutrientSummary?.percentages || { carbs: 0, protein: 0, fat: 0 };
        return `Carbs ${percentages.carbs}% | Protein ${percentages.protein}% | Fat ${percentages.fat}%`;
    }, [summary]);

    return (
        <AppShell title="Nutrition" subtitle="Search and explore food nutrition data">
            <section className="feature-layout single-column nutrition-container">
                <article className="feature-card search-card">
                    <h3>Nutrition Search</h3>
                    <div className="search-box-wrapper">
                        <div className="search-input-container">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search foods like salmon, quinoa, avocado..."
                            />
                        </div>
                        <button type="button" className="search-btn" onClick={handleSearch}>Search</button>
                    </div>
                    {error && <p className="inline-error">{error}</p>}

                    {results.length > 0 && (
                        <div className="table-wrap">
                            <table className="nutrition-table">
                                <thead>
                                    <tr>
                                        <th>Food</th>
                                        <th>Serving</th>
                                        <th>Calories</th>
                                        <th>Macros (C/P/F)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((food) => (
                                        <tr key={food.id}>
                                            <td>{food.name}</td>
                                            <td>{food.serving}</td>
                                            <td>{food.calories}</td>
                                            <td>{food.macros.carbs}/{food.macros.protein}/{food.macros.fat} g</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
