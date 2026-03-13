import 'dotenv/config';
import mongoose from 'mongoose';
import Meal from '../models/Meal.js';
import User from '../models/User.js';

const MEAL_WINDOWS = {
    breakfast: { startHour: 7, endHour: 9 },
    lunch: { startHour: 12, endHour: 14 },
    snack: { startHour: 16, endHour: 17 },
    dinner: { startHour: 19, endHour: 21 }
};

const breakfastTemplates = [
    {
        slug: 'oatmeal-protein-berries',
        name: 'Oatmeal with berries, protein powder, granola & chia',
        weight: 4,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 generous bowl', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.93 }
        ],
        nutrients: { carbs: 58, protein: 31, fat: 13, fiber: 10, sugar: 13, sodium: 220, cholesterol: 15, saturatedFat: 3 }
    },
    {
        slug: 'oatmeal-fruit-yogurt',
        name: 'Oatmeal with fruit and yogurt',
        weight: 3,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 medium bowl', factor: 0.95 },
            { label: '1 bowl + extra fruit', factor: 1.06 }
        ],
        nutrients: { carbs: 49, protein: 20, fat: 9, fiber: 8, sugar: 15, sodium: 140, cholesterol: 10, saturatedFat: 2 }
    },
    {
        slug: 'oatmeal-apple-protein',
        name: 'Protein oatmeal with apple and chia seeds',
        weight: 3,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 hearty bowl', factor: 1.1 },
            { label: '3/4 bowl', factor: 0.92 }
        ],
        nutrients: { carbs: 54, protein: 29, fat: 11, fiber: 9, sugar: 14, sodium: 210, cholesterol: 12, saturatedFat: 2.5 }
    },
    {
        slug: 'broken-wheat-upma',
        name: 'Broken wheat upma with yogurt',
        weight: 2,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1.25 cups', factor: 1.06 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        nutrients: { carbs: 48, protein: 13, fat: 11, fiber: 7, sugar: 5, sodium: 360, cholesterol: 6, saturatedFat: 2 }
    },
    {
        slug: 'paneer-paratha',
        name: 'Paneer paratha with yogurt',
        weight: 2,
        amounts: [
            { label: '2 parathas', factor: 1 },
            { label: '1 large paratha + yogurt', factor: 0.92 },
            { label: '2 parathas + extra yogurt', factor: 1.08 }
        ],
        nutrients: { carbs: 43, protein: 24, fat: 19, fiber: 4, sugar: 6, sodium: 420, cholesterol: 35, saturatedFat: 8 }
    },
    {
        slug: 'eggs-fruit-yogurt',
        name: 'Eggs, yogurt and fruit',
        weight: 2,
        amounts: [
            { label: '2 eggs + 1 bowl yogurt', factor: 1 },
            { label: '3 eggs + fruit', factor: 1.08 },
            { label: '2 eggs + fruit plate', factor: 0.94 }
        ],
        nutrients: { carbs: 24, protein: 28, fat: 18, fiber: 3, sugar: 11, sodium: 330, cholesterol: 290, saturatedFat: 5 }
    },
    {
        slug: 'greek-yogurt-granola',
        name: 'Greek yogurt with fruit and granola',
        weight: 2,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 large bowl', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.9 }
        ],
        nutrients: { carbs: 42, protein: 23, fat: 10, fiber: 5, sugar: 17, sodium: 115, cholesterol: 12, saturatedFat: 2.5 }
    },
    {
        slug: 'eggs-oats-fruit',
        name: 'Eggs, oats and fruit',
        weight: 2,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 large plate', factor: 1.06 },
            { label: '1 light plate', factor: 0.9 }
        ],
        nutrients: { carbs: 37, protein: 27, fat: 16, fiber: 5, sugar: 10, sodium: 280, cholesterol: 210, saturatedFat: 4.5 }
    }
];

