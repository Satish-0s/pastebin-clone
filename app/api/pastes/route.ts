import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Paste from '@/lib/models/Paste';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface CreatePasteRequest {
    content: string;
    ttl_seconds?: number;
    max_views?: number;
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        let body: CreatePasteRequest;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required and must be non-empty' }, { status: 400 });
        }

        if (body.ttl_seconds !== undefined && (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1)) {
            return NextResponse.json({ error: 'ttl_seconds must be an integer >= 1' }, { status: 400 });
        }

        if (body.max_views !== undefined && (!Number.isInteger(body.max_views) || body.max_views < 1)) {
            return NextResponse.json({ error: 'max_views must be an integer >= 1' }, { status: 400 });
        }

        const id = generateId();
        const now = Date.now();
        let expiresAt: number | undefined = undefined;
        let expireDate: Date | undefined = undefined;

        if (body.ttl_seconds) {
            expiresAt = now + (body.ttl_seconds * 1000);
            expireDate = new Date(expiresAt);
        }

        await Paste.create({
            id,
            content: body.content,
            createdAt: now,
            expiresAt,
            expireDate,
            remainingViews: body.max_views ?? undefined,
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        return NextResponse.json({
            id,
            url: `${baseUrl}/p/${id}`
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating paste:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
