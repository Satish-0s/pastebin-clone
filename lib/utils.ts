import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { customAlphabet } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Create a custom alphabet for shorter, URL-friendly IDs
// removing ambiguous characters like l, 1, I, O, 0 if desired, but base58 is usually fine.
// Let's stick to alphanumeric for simplicity.
export const generateId = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    7
);
