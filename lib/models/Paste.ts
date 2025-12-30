import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaste extends Document {
    id: string;
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
    expiresAt: { type: Number }, // Independent logic
    expireDate: { type: Date }, // For MongoDB TTL
    remainingViews: { type: Number },
});

// Create a TTL index on expireDate
// MongoDB will automatically remove documents where expireDate < now
PasteSchema.index({ expireDate: 1 }, { expireAfterSeconds: 0 });

const Paste: Model<IPaste> = mongoose.models.Paste || mongoose.model<IPaste>('Paste', PasteSchema);

export default Paste;
