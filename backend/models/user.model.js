import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'developer'],
        default: 'admin'
    }
}, { timestamps: true });

// Modernized pre-save hook: Removed 'next' callback, relying purely on async/await Promises
userSchema.pre('save', async function() {
    // If the password hasn't been changed, exit the function and continue saving
    if (!this.isModified('password')) return;
    
    // Otherwise, hash the new password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

export default mongoose.model('User', userSchema);