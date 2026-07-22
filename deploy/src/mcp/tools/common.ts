import "server-only";
import { z } from "zod";

/**
 * Tool results travel as text. JSON is the densest readable encoding for structured data and models
 * parse it reliably, so every tool returns one pretty-printed object rather than prose.
 */
export function json(value: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function text(value: string) {
    return { content: [{ type: "text" as const, text: value }] };
}

/** A miss is a normal answer, not a protocol failure — say so in a way the model can act on. */
export function notFound(message: string) {
    return { content: [{ type: "text" as const, text: message }], isError: true };
}

/**
 * Passed straight through to the app, which falls back to English for anything it does not
 * recognise — so there is no locale list to keep in sync here.
 */
export const LOCALE_ARG = z
    .string()
    .optional()
    .describe("Two-letter language code (en, fr, es, pt, it, de, nl, pl, th, hi, ko, ja). Defaults to English.");
