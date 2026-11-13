// The board picture both of chapter 1's figures use: every part lies inside the picture, and each step's
// lens lies inside it, below its part, with the part at its centre.
import { describe, expect, it } from "vitest";
import { STATE_STEPS } from "./bigPicture";
import { BOARD, LENS, PARTS, PART_IDS, lensGeometry } from "./board";

describe("the board picture", () => {
  it("keeps every part inside the picture", () => {
    for (const id of PART_IDS) {
      const p = PARTS[id];
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w, id).toBeLessThanOrEqual(BOARD.w);
      expect(p.y + p.h, id).toBeLessThanOrEqual(BOARD.h);
    }
  });

  it("places every step's lens inside the picture, below its part", () => {
    for (const s of STATE_STEPS) {
      const g = lensGeometry(PARTS[s.focus]);
      expect(g.left, s.id).toBeGreaterThanOrEqual(0.01);
      expect(g.left + LENS, s.id).toBeLessThanOrEqual(0.99 + 1e-9);
      expect(g.top + (LENS * BOARD.w) / BOARD.h, s.id).toBeLessThanOrEqual(1);
      expect(g.dy, s.id).toBeGreaterThan(0);
    }
  });

  it("centres the magnified part in the lens", () => {
    for (const s of STATE_STEPS) {
      const p = PARTS[s.focus];
      const g = lensGeometry(p);
      // In lens widths: the image is bgSize/100 wide; the part's centre must
      // land at the lens centre (0.5) after the background offset.
      const imgW = g.bgSize / 100;
      const imgH = (imgW * BOARD.h) / BOARD.w;
      const offX = (g.bgX / 100) * (1 - imgW);
      const offY = (g.bgY / 100) * (1 - imgH);
      expect(offX + g.cx * imgW, s.id).toBeCloseTo(0.5, 6);
      expect(offY + g.cy * imgH, s.id).toBeCloseTo(0.5, 6);
      expect(imgW, s.id).toBeGreaterThan(1);
    }
  });
});
