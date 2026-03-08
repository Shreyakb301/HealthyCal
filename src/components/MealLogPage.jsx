import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { mealsAPI } from '../services/api';
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

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            <section className="feature-layout">
                <article className="feature-card">
                    <h2>Add Meal</h2>
                    <form className="feature-form" onSubmit={handleSubmit}>
                        <input type="time" name="name" placeholder="Time" value={formData.name} onChange={handleChange} />
                        <input name="amount" placeholder="Portion (e.g., 1 bowl)" value={formData.amount} onChange={handleChange} />
                        <input name="calories" type="number" min="0" placeholder="Calories" value={formData.calories} onChange={handleChange} />
                        <select name="mealType" value={formData.mealType} onChange={handleChange}>
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                        <input name="imageUrl" placeholder="Image URL (optional)" value={formData.imageUrl} onChange={handleChange} />
                        <div className="triple-grid">
                            <input name="carbs" type="number" min="0" step="any" placeholder="Carbs (g)" value={formData.carbs} onChange={handleChange} />
                            <input name="protein" type="number" min="0" step="any" placeholder="Protein (g)" value={formData.protein} onChange={handleChange} />
                            <input name="fat" type="number" min="0" step="any" placeholder="Fat (g)" value={formData.fat} onChange={handleChange} />
                        </div>
                        <button type="submit">Save Meal</button>
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
                                    <div>
                                        <strong>{meal.name || meal.food}</strong>
                                        <p>{meal.mealType || 'snack'} - {meal.amount} - {meal.calories} cal</p>
                                    </div>
                                    <button type="button" className="danger-btn" onClick={() => handleDelete(meal._id || meal.id)}>
                                        Delete
                                    </button>
                                </div>
                            ))}
                            {meals.length === 0 && <p>No meals logged yet.</p>}
                        </div>
                    )}
                </article>
            </section>
        </AppShell>
    );
};

export default MealLogPage;
