import mongoose from 'mongoose';

const macroSchema = new mongoose.Schema({
    carbs: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 }
}, { _id: false });

const mealSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Legacy field used by the existing meal log UI
    food: {
        type: String,
        trim: true
    },
    // Preferred field for dashboard responses
    name: {
        type: String,
        trim: true
    },
    amount: {
        type: String,
        trim: true,
        default: ''
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        default: 'snack'
    },
    calories: {
        type: Number,
        required: true,
        min: 0
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''
    },
    macros: {
        type: macroSchema,
        default: () => ({})
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

mealSchema.pre('validate', function(next) {
    // Keep both legacy and new naming fields in sync for backward compatibility.
    if (!this.name && this.food) {
        this.name = this.food;
    }

    if (!this.food && this.name) {
        this.food = this.name;
    }

    if (!this.food && !this.name) {
        this.invalidate('name', 'Meal name is required');
    }

    next();
});

// Indexes for efficient meal lookups and daily summaries
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ userId: 1, date: -1, mealType: 1 });

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;