const lunchTemplates = [
    {
        slug: 'chicken-vegetables',
        name: 'Chicken and vegetables',
        weight: 3,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + extra veggies', factor: 1.03 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        nutrients: { carbs: 24, protein: 38, fat: 15, fiber: 6, sugar: 7, sodium: 350, cholesterol: 105, saturatedFat: 3.5 }
    },
    {
        slug: 'pasta-chicken',
        name: 'Pasta with vegetables and chicken',
        weight: 3,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.91 }
        ],
        nutrients: { carbs: 62, protein: 34, fat: 16, fiber: 6, sugar: 7, sodium: 510, cholesterol: 85, saturatedFat: 4 }
    },
    {
        slug: 'rajma-rice',
        name: 'Rajma with rice',
        weight: 3,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.9 }
        ],
        nutrients: { carbs: 69, protein: 18, fat: 8, fiber: 14, sugar: 6, sodium: 420, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'rajma-chapati',
        name: 'Rajma with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 56, protein: 19, fat: 9, fiber: 15, sugar: 6, sodium: 410, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'chicken-curry-rice',
        name: 'Chicken curry with rice',
        weight: 3,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 52, protein: 35, fat: 18, fiber: 4, sugar: 6, sodium: 560, cholesterol: 115, saturatedFat: 5 }
    },
    {
        slug: 'chicken-curry-chapati',
        name: 'Chicken curry with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.06 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 43, protein: 34, fat: 17, fiber: 5, sugar: 5, sodium: 540, cholesterol: 110, saturatedFat: 5 }
    },
    {
        slug: 'palak-paneer-rice',
        name: 'Palak paneer with rice',
        weight: 2,
        amounts: [
            { label: '1 bowl + 3/4 cup rice', factor: 1 },
            { label: '1 bowl + 1 cup rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 41, protein: 23, fat: 20, fiber: 7, sugar: 6, sodium: 470, cholesterol: 40, saturatedFat: 8 }
    },
    {
        slug: 'palak-paneer-chapati',
        name: 'Palak paneer with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 34, protein: 24, fat: 21, fiber: 8, sugar: 5, sodium: 460, cholesterol: 40, saturatedFat: 8 }
    },
    {
        slug: 'chole-rice',
        name: 'Chole with rice',
        weight: 2,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 72, protein: 19, fat: 10, fiber: 14, sugar: 8, sodium: 430, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'dal-rice',
        name: 'Dal with rice',
        weight: 2,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 62, protein: 21, fat: 8, fiber: 11, sugar: 5, sodium: 390, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'dal-chapati',
        name: 'Dal with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 51, protein: 20, fat: 9, fiber: 10, sugar: 4, sodium: 380, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'burrito-wrap',
        name: 'Burrito wrap',
        weight: 2,
        amounts: [
            { label: '1 wrap', factor: 1 },
            { label: '1 large wrap', factor: 1.08 },
            { label: '3/4 wrap + salad', factor: 0.9 }
        ],
        nutrients: { carbs: 54, protein: 31, fat: 16, fiber: 10, sugar: 5, sodium: 560, cholesterol: 70, saturatedFat: 4 }
    },
    {
        slug: 'sandwich-salad',
        name: 'Sandwich with salad',
        weight: 2,
        amounts: [
            { label: '1 sandwich + salad', factor: 1 },
            { label: '1 large sandwich + salad', factor: 1.08 },
            { label: '1 sandwich', factor: 0.9 }
        ],
        nutrients: { carbs: 44, protein: 28, fat: 14, fiber: 5, sugar: 7, sodium: 620, cholesterol: 60, saturatedFat: 3 }
    },
    {
        slug: 'fried-rice-chicken',
        name: 'Fried rice with vegetables and chicken',
        weight: 2,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.9 }
        ],
        nutrients: { carbs: 67, protein: 29, fat: 15, fiber: 5, sugar: 5, sodium: 720, cholesterol: 90, saturatedFat: 3.5 }
    },
    {
        slug: 'chicken-salad',
        name: 'Salad with chicken',
        weight: 1,
        amounts: [
            { label: '1 salad bowl', factor: 1 },
            { label: '1 large salad bowl', factor: 1.08 },
            { label: '1 light salad bowl', factor: 0.9 }
        ],
        nutrients: { carbs: 18, protein: 30, fat: 14, fiber: 5, sugar: 5, sodium: 340, cholesterol: 80, saturatedFat: 2.5 }
    }
];

