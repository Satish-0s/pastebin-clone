import dbConnect from '@/lib/mongoose';
import Paste from '@/lib/models/Paste';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Paste ${id}`,
    };
}

export default async function PastePage({ params }: Props) {
    const { id } = await params;

    await dbConnect();
    const paste = await Paste.findOne({ id });

    if (!paste) {
        notFound();
    }

    // Handle expiration check
    if (paste.expiresAt && Date.now() > paste.expiresAt) {
        // Lazy delete
        await Paste.deleteOne({ _id: paste._id });
        notFound();
    }

    // Handle view limits
    let currentViews = paste.remainingViews;

    if (typeof paste.remainingViews === 'number') {
        if (paste.remainingViews <= 0) {
            // Should be gone
            await Paste.deleteOne({ _id: paste._id });
            notFound();
            return null;
        }

        const newViews = paste.remainingViews - 1;

        if (newViews <= 0) {
            // Last view, burn it
            // We delete it so next request fails, but render this one
            await Paste.deleteOne({ _id: paste._id });
            currentViews = 0;
        } else {
            // Update the count
            paste.remainingViews = newViews;
            await paste.save();
            currentViews = newViews;
        }
    }

    // Convert mongoose doc properties
    const content = paste.content;
    const createdAt = paste.createdAt;
    const expiresAt = paste.expiresAt;

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div>
                    <span className="font-bold text-sm text-gray-500 uppercase tracking-wide">Paste ID</span>
                    <p className="font-mono text-xl">{id}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                    <p>Created: {new Date(createdAt).toLocaleString()}</p>
                    {expiresAt && (
                        <p>Expires: {new Date(expiresAt).toLocaleString()}</p>
                    )}
                    {typeof currentViews === 'number' && (
                        <p className="text-red-500 font-bold">
                            {currentViews} views remaining (including this one)
                        </p>
                    )}
                </div>
            </div>

            <div className="relative">
                <pre className="w-full p-6 border rounded-lg bg-background overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {content}
                </pre>
            </div>

            <div className="mt-8 text-center">
                <a
                    href="/"
                    className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded transition-colors"
                >
                    Create New Paste
                </a>
            </div>
        </main>
    );
}
