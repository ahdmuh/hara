import { describe, expect, test } from "bun:test";
import { failedRules } from "./Password";

const EMAIL = "jordan.lee@clinic.ca";

describe("failedRules", () =>
{
    test("accepts a long password with mixed case, a number and a symbol", () =>
    {
        expect(failedRules("Copper-Kettle-42", EMAIL)).toEqual([]);
    });

    test.each([
        ["too short", "Ab1!short", "length"],
        ["no uppercase", "copper-kettle-42", "case"],
        ["no number", "Copper-Kettle-Hill", "number"],
        ["no symbol", "CopperKettle4242", "symbol"],
        ["the email name", "Jordan.Lee-2026!", "personal"],
        ["a common word", "MyPassword-2026!", "personal"],
    ])("rejects %s", (_, password, rule) =>
    {
        expect(failedRules(password, EMAIL).map(entry => entry.id)).toEqual([rule]);
    });
});