const dinnerTemplates = [
    {
        slug: 'chicken-curry-rice-dinner',
        name: 'Chicken curry with rice',
        weight: 3,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 55, protein: 36, fat: 19, fiber: 4, sugar: 6, sodium: 580, cholesterol: 120, saturatedFat: 5.5 }
    },
    {
        slug: 'chicken-curry-chapati-dinner',
        name: 'Chicken curry with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 45, protein: 35, fat: 18, fiber: 5, sugar: 5, sodium: 560, cholesterol: 115, saturatedFat: 5 }
    },
    {
        slug: 'palak-paneer-chapati-dinner',
        name: 'Palak paneer with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.06 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 35, protein: 23, fat: 22, fiber: 8, sugar: 5, sodium: 470, cholesterol: 42, saturatedFat: 8.5 }
    },
    {
        slug: 'dal-rice-dinner',
        name: 'Dal with rice',
        weight: 2,
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        nutrients: { carbs: 64, protein: 22, fat: 9, fiber: 12, sugar: 5, sodium: 400, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'chole-chapati-dinner',
        name: 'Chole with chapati',
        weight: 2,
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        nutrients: { carbs: 52, protein: 19, fat: 10, fiber: 12, sugar: 6, sodium: 420, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'pasta-chicken-dinner',
        name: 'Pasta with vegetables and chicken',
        weight: 2,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.92 }
        ],
        nutrients: { carbs: 66, protein: 27, fat: 18, fiber: 6, sugar: 7, sodium: 540, cholesterol: 80, saturatedFat: 4.5 }
    },
    {
        slug: 'fried-rice-dinner',
        name: 'Fried rice with vegetables and chicken',
        weight: 2,
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.9 }
        ],
        nutrients: { carbs: 71, protein: 28, fat: 16, fiber: 5, sugar: 5, sodium: 760, cholesterol: 95, saturatedFat: 3.5 }
    },
    {
        slug: 'tacos-dinner',
        name: 'Tacos',
        weight: 2,
        amounts: [
            { label: '3 tacos', factor: 1 },
            { label: '2 tacos + side salad', factor: 0.9 },
            { label: '3 tacos + salsa', factor: 1.06 }
        ],
        nutrients: { carbs: 48, protein: 32, fat: 18, fiber: 7, sugar: 4, sodium: 650, cholesterol: 70, saturatedFat: 5 }
    },
    {
        slug: 'burrito-wrap-dinner',
        name: 'Burrito wrap',
        weight: 2,
        amounts: [
            { label: '1 wrap', factor: 1 },
            { label: '1 large wrap', factor: 1.08 },
            { label: '3/4 wrap + salad', factor: 0.92 }
        ],
        nutrients: { carbs: 58, protein: 33, fat: 18, fiber: 10, sugar: 5, sodium: 590, cholesterol: 75, saturatedFat: 4.5 }
    },
    {
        slug: 'grilled-chicken-salad-dinner',
        name: 'Grilled chicken meal with salad',
        weight: 1,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + extra salad', factor: 1.05 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        nutrients: { carbs: 30, protein: 40, fat: 16, fiber: 6, sugar: 8, sodium: 430, cholesterol: 115, saturatedFat: 3.5 }
    }
];

