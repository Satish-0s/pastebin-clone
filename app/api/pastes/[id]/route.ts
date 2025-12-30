import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Paste from '@/lib/models/Paste';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    const { id } = await params;

    try {
        await dbConnect();

        // Find the paste
        const paste = await Paste.findOne({ id });

        if (!paste) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        // Time mocking for testing (only if TEST_MODE=1)
        const isTestMode = process.env.TEST_MODE === '1';
        const testNowHeader = req.headers.get('x-test-now-ms');

        const now = (isTestMode && testNowHeader)
            ? parseInt(testNowHeader, 10)
            : Date.now();

        // Check expiration
        if (paste.expiresAt && now > paste.expiresAt) {
            // Ideally delete it
            await Paste.deleteOne({ _id: paste._id });
            return NextResponse.json({ error: 'Not Found (Expired)' }, { status: 404 });
        }

        // View Counting Logic
        if (typeof paste.remainingViews === 'number') {
            if (paste.remainingViews <= 0) {
                await Paste.deleteOne({ _id: paste._id });
                return NextResponse.json({ error: 'Not Found' }, { status: 404 });
            }

            const newViews = paste.remainingViews - 1;

            if (newViews <= 0) {
                // Burn it - return content then delete
                // But we must return it first.
                const content = paste.content;
                const expires = paste.expiresAt;

                await Paste.deleteOne({ _id: paste._id });

                return NextResponse.json({
                    content: content,
                    remaining_views: 0,
                    expires_at: expires ? new Date(expires).toISOString() : null,
                });
            } else {
                // Decrement
                paste.remainingViews = newViews;
                await paste.save();
            }
        }

        return NextResponse.json({
            content: paste.content,
            remaining_views: paste.remainingViews,
            expires_at: paste.expiresAt ? new Date(paste.expiresAt).toISOString() : null,
        });

    } catch (error) {
        console.error('Error fetching paste:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
