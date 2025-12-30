export interface Paste {
    id: string;
    content: string;
    createdAt: number;
    expiresAt: number | null; // Timestamp in ms or null
    remainingViews: number | null; // null for infinite
}

export type CreatePasteRequest = {
    content: string;
    expiresIn?: number; // seconds, relative
    viewLimit?: number; // absolute
};