const restaurantTemplates = [
    {
        slug: 'restaurant-pizza',
        name: 'Restaurant pizza',
        weight: 2,
        amounts: [
            { label: '2 large slices', factor: 1 },
            { label: '3 slices', factor: 1.16 },
            { label: '2 slices + side salad', factor: 0.95 }
        ],
        nutrients: { carbs: 78, protein: 30, fat: 28, fiber: 5, sugar: 6, sodium: 1120, cholesterol: 70, saturatedFat: 12 }
    },
    {
        slug: 'restaurant-pasta',
        name: 'Restaurant pasta',
        weight: 2,
        amounts: [
            { label: '1 entree plate', factor: 1 },
            { label: '1 large entree plate', factor: 1.1 },
            { label: '3/4 entree plate', factor: 0.9 }
        ],
        nutrients: { carbs: 74, protein: 28, fat: 24, fiber: 6, sugar: 8, sodium: 980, cholesterol: 75, saturatedFat: 11 }
    },
    {
        slug: 'restaurant-tacos',
        name: 'Restaurant tacos',
        weight: 2,
        amounts: [
            { label: '3 tacos', factor: 1 },
            { label: '3 tacos + chips', factor: 1.1 },
            { label: '2 tacos + salad', factor: 0.9 }
        ],
        nutrients: { carbs: 54, protein: 31, fat: 24, fiber: 8, sugar: 5, sodium: 870, cholesterol: 70, saturatedFat: 8 }
    },
    {
        slug: 'restaurant-burrito',
        name: 'Restaurant burrito wrap',
        weight: 2,
        amounts: [
            { label: '1 wrap', factor: 1 },
            { label: '1 large wrap', factor: 1.1 },
            { label: '3/4 wrap', factor: 0.9 }
        ],
        nutrients: { carbs: 71, protein: 34, fat: 23, fiber: 11, sugar: 6, sodium: 990, cholesterol: 80, saturatedFat: 8 }
    },
    {
        slug: 'restaurant-sandwich',
        name: 'Restaurant sandwich',
        weight: 1,
        amounts: [
            { label: '1 sandwich', factor: 1 },
            { label: '1 sandwich + side', factor: 1.1 },
            { label: '1 half sandwich + soup', factor: 0.9 }
        ],
        nutrients: { carbs: 59, protein: 32, fat: 21, fiber: 4, sugar: 7, sodium: 1100, cholesterol: 85, saturatedFat: 7 }
    },
    {
        slug: 'restaurant-fried-rice',
        name: 'Restaurant fried rice',
        weight: 1,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 large plate', factor: 1.12 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        nutrients: { carbs: 83, protein: 29, fat: 24, fiber: 5, sugar: 6, sodium: 1160, cholesterol: 95, saturatedFat: 6 }
    },
    {
        slug: 'restaurant-burger',
        name: 'Restaurant burger',
        weight: 1,
        amounts: [
            { label: '1 burger', factor: 1 },
            { label: '1 burger + fries', factor: 1.16 },
            { label: '1 burger + salad', factor: 0.94 }
        ],
        nutrients: { carbs: 52, protein: 31, fat: 31, fiber: 4, sugar: 8, sodium: 1240, cholesterol: 105, saturatedFat: 12 }
    },
    {
        slug: 'restaurant-salad',
        name: 'Restaurant salad with grilled chicken',
        weight: 1,
        amounts: [
            { label: '1 salad bowl', factor: 1 },
            { label: '1 large salad bowl', factor: 1.08 },
            { label: '1 salad bowl + bread', factor: 1.05 }
        ],
        nutrients: { carbs: 29, protein: 34, fat: 19, fiber: 7, sugar: 6, sodium: 760, cholesterol: 95, saturatedFat: 4 }
    },
    {
        slug: 'restaurant-grilled-chicken',
        name: 'Restaurant grilled chicken meal',
        weight: 1,
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + side veggies', factor: 1.08 },
            { label: '3/4 plate', factor: 0.92 }
        ],
        nutrients: { carbs: 36, protein: 42, fat: 17, fiber: 6, sugar: 8, sodium: 820, cholesterol: 110, saturatedFat: 4 }
    }
];

