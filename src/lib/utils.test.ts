import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveToLocalStorage, loadFromLocalStorage } from "./utils";

describe("localStorage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and loads a string", () => {
    saveToLocalStorage("testString", "hello world");
    expect(loadFromLocalStorage<string>("testString")).toBe("hello world");
  });

  it("saves and loads a number", () => {
    saveToLocalStorage("testNumber", 123);
    expect(loadFromLocalStorage<number>("testNumber")).toBe(123);
  });

  it("saves and loads a boolean", () => {
    saveToLocalStorage("testBoolean", true);
    expect(loadFromLocalStorage<boolean>("testBoolean")).toBe(true);
  });

  it("saves and loads an object", () => {
    const value = { name: "Jules", type: "agent" };
    saveToLocalStorage("testObject", value);
    expect(loadFromLocalStorage<typeof value>("testObject")).toEqual(value);
  });

  it("returns null for a key that was never written", () => {
    expect(loadFromLocalStorage<string>("nonExistentKey")).toBeNull();
  });

  it("returns null and logs when the stored value is malformed JSON", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("malformedJson", "{ not: json }");

    expect(loadFromLocalStorage<unknown>("malformedJson")).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });

  it("logs and does not throw when saving fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveToLocalStorage("key", "value")).not.toThrow();
    expect(consoleError).toHaveBeenCalled();

    setItem.mockRestore();
  });
});
