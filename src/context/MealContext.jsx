import { createContext, useContext, useState, useEffect } from 'react';
import { mealsAPI } from '../services/api';

const MealContext = createContext();

export const useMeals = () => {
    const context = useContext(MealContext);
    if (!context) {
        throw new Error('useMeals must be used within a MealProvider');
    }
    return context;
};

export const MealProvider = ({ children }) => {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load meals from backend API on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadMeals();
        }
    }, []);

    const loadMeals = async () => {
        try {
            setLoading(true);
            setError(null);
            const mealsData = await mealsAPI.getAll();
            setMeals(mealsData);
        } catch (err) {
            console.error('Error loading meals:', err);
            setError(err.message);
            // Fallback to empty array if API fails
            setMeals([]);
        } finally {
            setLoading(false);
        }
    };

    const addMeal = async (meal) => {
        try {
            setError(null);
            const newMeal = await mealsAPI.create(meal);
            setMeals(prev => [...prev, newMeal]);
            return newMeal;
        } catch (err) {
            console.error('Error adding meal:', err);
            setError(err.message);
            throw err;
        }
    };

    const removeMeal = async (id) => {
        try {
            setError(null);
            await mealsAPI.delete(id);
            setMeals(prev => prev.filter(meal => meal._id !== id));
        } catch (err) {
            console.error('Error removing meal:', err);
            setError(err.message);
            throw err;
        }
    };

    const value = {
        meals,
        loading,
        error,
        addMeal,
        removeMeal,
        loadMeals
    };

    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    );
};
