import { describe, expect, it } from 'vitest';
import { pageCurlSamples, pageTextureSurface, speciesSheetCount } from '../src/animation/pageCurl';

describe('lightweight paper curl', () => {
  it('lifts and releases the edge continuously in both reading directions', () => {
    for (const [width, height] of [
      [320, 740],
      [393, 852],
      [932, 430],
      [1024, 1366],
    ]) {
      const forward = pageCurlSamples(width, height);
      const backwards = pageCurlSamples(width, height, true);
      const a = forward.samples,
        b = backwards.samples;
      expect(a[0]).toMatchObject({ p: 0, edge: width });
      expect(a[0].lift).toBeCloseTo(0);
      expect(a.at(-1)!.edge).toBeLessThan(0);
      expect(b.at(-1)!.edge).toBeGreaterThan(width);
      for (let i = 0; i < a.length; i++) {
        expect(Number.isFinite(a[i].edge)).toBe(true);
        expect(a[i].edge + b[i].edge).toBeCloseTo(width);
        expect(parseFloat(a[i].angle)).toBeCloseTo(-parseFloat(b[i].angle));
        expect(a[i].lift).toBeGreaterThanOrEqual(-7);
        expect(a[i].lift).toBeLessThanOrEqual(0);
        if (i) expect(parseFloat(a[i].angle)).toBeLessThan(parseFloat(a[i - 1].angle));
      }
      expect(a[12].flex).toBeGreaterThan(0.99);
      expect(a[0].flex).toBe(0);
      expect(a.at(-1)!.flex).toBeCloseTo(0);
    }
  });
  it('bounds temporary textures on high-density phones and reduces the species-turn surface budget', () => {
    for (const [width, height, density] of [
      [393, 852, 1],
      [411, 883, 3.5],
      [430, 932, 3],
      [1024, 1366, 2],
      [1280, 800, 2],
    ]) {
      const surface = pageTextureSurface(width, height, density);
      expect(Math.max(surface.width, surface.height) * density).toBeLessThanOrEqual(1600.001);
      expect(surface.width * density).toBeLessThanOrEqual(width * 2);
      expect(surface.width / surface.height).toBeCloseTo(width / height);
      expect(surface.width / surface.ratio).toBeCloseTo(width);
      expect(surface.height / surface.ratio).toBeCloseTo(height);
      // Cached faces plus the two narrow fold/shadow strips for each leaf.
      const cachePixels =
        surface.width * surface.height +
        (Math.min(80, width * 0.19) + Math.min(100, width * 0.25)) * height;
      expect(speciesSheetCount * cachePixels).toBeLessThan(5 * width * height);
    }
  });
});
