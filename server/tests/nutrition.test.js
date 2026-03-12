import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const mockFetch = jest.fn();
const originalFetch = global.fetch;

const makeFood = ({
    fdcId,
    description,
    dataType,
    householdServingFullText,
    servingSize,
    servingSizeUnit,
    nutrients
}) => ({
    fdcId,
    description,
    dataType,
    householdServingFullText,
    servingSize,
    servingSizeUnit,
    foodNutrients: nutrients.map(([nutrientNumber, value]) => ({ nutrientNumber, value }))
});

beforeEach(() => {
    process.env.USDA_API_KEY = 'test-key';
    global.fetch = mockFetch;
});

afterEach(() => {
    jest.clearAllMocks();

    if (originalFetch) {
        global.fetch = originalFetch;
    } else {
        delete global.fetch;
    }

    delete process.env.USDA_API_KEY;
});

const { default: app } = await import('../app.js');
const { default: request } = await import('supertest');

describe('Nutrition Routes', () => {
    test('GET /api/nutrition/search requires a query', async () => {
        const res = await request(app).get('/api/nutrition/search');

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Please provide a search query with ?q=');
    });

    test('GET /api/nutrition/search maps USDA results and prioritizes generic foods', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                foods: [
                    makeFood({
                        fdcId: 1001,
                        description: 'BANANA',
                        dataType: 'Branded',
                        servingSize: 32,
                        servingSizeUnit: 'g',
                        nutrients: [
                            ['208', 312],
                            ['205', 40.6],
                            ['203', 12.5],
                            ['204', 6.25]
                        ]
                    }),
                    makeFood({
                        fdcId: 1002,
                        description: 'BANANAS, RAW',
                        dataType: 'SR Legacy',
                        householdServingFullText: '1 medium',
                        nutrients: [
                            ['208', 105],
                            ['205', 27],
                            ['203', 1.3],
                            ['204', 0.4],
                            ['291', 3.1],
                            ['269', 14.4],
                            ['307', 1],
                            ['601', 0],
                            ['606', 0.1]
                        ]
                    })
                ]
            })
        });

        const res = await request(app).get('/api/nutrition/search?q=banana');

        expect(res.statusCode).toBe(200);
        expect(res.body.query).toBe('banana');
        expect(res.body.results[0]).toEqual({
            id: '1002',
            name: 'Bananas, Raw',
            serving: '1 medium',
            calories: 105,
            macros: {
                carbs: 27,
                protein: 1.3,
                fat: 0.4,
                fiber: 3.1,
                sugar: 14.4,
                sodium: 1,
                cholesterol: 0,
                saturatedFat: 0.1
            }
        });

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('query=banana');
        expect(url).toContain('api_key=test-key');
        expect(options).toEqual({
            headers: {
                'X-Api-Key': 'test-key'
            }
        });
    });
});
