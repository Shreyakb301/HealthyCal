import { useEffect, useMemo, useState } from 'react';
import AppShell from './AppShell';
import { useAuth } from '../context/AuthContext';
import { mealsAPI, nutritionAPI } from '../services/api';
import './FeaturePages.css';

const toDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fromDateStr = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
        return new Date();
    }

    const parts = dateStr.split('-').map(Number);

    if (parts.length !== 3 || parts.some((num) => Number.isNaN(num))) {
        return new Date();
    }

    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
};

const todayStr = () => toDateStr(new Date());

const formatDisplayDate = (dateStr) => {
    const today = todayStr();
    const yesterday = toDateStr(new Date(Date.now() - 86400000));

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    return fromDateStr(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
};

const formatAbsoluteDate = (dateStr) =>
    fromDateStr(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

const roundMetric = (value) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.round(parsed * 10) / 10;
};

const formatMetric = (value) => {
    const rounded = roundMetric(value);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const formatLoggedTime = (meal) => {
    const timestamp = meal?.date || meal?.createdAt;

    if (!timestamp) {
        return 'Time unavailable';
    }

    const parsed = new Date(timestamp);

    if (Number.isNaN(parsed.getTime())) {
        return 'Time unavailable';
    }

    return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
};

const buildLogDate = (dateStr) => {
    const base = fromDateStr(dateStr);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    return base.toISOString();
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const CORE_NUTRIENTS = [
    { key: 'carbs', label: 'Carbs', shortLabel: 'Carbs', unit: 'g', placeholder: 'Carbs (g)' },
    { key: 'protein', label: 'Protein', shortLabel: 'Protein', unit: 'g', placeholder: 'Protein (g)' },
    { key: 'fat', label: 'Fat', shortLabel: 'Fat', unit: 'g', placeholder: 'Fat (g)' }
];
const EXTRA_NUTRIENTS = [
    { key: 'fiber', label: 'Fiber', shortLabel: 'Fiber', unit: 'g', placeholder: 'Fiber (g)' },
    { key: 'sugar', label: 'Sugar', shortLabel: 'Sugar', unit: 'g', placeholder: 'Sugar (g)' },
    { key: 'sodium', label: 'Sodium', shortLabel: 'Sodium', unit: 'mg', placeholder: 'Sodium (mg)' },
    {
        key: 'cholesterol',
        label: 'Cholesterol',
        shortLabel: 'Cholesterol',
        unit: 'mg',
        placeholder: 'Cholesterol (mg)'
    },
    {
        key: 'saturatedFat',
        label: 'Saturated Fat',
        shortLabel: 'Sat. Fat',
        unit: 'g',
        placeholder: 'Saturated Fat (g)'
    }
];
const MAIN_MACRO_FIELDS = [
    { key: 'calories', label: 'Calories', placeholder: '0' },
    { key: 'protein', label: 'Protein', placeholder: 'g' },
    { key: 'carbs', label: 'Carbs', placeholder: 'g' },
    { key: 'fat', label: 'Fat', placeholder: 'g' }
];
const SAVED_MEAL_EXAMPLES = ['Chicken Bowl', 'Protein Oats', 'Burrito Bowl'];
const TRACKED_NUTRIENTS = [...CORE_NUTRIENTS, ...EXTRA_NUTRIENTS];
const SUMMARY_PILL_CLASS = {
    carbs: 'carbs-pill',
    protein: 'protein-pill',
    fat: 'fat-pill'
};

const buildEmptyNutrientValues = () =>
    TRACKED_NUTRIENTS.reduce((acc, nutrient) => {
        acc[nutrient.key] = '';
        return acc;
    }, {});

const roundNutrients = (source = {}) =>
    TRACKED_NUTRIENTS.reduce((acc, nutrient) => {
        acc[nutrient.key] = roundMetric(source?.[nutrient.key]);
        return acc;
    }, {});

const formatNutrients = (source = {}) =>
    TRACKED_NUTRIENTS.reduce((acc, nutrient) => {
        acc[nutrient.key] = formatMetric(source?.[nutrient.key]);
        return acc;
    }, {});

const formatNutrientValue = (value, unit) => `${formatMetric(value)}${unit}`;

const buildEmptyTotals = () => ({
    calories: 0,
    ...TRACKED_NUTRIENTS.reduce((acc, nutrient) => {
        acc[nutrient.key] = 0;
        return acc;
    }, {})
});

const SavedMealsEmptyState = () => (
    <div className="inline-empty-note inline-empty-note-rich">
        <p>Saved meals will appear here.</p>
        <p>Create reusable meals like:</p>
        <ul className="inline-empty-note-list">
            {SAVED_MEAL_EXAMPLES.map((mealName) => (
                <li key={mealName}>{mealName}</li>
            ))}
        </ul>
    </div>
);

const initialForm = {
    food: '',
    amount: '',
    calories: '',
    mealType: 'breakfast',
    ...buildEmptyNutrientValues()
};

const initialCustomInput = {
    name: '',
    amount: '',
    calories: '',
    ...buildEmptyNutrientValues()
};

const initialCalculatorInput = {
    name: '',
    serving: '1 serving',
    servings: '1',
    calories: '',
    ...buildEmptyNutrientValues()
};

const draftFromFood = (food) => ({
    name: food?.name || '',
    serving: food?.serving || '',
    calories: formatMetric(food?.calories),
    ...formatNutrients(food?.macros)
});

const entryFromDraft = (draft) => ({
    name: draft.name.trim(),
    serving: draft.serving.trim() || '1 serving',
    calories: roundMetric(draft.calories),
    macros: roundNutrients(draft)
});

const summarizeTotals = (items) =>
    items.reduce((acc, item) => {
        acc.calories = roundMetric(acc.calories + (item.calories || 0));

        TRACKED_NUTRIENTS.forEach((nutrient) => {
            acc[nutrient.key] = roundMetric(acc[nutrient.key] + (item.macros?.[nutrient.key] || 0));
        });

        return acc;
    }, buildEmptyTotals());

const MealLogPage = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('log');
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [formData, setFormData] = useState(initialForm);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedMealId, setExpandedMealId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [nutritionModal, setNutritionModal] = useState(null);
    const [mealTypeModal, setMealTypeModal] = useState(null);

    const [calculatorInput, setCalculatorInput] = useState(initialCalculatorInput);

    const [customMealName, setCustomMealName] = useState('');
    const [customInput, setCustomInput] = useState(initialCustomInput);
    const [customFoods, setCustomFoods] = useState([]);
    const [selectedCustomFoodId, setSelectedCustomFoodId] = useState(null);
    const [editingCustomMealId, setEditingCustomMealId] = useState(null);
    const [customMeals, setCustomMeals] = useState([]);
    const [customMealsLoaded, setCustomMealsLoaded] = useState(false);

    const customMealStorageKey = useMemo(
        () => `healthycal.customMeals.${user?.email || user?._id || 'default'}`,
        [user]
    );

    const loadMeals = async (date = selectedDate) => {
        setLoading(true);
        setError('');

        try {
            let data = await mealsAPI.getByDate(date);

            // If no data for current selected date, proactively try today (sync with push script behavior)
            if ((!Array.isArray(data) || data.length === 0) && date !== todayStr()) {
                const today = todayStr();
                const todayData = await mealsAPI.getByDate(today);

                if (Array.isArray(todayData) && todayData.length > 0) {
                    setSelectedDate(today);
                    data = todayData;
                }
            }

            setMeals(data);
        } catch (err) {
            setError(err.message || 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeals(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (!success) return undefined;

        const timer = window.setTimeout(() => setSuccess(''), 3000);
        return () => window.clearTimeout(timer);
    }, [success]);

    useEffect(() => {
        if (!customMealStorageKey) return;

        setCustomMealsLoaded(false);

        try {
            const raw = localStorage.getItem(customMealStorageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            setCustomMeals(Array.isArray(parsed) ? parsed : []);
        } catch (storageError) {
            console.error('Unable to load custom meals:', storageError);
            setCustomMeals([]);
        } finally {
            setCustomMealsLoaded(true);
        }
    }, [customMealStorageKey]);

    useEffect(() => {
        if (!customMealStorageKey || !customMealsLoaded) return;

        try {
            localStorage.setItem(customMealStorageKey, JSON.stringify(customMeals));
        } catch (storageError) {
            console.error('Unable to save custom meals:', storageError);
        }
    }, [customMealStorageKey, customMeals, customMealsLoaded]);

    useEffect(() => {
        if (!customFoods.length) {
            setSelectedCustomFoodId(null);
            return;
        }

        if (!customFoods.some((item) => item.id === selectedCustomFoodId)) {
            setSelectedCustomFoodId(customFoods[0].id);
        }
    }, [customFoods, selectedCustomFoodId]);

    useEffect(() => {
        const modalOpen = Boolean(nutritionModal) || Boolean(mealTypeModal);

        if (!modalOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setNutritionModal(null);
                setMealTypeModal(null);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleEscape);
        };
    }, [nutritionModal, mealTypeModal]);

    const changeDate = (delta) => {
        setSelectedDate((currentDate) => {
            const nextDate = fromDateStr(currentDate);
            nextDate.setDate(nextDate.getDate() + delta);
            const formatted = toDateStr(nextDate);

            if (formatted <= todayStr()) {
                return formatted;
            }

            return currentDate;
        });
    };

    const isToday = selectedDate === todayStr();

    const dayTotals = useMemo(() => summarizeTotals(meals), [meals]);

    const mealsByType = useMemo(
        () =>
            MEAL_TYPES.reduce(
                (acc, type) => ({
                    ...acc,
                    [type]: meals.filter((meal) => meal.mealType === type)
                }),
                {}
            ),
        [meals]
    );

    const calculatorPreview = useMemo(() => {
        const servings = roundMetric(calculatorInput.servings);
        const nutrients = TRACKED_NUTRIENTS.reduce((acc, nutrient) => {
            acc[nutrient.key] = roundMetric(roundMetric(calculatorInput[nutrient.key]) * servings);
            return acc;
        }, {});

        return {
            name: calculatorInput.name.trim(),
            serving: `${formatMetric(servings || 0)} x ${calculatorInput.serving.trim() || 'serving'}`,
            calories: roundMetric(roundMetric(calculatorInput.calories) * servings),
            macros: nutrients
        };
    }, [calculatorInput]);

    const calculatorReady =
        Boolean(calculatorInput.name.trim()) &&
        calculatorInput.calories !== '' &&
        roundMetric(calculatorInput.servings) > 0;

    const customMealTotals = useMemo(() => summarizeTotals(customFoods), [customFoods]);

    const selectedCustomFood = useMemo(
        () => customFoods.find((item) => item.id === selectedCustomFoodId) || null,
        [customFoods, selectedCustomFoodId]
    );

    const pageSubtitle =
        activeTab === 'log'
            ? formatDisplayDate(selectedDate)
            : 'Build, save, and reuse customized meals';

    const fillMealInput = (entry, successMessage = 'Meal input updated.') => {
        const nutrients = formatNutrients(entry.macros || entry);

        setActiveTab('log');
        setFormData((prev) => ({
            ...prev,
            food: entry.name,
            amount: entry.serving || '',
            calories: formatMetric(entry.calories),
            ...nutrients
        }));
        setSuccess(successMessage);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openMealTypeModal = (entry, options = {}) => {
        setMealTypeModal({
            entry,
            title: options.title || 'Add to Meal Log',
            description: options.description || 'Choose a meal type for this item.',
            successMessage: options.successMessage || 'Meal added to your log.'
        });
    };

    const addEntryToMealLog = async (entry, mealType, successMessage) => {
        try {
            setError('');

            await mealsAPI.create({
                name: entry.name,
                food: entry.name,
                amount: entry.serving || '',
                calories: roundMetric(entry.calories),
                mealType,
                date: buildLogDate(selectedDate),
                macros: roundNutrients(entry.macros)
            });

            setMealTypeModal(null);
            setExpandedMealId(null);
            setSuccess(successMessage || 'Meal added to your log.');
            await loadMeals(selectedDate);
        } catch (err) {
            setError(err.message || 'Failed to add meal');
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.food.trim() || formData.calories === '') {
            setError('Please enter what you ate and the calories.');
            return;
        }

        try {
            await mealsAPI.create({
                name: formData.food.trim(),
                food: formData.food.trim(),
                amount: formData.amount.trim() || formData.food.trim(),
                calories: roundMetric(formData.calories),
                mealType: formData.mealType,
                date: buildLogDate(selectedDate),
                macros: roundNutrients(formData)
            });

            setFormData(initialForm);
            setExpandedMealId(null);
            setSuccess('Meal saved!');
            await loadMeals(selectedDate);
        } catch (err) {
            setError(err.message || 'Failed to add meal');
        }
    };

    const handleDelete = async (mealId) => {
        try {
            await mealsAPI.delete(mealId);
            setExpandedMealId((current) => (current === mealId ? null : current));
            setSuccess('Meal removed.');
            await loadMeals(selectedDate);
        } catch (err) {
            setError(err.message || 'Failed to delete meal');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

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

    const handleNutritionDraftChange = (event) => {
        const { name, value } = event.target;
        setNutritionModal((current) =>
            current
                ? {
                    ...current,
                    draft: {
                        ...current.draft,
                        [name]: value
                    }
                }
                : current
        );
    };

    const openNutritionModal = (food, source = 'log') => {
        setNutritionModal({
            title: food.name,
            draft: draftFromFood(food),
            source
        });
    };

    const addNutritionToInput = () => {
        if (!nutritionModal) return;

        const entry = entryFromDraft(nutritionModal.draft);
        setNutritionModal(null);
        fillMealInput(entry, 'Nutrition values added to Add Meal.');
    };

    const addNutritionToCustomInput = () => {
        if (!nutritionModal) return;

        const entry = entryFromDraft(nutritionModal.draft);

        const ingredient = {
            id: uid(),
            name: entry.name || 'Custom ingredient',
            serving: entry.serving,
            calories: entry.calories,
            macros: entry.macros
        };

        setCustomFoods((current) => [...current, ingredient]);
        setSelectedCustomFoodId(ingredient.id);
        setCustomMealName((current) => current.trim() || ingredient.name);
        setCustomInput(initialCustomInput);
        setNutritionModal(null);
        setSuccess('Nutrition added to customized meal.');
        setError('');
    };

    const addNutritionToLogs = () => {
        if (!nutritionModal) return;

        const entry = entryFromDraft(nutritionModal.draft);
        setNutritionModal(null);
        openMealTypeModal(entry, {
            title: 'Log Search Result',
            description: 'Choose where this food should be added.',
            successMessage: 'Food added to your meal log.'
        });
    };

    const useNutritionInCalculator = () => {
        if (!nutritionModal) return;

        const draft = nutritionModal.draft;
        setCalculatorInput({
            name: draft.name.trim(),
            serving: draft.serving.trim() || '1 serving',
            servings: '1',
            calories: formatMetric(draft.calories),
            ...formatNutrients(draft)
        });
        setNutritionModal(null);
        setSuccess('Nutrition loaded into the calculator.');
        setError('');
    };

    const handleCalculatorChange = (event) => {
        const { name, value } = event.target;
        setCalculatorInput((prev) => ({ ...prev, [name]: value }));
    };

    const addCalculatorToInput = () => {
        if (!calculatorReady) {
            setError('Choose a food from Nutrition Search and set the servings before using the calculator.');
            return;
        }

        fillMealInput(calculatorPreview, 'Calculator values added to Add Meal.');
    };

    const addCalculatorToLogs = () => {
        if (!calculatorReady) {
            setError('Choose a food from Nutrition Search and set the servings before logging calculator values.');
            return;
        }

        openMealTypeModal(calculatorPreview, {
            title: 'Log Calculator Result',
            description: 'Choose where this calculated item should be added.',
            successMessage: 'Calculator result added to your meal log.'
        });
    };

    const handleCustomInputChange = (event) => {
        const { name, value } = event.target;
        setCustomInput((prev) => ({ ...prev, [name]: value }));
    };

    const calculateCaloriesFromMacros = (source) => {
        const protein = roundMetric(source.protein);
        const carbs = roundMetric(source.carbs);
        const fat = roundMetric(source.fat);

        if (!protein && !carbs && !fat) {
            return 0;
        }

        return roundMetric(carbs * 4 + protein * 4 + fat * 9);
    };

    const addCustomIngredient = (event) => {
        event.preventDefault();
        setError('');

        const ingredientName = customInput.name.trim() || customMealName.trim();
        const caloriesInput = String(customInput.calories || '').trim();
        const hasCalories = caloriesInput !== '';
        const caloriesValue = hasCalories ? roundMetric(caloriesInput) : calculateCaloriesFromMacros(customInput);

        if (!ingredientName) {
            setError('Enter a meal name (or ingredient name) before adding it.');
            return;
        }

        if (!hasCalories && caloriesValue === 0) {
            setError('Enter calories or macros before adding it.');
            return;
        }

        const ingredient = {
            id: uid(),
            name: ingredientName,
            serving: customInput.amount.trim() || '1 serving',
            calories: caloriesValue,
            macros: roundNutrients(customInput)
        };

        setCustomFoods((current) => [...current, ingredient]);
        setSelectedCustomFoodId(ingredient.id);
        setCustomInput(initialCustomInput);
        setSuccess('Ingredient added to customized meal.');
    };

    const removeCustomIngredient = (ingredientId) => {
        setCustomFoods((current) => current.filter((item) => item.id !== ingredientId));
        setSuccess('Ingredient removed.');
    };

    const resetCustomBuilder = () => {
        setCustomMealName('');
        setCustomInput(initialCustomInput);
        setCustomFoods([]);
        setSelectedCustomFoodId(null);
        setEditingCustomMealId(null);
    };

    const saveCustomizedMeal = () => {
        setError('');

        if (!customFoods.length) {
            setError('Add at least one ingredient before saving.');
            return;
        }

        const mealName = customMealName.trim() || customFoods[0]?.name || 'Customized meal';

        const savedMeal = {
            id: editingCustomMealId || uid(),
            name: mealName,
            calories: customMealTotals.calories,
            macros: roundNutrients(customMealTotals),
            items: customFoods.map(({ id, ...item }) => ({ ...item })),
            updatedAt: new Date().toISOString()
        };

        setCustomMeals((current) => {
            if (!editingCustomMealId) {
                return [savedMeal, ...current];
            }

            return current.map((meal) => (meal.id === editingCustomMealId ? savedMeal : meal));
        });

        resetCustomBuilder();
        setSuccess(editingCustomMealId ? 'Customized meal updated.' : 'Customized meal saved.');
    };

    const loadCustomMealForEditing = (meal) => {
        setActiveTab('customized');
        setCustomMealName(meal.name);
        setCustomFoods(
            (meal.items || []).map((item) => ({
                id: uid(),
                name: item.name,
                serving: item.serving || item.amount || '1 serving',
                calories: roundMetric(item.calories),
                macros: roundNutrients(item.macros)
            }))
        );
        setSelectedCustomFoodId(null);
        setEditingCustomMealId(meal.id);
        setCustomInput(initialCustomInput);
        setSuccess(`Loaded ${meal.name} into the builder.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const customMealLogEntry = (meal) => ({
        name: meal.name,
        serving: `${meal.items?.length || 0} ingredients`,
        calories: roundMetric(meal.calories),
        macros: roundNutrients(meal.macros)
    });

    return (
        <AppShell title="Meal Log" subtitle={pageSubtitle}>
            <div className="meal-log-page-wrapper">
                <div className="meal-log-tab-row" role="tablist" aria-label="Meal log tabs">
                    <button
                        type="button"
                        className={`meal-log-tab ${activeTab === 'log' ? 'active' : ''}`}
                        role="tab"
                        aria-selected={activeTab === 'log'}
                        onClick={() => setActiveTab('log')}
                    >
                        Log Meals
                    </button>
                    <button
                        type="button"
                        className={`meal-log-tab ${activeTab === 'customized' ? 'active' : ''}`}
                        role="tab"
                        aria-selected={activeTab === 'customized'}
                        onClick={() => setActiveTab('customized')}
                    >
                        Customized Meals
                    </button>
                </div>

                {error && <p className="inline-error">{error}</p>}
                {success && <p className="inline-success">{success}</p>}

                {activeTab === 'log' ? (
                    <>
                        <div className="date-nav-bar">
                            <button
                                type="button"
                                className="date-nav-btn"
                                onClick={() => changeDate(-1)}
                                disabled={loading}
                                title={loading ? 'Waiting for meal data to load' : 'Previous day'}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            <div className="date-nav-center">
                                <span className="date-display-label">{formatDisplayDate(selectedDate)}</span>
                                <span className="date-display-sub">{formatAbsoluteDate(selectedDate)}</span>
                            </div>

                            <div className="date-nav-right-group">
                                <input
                                    type="date"
                                    className="date-picker-input"
                                    value={selectedDate}
                                    max={todayStr()}
                                    onChange={(event) => {
                                        if (event.target.value) {
                                            setSelectedDate(event.target.value);
                                        }
                                    }}
                                    title="Jump to date"
                                />

                                <button
                                    type="button"
                                    className="date-nav-btn"
                                    onClick={() => changeDate(1)}
                                    disabled={isToday || loading}
                                    title={loading ? 'Waiting for meal data to load' : 'Next day'}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>

                                {!isToday && (
                                    <button
                                        type="button"
                                        className="today-btn"
                                        onClick={() => setSelectedDate(todayStr())}
                                    >
                                        Today
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="day-summary-strip">
                            <div className="summary-pill">
                                <span className="pill-val">{formatMetric(dayTotals.calories)}</span>
                                <span className="pill-label">kcal</span>
                            </div>
                            <div className="summary-pill carbs-pill">
                                <span className="pill-val">{formatMetric(dayTotals.carbs)}g</span>
                                <span className="pill-label">Carbs</span>
                            </div>
                            <div className="summary-pill protein-pill">
                                <span className="pill-val">{formatMetric(dayTotals.protein)}g</span>
                                <span className="pill-label">Protein</span>
                            </div>
                            <div className="summary-pill fat-pill">
                                <span className="pill-val">{formatMetric(dayTotals.fat)}g</span>
                                <span className="pill-label">Fat</span>
                            </div>
                            <div className="summary-pill count-pill">
                                <span className="pill-val">{meals.length}</span>
                                <span className="pill-label">Meals</span>
                            </div>
                        </div>

                        <section className="meal-log-top-grid">
                            <article className="feature-card add-meal-card">
                                <div className="add-meal-card-header">
                                    <h2>Meal Logs</h2>
                                </div>
                                <form className="feature-form meal-input-form" onSubmit={handleSubmit}>
                                    <div className="meal-input-form-body">
                                        <label className="meal-form-field">
                                            <span>Food Name</span>
                                            <input
                                                name="food"
                                                placeholder="What did you eat?"
                                                value={formData.food}
                                                onChange={handleChange}
                                                autoComplete="off"
                                            />
                                        </label>

                                        <div className="meal-form-meta-grid">
                                            <label className="meal-form-field">
                                                <span>Quantity / Serving</span>
                                                <input
                                                    name="amount"
                                                    placeholder="1 serving"
                                                    value={formData.amount}
                                                    onChange={handleChange}
                                                />
                                            </label>

                                            <label className="meal-form-field">
                                                <span>Meal Type</span>
                                                <select
                                                    name="mealType"
                                                    value={formData.mealType}
                                                    onChange={handleChange}
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                    <option value="snack">Snack</option>
                                                </select>
                                            </label>
                                        </div>

                                        <div className="meal-form-section">
                                            <p className="meal-form-section-title">Main macros</p>
                                            <div className="main-macro-grid">
                                                {MAIN_MACRO_FIELDS.map((field) => (
                                                    <label key={field.key} className="meal-form-field">
                                                        <span>{field.label}</span>
                                                        <input
                                                            name={field.key}
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            placeholder={field.placeholder}
                                                            value={formData[field.key]}
                                                            onChange={handleChange}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <details className="meal-form-details">
                                            <summary>
                                                <span>Additional Nutrition</span>
                                                <span className="meal-form-details-icon" aria-hidden="true">
                                                    ▼
                                                </span>
                                            </summary>

                                            <div className="nutrient-input-grid meal-form-details-body">
                                                {EXTRA_NUTRIENTS.map((nutrient) => (
                                                    <label key={nutrient.key} className="meal-form-field">
                                                        <span>{nutrient.label}</span>
                                                        <input
                                                            name={nutrient.key}
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            placeholder={nutrient.placeholder}
                                                            value={formData[nutrient.key]}
                                                            onChange={handleChange}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </details>
                                    </div>

                                    <div className="meal-input-form-footer">
                                        <button type="submit" className="save-meal-btn">
                                            Save Meal
                                        </button>
                                    </div>
                                </form>
                            </article>

                            <article className="feature-card meals-by-type-card">
                                <div className="card-fixed-header">
                                    <h2>{isToday ? "Today's Meals" : `Meals - ${formatDisplayDate(selectedDate)}`}</h2>
                                </div>

                                <div className="card-scroll-area">
                                    {loading ? (
                                        <div className="loading-state">Loading meals...</div>
                                    ) : meals.length === 0 ? (
                                        <div className="empty-day-state">
                                            <div className="empty-icon">🍽️</div>
                                            <p>No meals logged yet.</p>
                                            <span>Start by adding a food in the form. You can search foods or enter nutrition manually.</span>
                                        </div>
                                    ) : (
                                        <div className="meals-type-list">
                                            {MEAL_TYPES.map(
                                                (type) =>
                                                    mealsByType[type].length > 0 && (
                                                        <div key={type} className="meal-type-section">
                                                            <div className="meal-type-header">
                                                                <span className="meal-type-label">
                                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                                </span>
                                                                <span className="meal-type-cals">
                                                                    {formatMetric(
                                                                        mealsByType[type].reduce(
                                                                            (sum, meal) =>
                                                                                sum + (Number(meal.calories) || 0),
                                                                            0
                                                                        )
                                                                    )}{' '}
                                                                    kcal
                                                                </span>
                                                            </div>

                                                            {mealsByType[type].map((meal) => {
                                                                const mealId = meal._id || meal.id;
                                                                const isExpanded = expandedMealId === mealId;

                                                                return (
                                                                    <div
                                                                        key={mealId}
                                                                        className={`meal-entry-card ${isExpanded ? 'expanded' : ''}`}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className="meal-entry-toggle"
                                                                            onClick={() =>
                                                                                setExpandedMealId((current) =>
                                                                                    current === mealId ? null : mealId
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className="meal-entry-summary">
                                                                                <div className="meal-entry-info">
                                                                                    <strong className="meal-entry-name">
                                                                                        {meal.name ||
                                                                                            meal.food ||
                                                                                            meal.amount}
                                                                                    </strong>
                                                                                    <span className="meal-entry-meta">
                                                                                        {formatMetric(meal.calories)} kcal
                                                                                    </span>
                                                                                </div>
                                                                                <span className="meal-entry-expand">
                                                                                    {isExpanded ? '-' : '+'}
                                                                                </span>
                                                                            </div>
                                                                        </button>

                                                                        {isExpanded && (
                                                                            <div className="meal-entry-expanded">
                                                                                <div className="meal-entry-detail-grid">
                                                                                    {TRACKED_NUTRIENTS.map((nutrient) => (
                                                                                        <div
                                                                                            key={nutrient.key}
                                                                                            className="meal-entry-detail"
                                                                                        >
                                                                                            <span>{nutrient.label}</span>
                                                                                            <strong>
                                                                                                {formatNutrientValue(
                                                                                                    meal.macros?.[
                                                                                                        nutrient.key
                                                                                                    ],
                                                                                                    nutrient.unit
                                                                                                )}
                                                                                            </strong>
                                                                                        </div>
                                                                                    ))}
                                                                                    <div className="meal-entry-detail">
                                                                                        <span>Time</span>
                                                                                        <strong>{formatLoggedTime(meal)}</strong>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="meal-entry-actions">
                                                                                    <span>
                                                                                        Quantity:{' '}
                                                                                        {meal.amount?.trim() || '1 serving'}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="meal-remove-btn"
                                                                                        onClick={() => handleDelete(mealId)}
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        </section>

                        <section className="meal-log-bottom-grid">
                            <article className="feature-card my-meals-card">
                                <div className="card-fixed-header">
                                    <h3>My Meals</h3>
                                </div>
                                <div className="card-scroll-area">
                                    {customMeals.length === 0 ? (
                                        <SavedMealsEmptyState />
                                    ) : (
                                        <div className="saved-meals-list">
                                            {customMeals.map((meal) => (
                                                <div key={meal.id} className="saved-meal-row">
                                                    <div className="saved-meal-copy">
                                                        <strong>{meal.name}</strong>
                                                        <span>{formatMetric(meal.calories)} kcal</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="saved-meal-btn"
                                                        onClick={() =>
                                                            openMealTypeModal(customMealLogEntry(meal), {
                                                                title: `Add ${meal.name}`,
                                                                description: 'Choose a meal type for this saved meal.',
                                                                successMessage: `${meal.name} added to your meal log.`
                                                            })
                                                        }
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </article>

                            <article className="feature-card search-main-card">
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
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                                            placeholder="Search foods, e.g. chicken breast..."
                                        />
                                        <button
                                            type="button"
                                            className="search-inline-btn"
                                            onClick={handleSearch}
                                            disabled={isSearching}
                                            aria-label={isSearching ? 'Searching' : 'Search foods'}
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

                                <div className="card-scroll-area">
                                    {searchResults.length > 0 ? (
                                        <div className="search-results-list">
                                            {searchResults.map((food) => (
                                                <button
                                                    key={food.id}
                                                    type="button"
                                                    className="search-result-item search-result-select"
                                                    onClick={() => openNutritionModal(food, 'log')}
                                                >
                                                    <div className="food-details">
                                                        <span className="food-name">{food.name}</span>
                                                        <small className="food-serv">
                                                            {food.serving || 'Serving size unavailable'}
                                                        </small>
                                                    </div>
                                                    <div className="food-actions">
                                                        <span className="food-cals-bold">
                                                            {formatMetric(food.calories)} kcal
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="inline-empty-note">
                                            Search for a food to review and edit its nutrition values.
                                        </div>
                                    )}
                                </div>
                            </article>

                            <article className="feature-card calculator-card">
                                <div className="card-fixed-header">
                                    <div className="card-header-with-icon">
                                        <h3>Nutrition Calculator</h3>
                                    </div>
                                </div>

                                <div className="calculator-form-stack">
                                    <div className="card-scroll-area calculator-scroll-area">
                                        {calculatorInput.name.trim() ? (
                                            <>
                                                <div className="calculator-source-card">
                                                    <div className="calculator-source-copy">
                                                        <span>Selected food</span>
                                                        <strong>{calculatorInput.name}</strong>
                                                    </div>
                                                    <small>Loaded from Nutrition Search</small>
                                                </div>

                                                <div className="search-row">
                                                    <input
                                                        name="serving"
                                                        placeholder="Serving label"
                                                        value={calculatorInput.serving}
                                                        onChange={handleCalculatorChange}
                                                    />
                                                    <input
                                                        name="servings"
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        placeholder="Servings"
                                                        value={calculatorInput.servings}
                                                        onChange={handleCalculatorChange}
                                                    />
                                                </div>

                                                <div className="calculator-base-grid">
                                                    <div className="calculator-base-item">
                                                        <span>Calories</span>
                                                        <strong>{formatMetric(calculatorInput.calories)} kcal</strong>
                                                    </div>
                                                    {TRACKED_NUTRIENTS.map((nutrient) => (
                                                        <div key={nutrient.key} className="calculator-base-item">
                                                            <span>{nutrient.label}</span>
                                                            <strong>
                                                                {formatNutrientValue(
                                                                    calculatorInput[nutrient.key],
                                                                    nutrient.unit
                                                                )}
                                                            </strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="inline-empty-note calculator-empty-note">
                                                Select a food from Nutrition Search and choose Use in Calculator to
                                                adjust serving totals here.
                                            </div>
                                        )}

                                        <div className="calculator-preview-panel">
                                            <strong>Total: {formatMetric(calculatorPreview.calories)} kcal</strong>
                                            <div className="calculator-preview-grid">
                                                {TRACKED_NUTRIENTS.map((nutrient) => (
                                                    <div key={nutrient.key} className="calculator-base-item">
                                                        <span>{nutrient.label}</span>
                                                        <strong>
                                                            {formatNutrientValue(
                                                                calculatorPreview.macros?.[nutrient.key],
                                                                nutrient.unit
                                                            )}
                                                        </strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-fixed-footer">
                                        <div className="calculator-action-row">
                                            <button
                                                type="button"
                                                className="save-meal-btn calculator-action-btn"
                                                onClick={addCalculatorToInput}
                                                disabled={!calculatorReady}
                                            >
                                                Add to Meal Input Values
                                            </button>
                                            <button
                                                type="button"
                                                className="calculator-secondary-btn"
                                                onClick={addCalculatorToLogs}
                                                disabled={!calculatorReady}
                                            >
                                                Add Directly to Meal Logs
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </section>
                    </>
                ) : (
                    <>
                        <section className="customized-meal-grid">
                            <article className="feature-card customized-input-card">
                                <div className="card-fixed-header">
                                    <h2>Customize Input Values</h2>
                                </div>
                                <form className="feature-form customized-input-form" onSubmit={addCustomIngredient}>
                                    <div className="card-scroll-area customized-input-scroll-area">
                                        <input
                                            placeholder="Customized meal name"
                                            value={customMealName}
                                            onChange={(event) => setCustomMealName(event.target.value)}
                                        />

                                        {editingCustomMealId && (
                                            <div className="custom-meal-status">
                                                Editing saved meal. Update the ingredients and save again.
                                            </div>
                                        )}

                                        <div className="search-row">
                                            <input
                                                name="amount"
                                                placeholder="1 serving"
                                                value={customInput.amount}
                                                onChange={handleCustomInputChange}
                                            />
                                            <input
                                                name="calories"
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                placeholder="0"
                                                value={customInput.calories}
                                                onChange={handleCustomInputChange}
                                            />
                                        </div>

                                        <div className="triple-grid">
                                            {CORE_NUTRIENTS.map((nutrient) => (
                                                <input
                                                    key={nutrient.key}
                                                    name={nutrient.key}
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    placeholder={nutrient.shortLabel}
                                                    value={customInput[nutrient.key]}
                                                    onChange={handleCustomInputChange}
                                                />
                                            ))}
                                        </div>

                                        <div className="nutrient-input-grid">
                                            {EXTRA_NUTRIENTS.map((nutrient) => (
                                                <input
                                                    key={nutrient.key}
                                                    name={nutrient.key}
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    placeholder={nutrient.shortLabel}
                                                    value={customInput[nutrient.key]}
                                                    onChange={handleCustomInputChange}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card-fixed-footer">
                                        <div className="customized-action-row">
                                            <button type="submit" className="save-meal-btn custom-action-btn">
                                                Add Ingredient
                                            </button>
                                            <button
                                                type="button"
                                                className="calculator-secondary-btn"
                                                onClick={saveCustomizedMeal}
                                            >
                                                {editingCustomMealId ? 'Update Meal' : 'Save Meal'}
                                            </button>
                                            <button
                                                type="button"
                                                className="custom-reset-btn"
                                                onClick={resetCustomBuilder}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </article>

                            <article className="feature-card customized-food-list-card">
                                <div className="card-fixed-header">
                                    <h2>Food List</h2>
                                </div>
                                <div className="card-scroll-area">
                                    {customFoods.length === 0 ? (
                                        <div className="inline-empty-note">
                                            Add ingredients on the left to build a customized meal.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="custom-food-list">
                                                {customFoods.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`custom-food-row ${selectedCustomFoodId === item.id ? 'active' : ''}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="custom-food-select"
                                                            onClick={() => setSelectedCustomFoodId(item.id)}
                                                        >
                                                            <div>
                                                                <strong>{item.name}</strong>
                                                                <span>{item.serving}</span>
                                                            </div>
                                                            <span>{formatMetric(item.calories)} kcal</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="custom-food-remove"
                                                            onClick={() => removeCustomIngredient(item.id)}
                                                        >
                                                            x
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {selectedCustomFood && (
                                                <div className="custom-food-detail">
                                                    <h3>{selectedCustomFood.name}</h3>
                                                    <p>{selectedCustomFood.serving}</p>
                                                    <div className="custom-food-detail-grid">
                                                        <div>
                                                            <span>Calories</span>
                                                            <strong>{formatMetric(selectedCustomFood.calories)} kcal</strong>
                                                        </div>
                                                        {TRACKED_NUTRIENTS.map((nutrient) => (
                                                            <div key={nutrient.key}>
                                                                <span>{nutrient.label}</span>
                                                                <strong>
                                                                    {formatNutrientValue(
                                                                        selectedCustomFood.macros?.[nutrient.key],
                                                                        nutrient.unit
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </article>
                        </section>

                        <article className="feature-card search-main-card customized-search-card">
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
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                                        placeholder="Search foods, e.g. chicken breast..."
                                    />
                                    <button
                                        type="button"
                                        className="search-inline-btn"
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        aria-label={isSearching ? 'Searching' : 'Search foods'}
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

                            <div className="card-scroll-area">
                                {searchResults.length > 0 ? (
                                    <div className="search-results-list">
                                        {searchResults.map((food) => (
                                            <button
                                                key={food.id}
                                                type="button"
                                                className="search-result-item search-result-select"
                                                onClick={() => openNutritionModal(food, 'customized')}
                                            >
                                                <div className="food-details">
                                                    <span className="food-name">{food.name}</span>
                                                    <small className="food-serv">
                                                        {food.serving || 'Serving size unavailable'}
                                                    </small>
                                                </div>
                                                <div className="food-actions">
                                                    <span className="food-cals-bold">
                                                        {formatMetric(food.calories)} kcal
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="inline-empty-note">
                                        Search for a food to review and add it to your customized meal.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="feature-card my-custom-meals-card">
                            <div className="card-fixed-header">
                                <h3>My Meals</h3>
                            </div>
                            <div className="card-scroll-area">
                                {customMeals.length === 0 ? (
                                    <SavedMealsEmptyState />
                                ) : (
                                    <div className="saved-custom-meals-list">
                                        {customMeals.map((meal) => (
                                                <div key={meal.id} className="saved-custom-meal-row">
                                                    <div className="saved-custom-meal-copy">
                                                        <strong>{meal.name}</strong>
                                                        <span>
                                                            {formatMetric(meal.calories)} kcal |{' '}
                                                            {formatMetric(meal.macros?.protein)}P |{' '}
                                                            {formatMetric(meal.macros?.carbs)}C |{' '}
                                                            {formatMetric(meal.macros?.fat)}F
                                                        </span>
                                                        <span>
                                                            {formatMetric(meal.macros?.fiber)} Fiber |{' '}
                                                            {formatMetric(meal.macros?.sugar)} Sugar |{' '}
                                                            {formatMetric(meal.macros?.sodium)}mg Sodium |{' '}
                                                            {formatMetric(meal.macros?.cholesterol)}mg Cholesterol |{' '}
                                                            {formatMetric(meal.macros?.saturatedFat)}g Sat. Fat
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="saved-meal-btn"
                                                    onClick={() => loadCustomMealForEditing(meal)}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    </>
                )}
            </div>

            {nutritionModal && (
                <div
                    className="meal-modal-backdrop"
                    onClick={() => setNutritionModal(null)}
                    role="presentation"
                >
                    <div
                        className="meal-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="nutrition-modal-title"
                    >
                        <div className="meal-modal-header">
                            <div>
                                <h3 id="nutrition-modal-title">{nutritionModal.title}</h3>
                                <p>
                                    {nutritionModal.source === 'customized'
                                        ? 'Adjust nutrition values before adding this ingredient to your customized meal.'
                                        : 'Adjust nutrition values before using this food.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="meal-modal-close"
                                onClick={() => setNutritionModal(null)}
                            >
                                x
                            </button>
                        </div>

                        <div className="meal-modal-form">
                            <div className="meal-modal-grid meal-modal-grid-identity">
                                <label className="meal-modal-field">
                                    <span>Food name</span>
                                    <input
                                        name="name"
                                        value={nutritionModal.draft.name}
                                        onChange={handleNutritionDraftChange}
                                    />
                                </label>
                                <label className="meal-modal-field">
                                    <span>Quantity / serving</span>
                                    <input
                                        name="serving"
                                        value={nutritionModal.draft.serving}
                                        onChange={handleNutritionDraftChange}
                                    />
                                </label>
                            </div>

                            <div className="meal-modal-section">
                                <p className="meal-modal-section-title">Main nutrition</p>
                                <div className="meal-modal-macro-grid">
                                    <label className="meal-modal-field">
                                        <span>Calories</span>
                                        <input
                                            name="calories"
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={nutritionModal.draft.calories}
                                            onChange={handleNutritionDraftChange}
                                        />
                                    </label>
                                    {CORE_NUTRIENTS.map((nutrient) => (
                                        <label key={nutrient.key} className="meal-modal-field">
                                            <span>{nutrient.label}</span>
                                            <input
                                                name={nutrient.key}
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={nutritionModal.draft[nutrient.key]}
                                                onChange={handleNutritionDraftChange}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="meal-modal-section">
                                <p className="meal-modal-section-title">Additional nutrition</p>
                                <div className="meal-modal-grid meal-modal-grid-details">
                                    {EXTRA_NUTRIENTS.map((nutrient) => (
                                        <label key={nutrient.key} className="meal-modal-field">
                                            <span>{nutrient.label}</span>
                                            <input
                                                name={nutrient.key}
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={nutritionModal.draft[nutrient.key]}
                                                onChange={handleNutritionDraftChange}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="meal-modal-actions">
                            {nutritionModal.source === 'customized' ? (
                                <button
                                    type="button"
                                    className="modal-primary-btn"
                                    onClick={addNutritionToCustomInput}
                                >
                                    Add to Customize Input Values
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="modal-secondary-btn"
                                        onClick={useNutritionInCalculator}
                                    >
                                        Use in Calculator
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-secondary-btn"
                                        onClick={addNutritionToInput}
                                    >
                                        Add to Meal Input Values
                                    </button>
                                    <button type="button" className="modal-primary-btn" onClick={addNutritionToLogs}>
                                        Add Directly to Meal Logs
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {mealTypeModal && (
                <div
                    className="meal-modal-backdrop"
                    onClick={() => setMealTypeModal(null)}
                    role="presentation"
                >
                    <div
                        className="meal-modal meal-type-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="meal-type-modal-title"
                    >
                        <div className="meal-modal-header">
                            <div>
                                <h3 id="meal-type-modal-title">{mealTypeModal.title}</h3>
                                <p>{mealTypeModal.description}</p>
                            </div>
                            <button
                                type="button"
                                className="meal-modal-close"
                                onClick={() => setMealTypeModal(null)}
                            >
                                x
                            </button>
                        </div>

                        <div className="meal-type-choice-grid">
                            {MEAL_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className="meal-type-choice"
                                    onClick={() =>
                                        addEntryToMealLog(
                                            mealTypeModal.entry,
                                            type,
                                            mealTypeModal.successMessage
                                        )
                                    }
                                >
                                    <strong>{type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                                    <span>Add to {type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default MealLogPage;