const cafeteriaMains = [
    {
        slug: 'mexican-bowl',
        name: 'Mexican bowl',
        weight: 2,
        amount: { label: '1 bowl', factor: 1 },
        nutrients: { carbs: 66, protein: 23, fat: 17, fiber: 12, sugar: 5, sodium: 740, cholesterol: 25, saturatedFat: 4 }
    },
    {
        slug: 'bean-burger',
        name: 'Bean burger',
        weight: 1,
        amount: { label: '1 burger', factor: 1 },
        nutrients: { carbs: 53, protein: 20, fat: 17, fiber: 10, sugar: 7, sodium: 880, cholesterol: 10, saturatedFat: 4.5 }
    }
];

const cafeteriaSides = [
    {
        slug: 'fries',
        name: 'fries',
        nutrients: { carbs: 31, protein: 3, fat: 14, fiber: 3, sugar: 1, sodium: 250, cholesterol: 0, saturatedFat: 2 }
    },
    {
        slug: 'salad',
        name: 'salad',
        nutrients: { carbs: 8, protein: 2, fat: 4, fiber: 2, sugar: 4, sodium: 130, cholesterol: 0, saturatedFat: 0.5 }
    },
    {
        slug: 'fruit',
        name: 'fruit',
        nutrients: { carbs: 17, protein: 1, fat: 0, fiber: 3, sugar: 13, sodium: 5, cholesterol: 0, saturatedFat: 0 }
    }
];

const nutsSnack = {
    slug: 'daily-nuts-snack',
    name: 'Daily nuts mix',
    amounts: [
        { label: '8 walnuts, 5 almonds, 6 cashews', factor: 1 },
        { label: '8 walnuts, 5 almonds, 6 cashews', factor: 0.98 },
        { label: '8 walnuts, 5 almonds, 6 cashews', factor: 1.03 }
    ],
    nutrients: { carbs: 6.5, protein: 5.3, fat: 17.7, fiber: 2.6, sugar: 1.4, sodium: 4, cholesterol: 0, saturatedFat: 2.9 }
};

const CLI_HELP = `
Usage:
  npm run seed:meal-logs -- [--email you@example.com | --user-id <mongoId>] [--replace] [--dry-run] [--list-users]

Examples:
  npm run seed:meal-logs -- --email you@example.com --replace
  npm run seed:meal-logs -- --dry-run
  npm run seed:meal-logs -- --list-users
`;

const roundTo = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (input) => {
    let hash = 1779033703;
    for (let index = 0; index < input.length; index += 1) {
        hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
    }
    return hash >>> 0;
};

