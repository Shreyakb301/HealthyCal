import { describe, expect, test } from '@jest/globals';

const {
    assertUniqueMealIdentities,
    createMealIdentity,
    getWeekdayKey,
    normalizeMealEntry,
    selectMealsForDate
} = await import('../../scripts/lib/mealLogAutomation.js');

describe('meal log automation helpers', () => {
    test('selectMealsForDate prefers exact date over weekday and default', () => {
        const config = {
            days: {
                default: [{ name: 'Default meal', calories: 100 }],
                sunday: [{ name: 'Sunday meal', calories: 200 }]
            },
            dates: {
                '2026-03-15': [{ name: 'Exact date meal', calories: 300 }]
            }
        };

        expect(getWeekdayKey('2026-03-15', 'America/Indiana/Indianapolis')).toBe('sunday');
        expect(selectMealsForDate(config, '2026-03-15', 'America/Indiana/Indianapolis')).toEqual([
            { name: 'Exact date meal', calories: 300 }
        ]);
    });

    test('normalizeMealEntry fills defaults and converts zoned time to UTC', () => {
        const meal = normalizeMealEntry(
            {
                mealType: 'breakfast',
                name: 'Protein oats',
                amount: '1 bowl',
                calories: 425,
                macros: {
                    protein: 30
                }
            },
            0,
            '2026-03-15',
            'America/Indiana/Indianapolis'
        );

        expect(meal).toEqual({
            name: 'Protein oats',
            food: 'Protein oats',
            amount: '1 bowl',
            mealType: 'breakfast',
            calories: 425,
            imageUrl: '',
            date: '2026-03-15T12:00:00.000Z',
            macros: {
                carbs: 0,
                protein: 30,
                fat: 0,
                fiber: 0,
                sugar: 0,
                sodium: 0,
                cholesterol: 0,
                saturatedFat: 0
            },
            scheduledTime: '08:00'
        });
    });

    test('createMealIdentity normalizes case, whitespace, and zoned time', () => {
        const desiredMeal = {
            mealType: 'lunch',
            name: '  Chicken   Rice Bowl ',
            amount: ' 1 bowl ',
            scheduledTime: '12:30'
        };
        const existingMeal = {
            mealType: 'lunch',
            name: 'chicken rice bowl',
            amount: '1 bowl',
            date: '2026-03-15T16:30:00.000Z'
        };

        expect(createMealIdentity(desiredMeal, 'America/Indiana/Indianapolis')).toBe(
            createMealIdentity(existingMeal, 'America/Indiana/Indianapolis')
        );
    });

    test('assertUniqueMealIdentities rejects duplicate scheduled meals', () => {
        expect(() =>
            assertUniqueMealIdentities(
                [
                    {
                        mealType: 'snack',
                        name: 'Yogurt',
                        amount: '1 cup',
                        scheduledTime: '15:30'
                    },
                    {
                        mealType: 'snack',
                        name: ' yogurt ',
                        amount: '1 cup',
                        scheduledTime: '15:30'
                    }
                ],
                'America/Indiana/Indianapolis'
            )
        ).toThrow('Duplicate meal entries detected');
    });
});
