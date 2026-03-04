import { useState, useEffect } from 'react';
import { useMeals } from '../context/MealContext';
import './MealLog.css';

const MealLog = () => {
    const [formData, setFormData] = useState({
        food: '',
        amount: '',
        calories: ''
    });
    const { meals, addMeal, removeMeal } = useMeals();
    const [totalCalories, setTotalCalories] = useState(0);

    // Calculate total calories whenever meals change
    useEffect(() => {
        const total = meals.reduce((sum, meal) => sum + (parseInt(meal.calories) || 0), 0);
        setTotalCalories(total);
    }, [meals]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { food, amount, calories } = formData;

        if (!food.trim() || !amount.trim() || !calories.trim()) {
            alert('Please fill in all fields.');
            return;
        }

        const newMeal = {
            food: food.trim(),
            amount: amount.trim(),
            calories: parseInt(calories) || 0
        };

        try {
            await addMeal(newMeal);
            setFormData({ food: '', amount: '', calories: '' });
        } catch (error) {
            alert('Failed to add meal: ' + error.message);
        }
    };

    return (
        <section className="meal-log">
            <h2>Log a Meal</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="food">Food Name:</label>
                <input
                    type="text"
                    id="food"
                    name="food"
                    placeholder="e.g., Oatmeal"
                    value={formData.food}
                    onChange={handleInputChange}
                />

                <label htmlFor="amount">Portion:</label>
                <input
                    type="text"
                    id="amount"
                    name="amount"
                    placeholder="e.g., 1 cup"
                    value={formData.amount}
                    onChange={handleInputChange}
                />

                <label htmlFor="calories">Calories:</label>
                <input
                    type="number"
                    id="calories"
                    name="calories"
                    min="0"
                    placeholder="e.g., 150"
                    value={formData.calories}
                    onChange={handleInputChange}
                />

                <input type="submit" value="Add Meal" />
            </form>

            {meals.length > 0 && (
                <div className="meals-list">
                    <h3>Logged Meals (Total: {totalCalories} calories)</h3>
                    <ul>
                        {meals.map((meal) => (
                            <li key={meal._id || meal.id}>
                                <strong>{meal.food}</strong> - {meal.amount} ({meal.calories} cal)
                                <button
                                    className="delete-btn"
                                    onClick={async () => {
                                        try {
                                            await removeMeal(meal._id || meal.id);
                                        } catch (error) {
                                            alert('Failed to delete meal: ' + error.message);
                                        }
                                    }}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default MealLog;