const createRng = (seedValue) => {
    let seed = seedValue >>> 0;
    return () => {
        seed += 0x6d2b79f5;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const randomBetween = (rng, min, max) => min + (max - min) * rng();

const shuffle = (items, rng) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
};

const pickWeighted = (items, rng, previousSlug = null) => {
    const pool = items.filter((item) => item.slug !== previousSlug);
    const source = pool.length > 0 ? pool : items;
    const totalWeight = source.reduce((sum, item) => sum + (item.weight || 1), 0);
    let cursor = rng() * totalWeight;

    for (const item of source) {
        cursor -= item.weight || 1;
        if (cursor <= 0) {
            return item;
        }
    }

    return source[source.length - 1];
};

const sumNutrients = (...sets) =>
    sets.reduce(
        (acc, current) => ({
            carbs: acc.carbs + current.carbs,
            protein: acc.protein + current.protein,
            fat: acc.fat + current.fat,
            fiber: acc.fiber + (current.fiber || 0),
            sugar: acc.sugar + (current.sugar || 0),
            sodium: acc.sodium + (current.sodium || 0),
            cholesterol: acc.cholesterol + (current.cholesterol || 0),
            saturatedFat: acc.saturatedFat + (current.saturatedFat || 0)
        }),
        { carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, saturatedFat: 0 }
    );

const buildCafeteriaOptions = () => {
    const options = [];

    for (let mainIndex = 0; mainIndex < cafeteriaMains.length; mainIndex += 1) {
        for (let firstSideIndex = 0; firstSideIndex < cafeteriaSides.length; firstSideIndex += 1) {
            for (let secondSideIndex = firstSideIndex + 1; secondSideIndex < cafeteriaSides.length; secondSideIndex += 1) {
                const main = cafeteriaMains[mainIndex];
                const sideOne = cafeteriaSides[firstSideIndex];
                const sideTwo = cafeteriaSides[secondSideIndex];

                options.push({
                    slug: `cafeteria-${main.slug}-${sideOne.slug}-${sideTwo.slug}`,
                    name: `Cafeteria ${main.name} with ${sideOne.name} and ${sideTwo.name}`,
                    weight: main.weight || 1,
                    amounts: [
                        { label: `${main.amount.label} + ${sideOne.name} + ${sideTwo.name}`, factor: 1 },
                        { label: `${main.amount.label} + 2 sides`, factor: 0.96 },
                        { label: `${main.amount.label} + generous sides`, factor: 1.08 }
                    ],
                    nutrients: sumNutrients(main.nutrients, sideOne.nutrients, sideTwo.nutrients)
                });
            }
        }
    }

    return options;
};

const cafeteriaOptions = buildCafeteriaOptions();

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const atStartOfDay = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};

const atEndOfDay = (date) => {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
};

const listDatesInRange = (startDate, endDate) => {
    const dates = [];
    const cursor = atStartOfDay(startDate);
    const end = atStartOfDay(endDate);

    while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
};

const getWeekKey = (date) => {
    const value = atStartOfDay(date);
    const day = value.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diffToMonday);
    return toDateKey(value);
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const buildCafeteriaSchedule = (days, rng) => {
    const daysByWeek = new Map();

    for (const day of days) {
        const weekday = day.getDay();
        if (weekday === 0 || weekday === 6) {
            continue;
        }

        const key = getWeekKey(day);
        const group = daysByWeek.get(key) || [];
        group.push(day);
        daysByWeek.set(key, group);
    }

    const scheduled = new Set();

    for (const group of daysByWeek.values()) {
        const available = shuffle(group, rng);
        const target = clamp(Math.round((available.length * 3) / 5), 1, Math.min(3, available.length));

        for (let index = 0; index < target; index += 1) {
            scheduled.add(toDateKey(available[index]));
        }
    }

    return scheduled;
};

const buildRestaurantSchedule = (days, excludedDays, rng) => {
    const daysByMonth = new Map();

    for (const day of days) {
        const key = getMonthKey(day);
        const group = daysByMonth.get(key) || [];
        group.push(day);
        daysByMonth.set(key, group);
    }

    const scheduled = new Set();

    for (const group of daysByMonth.values()) {
        const [{ year, monthIndex }] = group.map((date) => ({
            year: date.getFullYear(),
            monthIndex: date.getMonth()
        }));
        const monthlyTarget = clamp(
            Math.round((group.length / daysInMonth(year, monthIndex)) * 5),
            1,
            Math.max(1, group.length)
        );

        let candidates = group.filter((day) => !excludedDays.has(toDateKey(day)));
        if (candidates.length < monthlyTarget) {
            candidates = [...group];
        }

        const shuffled = shuffle(candidates, rng);
        const picks = [];

        for (const candidate of shuffled) {
            const candidateTime = atStartOfDay(candidate).getTime();
            const adjacent = picks.some((picked) => Math.abs(atStartOfDay(picked).getTime() - candidateTime) <= 86400000);
            if (!adjacent) {
                picks.push(candidate);
            }
            if (picks.length === monthlyTarget) {
                break;
            }
        }

        if (picks.length < monthlyTarget) {
            for (const candidate of shuffled) {
                if (!picks.some((picked) => toDateKey(picked) === toDateKey(candidate))) {
                    picks.push(candidate);
                }
                if (picks.length === monthlyTarget) {
                    break;
                }
            }
        }

        picks.forEach((day) => scheduled.add(toDateKey(day)));
    }

    return scheduled;
};

