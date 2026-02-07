import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    image?: string;
    role: 'admin' | 'manager' | 'user';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        image: { type: String },
        role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to hash password
UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err: any) {
        throw err;
    }
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
