import { describe, expect, it } from "vitest";
import { z } from "zod";

import { extractJson, parseAndValidate, AiResponseValidationError } from "@/lib/ai/json-repair";

const schema = z.object({ hello: z.string() });

describe("extractJson", () => {
  it("returns raw JSON unchanged", () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}');
  });

  it("extracts JSON from a fenced code block", () => {
    const text = 'Here you go:\n```json\n{"a":1}\n```\nThanks';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 1 });
  });

  it("extracts the first balanced object from surrounding prose", () => {
    const text = 'Sure! {"a": {"b": 1}} - hope that helps';
    expect(JSON.parse(extractJson(text))).toEqual({ a: { b: 1 } });
  });
});

describe("parseAndValidate", () => {
  it("parses and validates a matching payload", () => {
    const result = parseAndValidate('{"hello":"world"}', schema);
    expect(result).toEqual({ hello: "world" });
  });

  it("throws AiResponseValidationError on invalid JSON", () => {
    expect(() => parseAndValidate("not json", schema)).toThrow(AiResponseValidationError);
  });

  it("throws AiResponseValidationError when the schema doesn't match", () => {
    expect(() => parseAndValidate('{"nope":1}', schema)).toThrow(AiResponseValidationError);
  });
});
