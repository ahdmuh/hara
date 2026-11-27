import { describe, expect, test } from "bun:test";
import { filterName, nameError } from "./Names";

describe("Names", () =>
{
    test("drops symbols and digits while typing", () =>
    {
        expect(filterName("Av*ery  Mor9gan!")).toBe("Avery Morgan");
        expect(filterName("  -Jean--Luc")).toBe("Jean-Luc");
    });

    test("needs a first and last name", () =>
    {
        expect(nameError("Avery")).not.toBeNull();
        expect(nameError("Avery Morgan")).toBeNull();
    });

    test("accepts middle names, particles, hyphens, apostrophes and accents", () =>
    {
        expect(nameError("Mary Ann de la Cruz")).toBeNull();
        expect(nameError("Jean-Luc O'Brien")).toBeNull();
        expect(nameError("Zoë Saint-Étienne")).toBeNull();
        expect(nameError("Martin Luther King Jr.")).toBeNull();
    });

    test("rejects parts that start or end with joining marks", () =>
    {
        expect(nameError("Avery Morgan-")).not.toBeNull();
        expect(nameError("Avery 'Morgan")).not.toBeNull();
        expect(nameError("Avery . Morgan")).not.toBeNull();
    });
});
