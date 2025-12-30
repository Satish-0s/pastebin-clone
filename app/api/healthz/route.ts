import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Verify that the persistence layer is reachable
        await dbConnect();

        // Check connection state: 1 = connected
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        return NextResponse.json(
            { ok: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            { ok: false, error: 'Database connection failed' },
            { status: 503 }
        );
    }
}
