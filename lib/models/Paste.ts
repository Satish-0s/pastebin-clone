import mongoose, { Schema, Model } from 'mongoose';

export interface IPaste {
    id: string; // The URL-friendly ID
    content: string;
    createdAt: number;
    expiresAt?: number;
    expireDate?: Date;
    remainingViews?: number;
}

const PasteSchema = new Schema<IPaste>({
    id: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    createdAt: { type: Number, required: true },
    expiresAt: { type: Number },
    remainingViews: { type: Number },
});

// Index for automatic expiration (TTL)
// MongoDB TTL indexes work on Date objects usually, but we are using numeric timestamps.
// However, since we store logic expiry in code, we can also use a real Date field for Mongo TTL if we wanted.
// For now, to keep logic consistent with the previous Redis implementation, we will query based on timestamp.
// BUT, to let Mongo auto-delete, let's add a proper Date field index.
PasteSchema.add({ expireDate: { type: Date } });

const Paste: Model<IPaste> = mongoose.models.Paste || mongoose.model<IPaste>('Paste', PasteSchema);

export default Paste;
