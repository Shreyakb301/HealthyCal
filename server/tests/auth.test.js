import { jest, describe, test, expect, afterEach } from '@jest/globals';

// Create spies
const mockSave = jest.fn();
const mockComparePassword = jest.fn();
const mockFindOne = jest.fn();

// Define MockUser class
class MockUser {
    constructor(data) {
        Object.assign(this, data);
        this.save = mockSave;
        this.comparePassword = mockComparePassword;
        this._id = 'mock-id'; // Default ID
    }
    static findOne = mockFindOne;
}

// Mock modules
jest.unstable_mockModule('../models/User.js', () => ({
    default: MockUser
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn().mockReturnValue('fake-jwt-token')
    }
}));

// Import app and dependencies
const { default: app } = await import('../app.js');
const { default: request } = await import('supertest');
const { default: jwt } = await import('jsonwebtoken');

describe('Auth Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
        // Reset spies that are reused
        mockSave.mockReset();
        mockComparePassword.mockReset();
        mockFindOne.mockReset();
    });

    test('POST /api/auth/register creates a new user', async () => {
        mockFindOne.mockResolvedValue(null); // No existing user
        mockSave.mockResolvedValue(true); // Save success

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
        expect(mockFindOne).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
    });

    test('POST /api/auth/register rejects duplicate user', async () => {
        mockFindOne.mockResolvedValue({ _id: 'existing-id' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('User already exists with this email or username');
        expect(mockSave).not.toHaveBeenCalled();
    });

    test('POST /api/auth/login returns token on valid credentials', async () => {
        // Mock user instance found
        const mockUserInstance = new MockUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashed-password'
        });

        mockFindOne.mockResolvedValue(mockUserInstance);
        mockComparePassword.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.token).toBe('fake-jwt-token');
        expect(jwt.sign).toHaveBeenCalled();
    });
});