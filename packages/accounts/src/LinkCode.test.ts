import { describe, expect, test } from "bun:test";
import { formatLinkCode, generateLinkCode, LINK_CODE_ALPHABET, LINK_CODE_LENGTH, normalizeLinkCode } from "./LinkCode";

describe("LinkCode", () =>
{
    test("generates codes from the unambiguous alphabet", () =>
    {
        for (let round = 0; round < 200; round++)
        {
            const code = generateLinkCode();
            expect(code).toHaveLength(LINK_CODE_LENGTH);
            expect([...code].every(character => LINK_CODE_ALPHABET.includes(character))).toBe(true);
        }
    });

    test("skips biased random values instead of wrapping them", () =>
    {
        const values = [255, 250, 248, 0, 1, 2, 3, 4, 5, 6, 7];
        const code = generateLinkCode(count => Uint8Array.from({ length: count }, (_, index) => values[index] ?? 0));
        expect(code).toBe("23456789");
    });

    test("accepts codes typed with dashes, spaces or lower case", () =>
    {
        expect(normalizeLinkCode("hk7p-m2qx")).toBe("HK7PM2QX");
        expect(normalizeLinkCode(" HK7P M2QX ")).toBe("HK7PM2QX");
    });

    test("rejects ambiguous characters and wrong lengths", () =>
    {
        expect(normalizeLinkCode("HK7P-M2Q0")).toBeNull();
        expect(normalizeLinkCode("HK7P-M2QI")).toBeNull();
        expect(normalizeLinkCode("HK7P")).toBeNull();
    });

    test("formats codes in two groups", () =>
    {
        expect(formatLinkCode("HK7PM2QX")).toBe("HK7P-M2QX");
    });
});
