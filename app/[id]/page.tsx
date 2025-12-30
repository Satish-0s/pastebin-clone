import { redis } from '@/lib/redis';
import { Paste } from '@/lib/types';
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
    const key = `paste:${id}`;

    const pasteData = await redis.get<Paste>(key);

    if (!pasteData) {
        notFound();
    }

    // Handle view limits
    let currentPaste = pasteData;

    if (typeof pasteData.remainingViews === 'number') {
        if (pasteData.remainingViews <= 0) {
            // Should have been deleted, but just in case
            await redis.del(key);
            notFound();
        }

        const newViews = pasteData.remainingViews - 1;

        if (newViews <= 0) {
            // Last view, delete it so it's gone for next request
            // We still show it this time.
            await redis.del(key);
        } else {
            // Update the count
            currentPaste = { ...pasteData, remainingViews: newViews };
            // Create a new object with updated views to save
            // Preserve TTL? Yes.
            await redis.set(key, JSON.stringify(currentPaste), { keepTtl: true });
        }
    }

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div>
                    <span className="font-bold text-sm text-gray-500 uppercase tracking-wide">Paste ID</span>
                    <p className="font-mono text-xl">{id}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                    <p>Created: {new Date(pasteData.createdAt).toLocaleString()}</p>
                    {pasteData.expiresAt && (
                        <p>Expires: {new Date(pasteData.expiresAt).toLocaleString()}</p>
                    )}
                    {typeof pasteData.remainingViews === 'number' && (
                        <p className="text-red-500 font-bold">
                            {pasteData.remainingViews} views remaining (including this one)
                        </p>
                    )}
                </div>
            </div>

            <div className="relative">
                <pre className="w-full p-6 border rounded-lg bg-background overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {pasteData.content}
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
