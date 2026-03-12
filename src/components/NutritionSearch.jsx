import { useState } from 'react';
import { nutritionAPI } from '../services/api';
import './NutritionSearch.css';

const NutritionSearch = () => {
    const [foodInput, setFoodInput] = useState('');
    const [nutritionResult, setNutritionResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        const food = foodInput.trim();
        if (!food) {
            setNutritionResult('Please enter a food name.');
            return;
        }

        setIsLoading(true);
        setError('');
        setNutritionResult('');
        localStorage.setItem('lastSearch', food);

        try {
            const data = await nutritionAPI.search(food);
            const results = Array.isArray(data.results) ? data.results : [];
            
            if (results.length === 0) {
                setNutritionResult('No data found for that food. Try a different search term.');
                return;
            }

            const item = results[0];
            const name = item.name || 'Unknown';
            const calories = item.calories ?? 'N/A';
            const serving = item.serving || 'Serving size unavailable';

            setNutritionResult(
                `${name} - ${calories} calories per ${serving}`
            );
        } catch (err) {
            setError(`Error fetching data: ${err.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="nutrition-search">
            <h2>Check Nutrition Facts</h2>
            <div className="search-container">
                <input
                    type="text"
                    id="foodInput"
                    placeholder="Enter a food (e.g., banana)"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button id="searchBtn" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Get Nutrition Info'}
                </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            {nutritionResult && (
                <div id="nutritionResult" className="nutrition-result">
                    <strong>{nutritionResult}</strong>
                </div>
            )}
        </section>
    );
};

export default NutritionSearch;
