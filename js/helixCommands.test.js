// Helixert — Command Engine Tests
// Tests for helixCommands.js operator-pending and dot-repeat behavior.

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import * as gs from "./gameState.js";
import * as tb from "./textBuffer.js";
import * as hc from "./helixCommands.js";

// --- Helpers ---

function setupLevel(content, cursor = { row: 0, col: 0 }) {
  gs.resetLevelState();
  gs.setContent([...content]);
  gs.setMode("NORMAL");
  gs.setCursor({ ...cursor });
  hc.reset();
}

function press(key, ctrlKey = false) {
  const event = { key, ctrlKey, altKey: false, metaKey: false };
  return hc.execute(key, event);
}

function pressRealEscape() {
  const event = { key: "Escape", ctrlKey: false, altKey: false, metaKey: false };
  return hc.execute("Escape", event);
}

// --- Tests ---

describe("helixCommands", () => {
  describe("operator-pending c (change-word)", () => {
    it("cw changes a word and enters INSERT mode", () => {
      setupLevel(["X-X-X-X-X"], { row: 0, col: 0 });
      press("c");
      press("w");
      assertEquals(gs.getMode(), "INSERT");
    });

    it("cw deletes the word under cursor", () => {
      setupLevel(["X-X-X-X-X"], { row: 0, col: 0 });
      press("c");
      press("w");
      assertEquals(gs.getMode(), "INSERT");
      assertEquals(gs.getContent(), ["-X-X-X-X"]);
    });

    it("cw + type O + Esc replaces word with O", () => {
      setupLevel(["X-X-X-X-X"], { row: 0, col: 0 });
      press("c");
      press("w");
      press("O");
      pressRealEscape();
      assertEquals(gs.getContent(), ["O-X-X-X-X"]);
      assertEquals(gs.getMode(), "NORMAL");
    });

    it("dot repeat (.) repeats the cw change", () => {
      setupLevel(["X-X-X-X-X"], { row: 0, col: 0 });
      press("c");
      press("w");
      press("O");
      pressRealEscape();
      assertEquals(gs.getContent(), ["O-X-X-X-X"]);

      // Move to next X (col 2)
      press("l");
      press("l");
      assertEquals(gs.getCursor().col, 2);

      press(".");
      assertEquals(gs.getContent(), ["O-O-X-X-X"]);
    });

    it("full level: change all X to O using cw + dot repeat", () => {
      setupLevel(["X-X-X-X-X"], { row: 0, col: 0 });

      // Change first word
      press("c");
      press("w");
      press("O");
      pressRealEscape();
      assertEquals(gs.getContent(), ["O-X-X-X-X"]);

      // Move to second X and repeat
      press("l");
      press("l");
      press(".");
      assertEquals(gs.getContent(), ["O-O-X-X-X"]);

      // Move to third X and repeat
      press("l");
      press("l");
      press(".");
      assertEquals(gs.getContent(), ["O-O-O-X-X"]);

      // Move to fourth X and repeat
      press("l");
      press("l");
      press(".");
      assertEquals(gs.getContent(), ["O-O-O-O-X"]);

      // Move to fifth X and repeat
      press("l");
      press("l");
      press(".");
      assertEquals(gs.getContent(), ["O-O-O-O-O"]);
    });
  });

  describe("dot repeat with change operator", () => {
    it("repeats change on different words correctly", () => {
      setupLevel(["abc def ghi"], { row: 0, col: 0 });

      press("c");
      press("w");
      press("X");
      pressRealEscape();
      assertEquals(gs.getContent(), ["X def ghi"]);

      // Move to "def" (col 2)
      press("l");
      press("l");
      assertEquals(gs.getCursor().col, 2);

      press(".");
      assertEquals(gs.getContent(), ["X X ghi"]);
    });

    it("dot repeat does nothing when no previous change", () => {
      setupLevel(["hello"], { row: 0, col: 0 });
      const result = press(".");
      assertEquals(result.handled, true);
      assertEquals(gs.getContent(), ["hello"]);
    });
  });

  describe("operator-pending c (change-line)", () => {
    it("c then x changes the entire line", () => {
      setupLevel(["hello", "world"], { row: 0, col: 0 });
      press("c");
      press("x");
      assertEquals(gs.getMode(), "INSERT");
    });
  });

  describe("operator-pending d (delete-word)", () => {
    it("dw deletes the word under cursor", () => {
      setupLevel(["hello world foo"], { row: 0, col: 0 });
      press("d");
      press("w");
      assertEquals(gs.getContent(), [" world foo"]);
    });

    it("dd x deletes the line", () => {
      setupLevel(["keep", "delete me", "keep"], { row: 1, col: 0 });
      press("d");
      press("x");
      assertEquals(gs.getContent(), ["keep", "keep"]);
    });
  });

  describe("operator-pending y (yank-word)", () => {
    it("yw yanks the word under cursor", () => {
      setupLevel(["hello world"], { row: 0, col: 0 });
      press("y");
      press("w");
      assertEquals(gs.getYankedText(), "hello");
    });
  });

  describe("select mode with cw", () => {
    it("v + w + c selects and changes a word", () => {
      setupLevel(["hello world"], { row: 0, col: 0 });
      press("v");
      assertEquals(gs.getMode(), "SELECT");
      press("w");
      press("c");
      assertEquals(gs.getMode(), "INSERT");
      assertEquals(gs.getContent(), [" world"]);
    });
  });

  describe("count with operator-pending c", () => {
    it("c2w changes two words", () => {
      setupLevel(["hello world foo"], { row: 0, col: 0 });
      press("2");
      press("c");
      press("w");
      assertEquals(gs.getMode(), "INSERT");
      assertEquals(gs.getContent(), [" foo"]);
    });
  });
});