const scaleNutrients = (base, factor) => ({
    carbs: roundTo(base.carbs * factor),
    protein: roundTo(base.protein * factor),
    fat: roundTo(base.fat * factor),
    fiber: roundTo((base.fiber || 0) * factor),
    sugar: roundTo((base.sugar || 0) * factor),
    sodium: Math.round((base.sodium || 0) * factor),
    cholesterol: Math.round((base.cholesterol || 0) * factor),
    saturatedFat: roundTo((base.saturatedFat || 0) * factor)
});

const calculateCalories = (nutrients) =>
    Math.round((nutrients.carbs * 4) + (nutrients.protein * 4) + (nutrients.fat * 9));

const buildMealDate = (date, mealType, rng) => {
    const window = MEAL_WINDOWS[mealType];
    const mealDate = new Date(date);
    const hour = Math.floor(randomBetween(rng, window.startHour, window.endHour));
    const minute = Math.floor(rng() * 12) * 5;
    mealDate.setHours(hour, minute, 0, 0);
    return mealDate;
};

const instantiateMeal = (template, mealType, baseDate, rng, userId) => {
    const amountOption = template.amounts[Math.floor(rng() * template.amounts.length)];
    const factor = amountOption.factor * randomBetween(rng, 0.97, 1.05);
    const macros = scaleNutrients(template.nutrients, factor);
    const date = buildMealDate(baseDate, mealType, rng);

    return {
        userId,
        name: template.name,
        food: template.name,
        amount: amountOption.label,
        mealType,
        calories: calculateCalories(macros),
        imageUrl: '',
        macros,
        date,
        createdAt: date
    };
};

const generateMealsForRange = ({ startDate, endDate, seedKey, userId = new mongoose.Types.ObjectId() }) => {
    const dates = listDatesInRange(startDate, endDate);
    const rng = createRng(hashString(`${seedKey}:${startDate.getFullYear()}:${dates.length}`));
    const cafeteriaDays = buildCafeteriaSchedule(dates, rng);
    const restaurantDays = buildRestaurantSchedule(dates, cafeteriaDays, rng);
    const meals = [];
    const previousSlugs = { breakfast: null, lunch: null, dinner: null };

    for (const date of dates) {
        const dateKey = toDateKey(date);

        const breakfastTemplate = pickWeighted(breakfastTemplates, rng, previousSlugs.breakfast);
        const lunchTemplate = cafeteriaDays.has(dateKey)
            ? pickWeighted(cafeteriaOptions, rng, previousSlugs.lunch)
            : pickWeighted(lunchTemplates, rng, previousSlugs.lunch);
        const dinnerTemplate = restaurantDays.has(dateKey)
            ? pickWeighted(restaurantTemplates, rng, previousSlugs.dinner)
            : pickWeighted(dinnerTemplates, rng, previousSlugs.dinner);

        meals.push(instantiateMeal(breakfastTemplate, 'breakfast', date, rng, userId));
        meals.push(instantiateMeal(lunchTemplate, 'lunch', date, rng, userId));
        meals.push(instantiateMeal(nutsSnack, 'snack', date, rng, userId));
        meals.push(instantiateMeal(dinnerTemplate, 'dinner', date, rng, userId));

        previousSlugs.breakfast = breakfastTemplate.slug;
        previousSlugs.lunch = lunchTemplate.slug;
        previousSlugs.dinner = dinnerTemplate.slug;
    }

    return {
        meals,
        stats: {
            days: dates.length,
            cafeteriaLunches: cafeteriaDays.size,
            restaurantMeals: restaurantDays.size,
            startDate: toDateKey(startDate),
            endDate: toDateKey(endDate)
        }
    };
};

