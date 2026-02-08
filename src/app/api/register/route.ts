import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/backend/models/User';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { name, email, password, role } = await request.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
