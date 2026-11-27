import { describe, expect, test } from "bun:test";
import { correctPath } from "./Routes";

describe("correctPath", () =>
{
    test("sends unknown portal paths to sign in, which forwards signed-in users home", () =>
    {
        expect(correctPath("/nonsense", "portal.projecthara.ca")).toEqual({ kind: "replace", path: "/login" });
        expect(correctPath("/", "portal.projecthara.ca")).toEqual({ kind: "replace", path: "/login" });
        expect(correctPath("/patients/../admin", "portal.projecthara.ca")).toEqual({ kind: "replace", path: "/login" });
        expect(correctPath("/patients/k57abc", "portal.projecthara.ca")).toEqual({ kind: "stay" });
    });

    test("sends unknown site paths home and portal paths to the portal", () =>
    {
        expect(correctPath("/nonsense", "projecthara.ca")).toEqual({ kind: "replace", path: "/" });
        expect(correctPath("/login", "www.projecthara.ca")).toEqual({ kind: "portal", path: "/login" });
        expect(correctPath("/", "projecthara.ca")).toEqual({ kind: "stay" });
    });

    test("serves both the site and the portal on a development host", () =>
    {
        expect(correctPath("/patients", "localhost")).toEqual({ kind: "stay" });
        expect(correctPath("/nonsense", "localhost")).toEqual({ kind: "replace", path: "/" });
    });
});
