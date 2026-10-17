import { describe, expect, it } from "vitest";
import { isBiomeTarget } from "./format-on-edit.mjs";

describe("isBiomeTarget", () => {
  it("Biome が扱う種類なら true", () => {
    expect(isBiomeTarget("C:\work\src\web\App.tsx")).toBe(true);
  });

  it("大文字の拡張子でも true", () => {
    expect(isBiomeTarget("/work/tools/a.MJS")).toBe(true);
  });

  it("Biome が扱わない種類なら false", () => {
    expect(isBiomeTarget("/work/README.md")).toBe(false);
  });

  it("拡張子がない、またはパスがないなら false", () => {
    expect(isBiomeTarget("/work/Dockerfile")).toBe(false);
    expect(isBiomeTarget(undefined)).toBe(false);
  });
});
