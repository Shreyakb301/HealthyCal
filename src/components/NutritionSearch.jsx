import { useState } from 'react';
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

        const url = `https://chomp.p.rapidapi.com/product-search.php?query=${encodeURIComponent(food)}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': '8f33dda4aemsh7011d0520c4f007p115f1bjsn4a18df6bc3a5',
                    'x-rapidapi-host': 'chomp-food-nutrition-database.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response formats
            if (!data || (Array.isArray(data) && data.length === 0)) {
                setNutritionResult('No data found for that food. Try a different search term.');
                return;
            }

            // Handle array response
            const item = Array.isArray(data) ? data[0] : data;
            
            // Extract nutrition information
            const name = item.name || item.product_name || 'Unknown';
            const calories = item.calories || item.energy || item.energy_kcal || 'N/A';
            const servingSize = item.serving_size_g || item.weight || 'N/A';
            const servingUnit = item.serving_unit || 'g';

            setNutritionResult(
                `${name.toUpperCase()} - ${calories} calories per ${servingSize}${servingUnit}`
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
