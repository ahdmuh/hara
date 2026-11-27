import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

export type Role = Doc<"users">["role"];

export async function currentUser(ctx: QueryCtx): Promise<Doc<"users"> | null>
{
    const authID = await getAuthUserId(ctx);
    const id = authID ? ctx.db.normalizeId("users", authID) : null;
    return id ? await ctx.db.get(id) : null;
}

export async function userWithRole(ctx: QueryCtx, role: Role): Promise<Doc<"users"> | null>
{
    const user = await currentUser(ctx);
    return user && user.role === role && !user.passwordChangeRequired ? user : null;
}

export async function requireRole(ctx: QueryCtx, role: Role): Promise<Doc<"users">>
{
    const user = await userWithRole(ctx, role);
    if (!user)
    {
        throw new ConvexError("FORBIDDEN");
    }
    return user;
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!#%+=?";

function pick(characters: string, random: number): string
{
    return characters[random % characters.length] ?? "x";
}

export function temporaryPassword(): string
{
    const random = crypto.getRandomValues(new Uint32Array(16));
    const all = UPPER + LOWER + DIGITS;
    const body = Array.from(random.slice(0, 12), value => pick(all, value));
    const required = [pick(UPPER, random[12] ?? 0), pick(LOWER, random[13] ?? 0), pick(DIGITS, random[14] ?? 0), pick(SYMBOLS, random[15] ?? 0)];
    const characters = [...body, ...required];
    return `${characters.slice(0, 4).join("")}-${characters.slice(4, 8).join("")}-${characters.slice(8, 12).join("")}-${characters.slice(12).join("")}`;
}