const parseArgs = (argv) => {
    const args = {
        email: '',
        userId: '',
        dryRun: false,
        replace: false,
        listUsers: false,
        help: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];

        if (value === '--email') {
            args.email = argv[index + 1] || '';
            index += 1;
        } else if (value === '--user-id') {
            args.userId = argv[index + 1] || '';
            index += 1;
        } else if (value === '--replace') {
            args.replace = true;
        } else if (value === '--dry-run') {
            args.dryRun = true;
        } else if (value === '--list-users') {
            args.listUsers = true;
        } else if (value === '--help' || value === '-h') {
            args.help = true;
        }
    }

    return args;
};

const resolveUser = async ({ email, userId }) => {
    if (userId) {
        return User.findById(userId);
    }

    if (email) {
        return User.findOne({ email: email.toLowerCase() });
    }

    const users = await User.find({}).sort({ createdAt: 1 }).limit(2);
    if (users.length === 1) {
        return users[0];
    }

    if (users.length === 0) {
        throw new Error('No users found in the database. Create an account first or pass --email/--user-id.');
    }

    throw new Error('Multiple users found. Pass --email or --user-id to choose which account to seed.');
};

const logPreview = ({ meals, stats }) => {
    console.log(`Generated ${meals.length} meals across ${stats.days} days (${stats.startDate} to ${stats.endDate}).`);
    console.log(`Cafeteria lunches: ${stats.cafeteriaLunches}. Restaurant meals: ${stats.restaurantMeals}.`);
    console.log('Preview:');
    meals.slice(0, 8).forEach((meal) => {
        console.log(
            `${toDateKey(meal.date)} ${meal.mealType.padEnd(10)} ${meal.name} | ${meal.calories} kcal | ` +
            `${meal.macros.protein}P ${meal.macros.carbs}C ${meal.macros.fat}F`
        );
    });
};

const main = async () => {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        console.log(CLI_HELP.trim());
        return;
    }

    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    const endDate = atStartOfDay(today);

    if (args.dryRun) {
        const preview = generateMealsForRange({
            startDate,
            endDate,
            seedKey: args.email || args.userId || 'healthycal-preview'
        });
        logPreview(preview);
        return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthycal';
    await mongoose.connect(mongoUri);

    try {
        if (args.listUsers) {
            const users = await User.find({}).sort({ email: 1 }).select('email username createdAt');
            if (users.length === 0) {
                console.log('No users found in the database.');
                return;
            }

            console.log('Available users:');
            users.forEach((user) => {
                console.log(`- ${user.email} (${user.username})`);
            });
            return;
        }

        const user = await resolveUser(args);
        if (!user) {
            throw new Error('Target user not found.');
        }

        const rangeQuery = {
            userId: user._id,
            date: {
                $gte: atStartOfDay(startDate),
                $lte: atEndOfDay(endDate)
            }
        };

        const existingCount = await Meal.countDocuments(rangeQuery);
        if (existingCount > 0 && !args.replace) {
            throw new Error(
                `Found ${existingCount} existing meals for ${user.email} in ${today.getFullYear()}. ` +
                'Re-run with --replace to refresh this date range.'
            );
        }

        if (args.replace) {
            await Meal.deleteMany(rangeQuery);
        }

        const { meals, stats } = generateMealsForRange({
            startDate,
            endDate,
            seedKey: `${user._id}:${user.email}`,
            userId: user._id
        });

        await Meal.insertMany(meals);

        console.log(`Seeded ${meals.length} meal logs for ${user.email}.`);
        console.log(`Date range: ${stats.startDate} to ${stats.endDate}.`);
        console.log(`Cafeteria lunches: ${stats.cafeteriaLunches}. Restaurant meals: ${stats.restaurantMeals}.`);
    } finally {
        await mongoose.disconnect();
    }
};

main().catch(async (error) => {
    console.error(`Meal log seed failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
});

export { generateMealsForRange };
