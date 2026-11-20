import { chromium, expect } from '@playwright/test';
import { initial, type Save } from '../src/state/model';
import { activeVitrail, openVitrail } from '../src/state/vitrail';
import { rotationPeriod, traceVitrail, vitrailHint } from '../src/engine/vitrail';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(30000);
  const now = new Date('2026-11-20T12:00:00Z');
  await page.clock.setFixedTime(now);
  await page.clock.setSystemTime(now);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const w = window as any;
    w.vitrailVoices = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (this: AudioNode, target: any, ...args: any[]) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode)
        (this as any).testGain = target;
      return (connect as any).call(this, target, ...args);
    } as any;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      let peak = 0;
      if (this.buffer && !this.loop)
        for (let channel = 0; channel < this.buffer.numberOfChannels; channel++)
          for (const sample of this.buffer.getChannelData(channel))
            peak = Math.max(peak, Math.abs(sample));
      const item = {
        node: this,
        gain: (this as any).testGain,
        loop: this.loop,
        duration: this.buffer?.duration,
        channels: this.buffer?.numberOfChannels,
        peak,
        ended: false,
      };
      w.vitrailVoices.push(item);
      this.addEventListener('ended', () => (item.ended = true));
      return (start as any).apply(this, args);
    };
  });
  const voices = () =>
    page.evaluate(() =>
      (window as any).vitrailVoices.map((v: any) => ({
        loop: v.loop,
        duration: v.duration,
        channels: v.channels,
        peak: v.peak,
        ended: v.ended,
        gain: v.gain?.gain.value,
      })),
    );
  const cues = async () => (await voices()).filter((v: any) => !v.loop);
  const loops = async () => (await voices()).filter((v: any) => v.loop && !v.ended);
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const fixture = (
    level: number,
    { day = '2026-11-20', sound = true, music = false, motion = false } = {},
  ) => {
    let save: Save = { ...initial(), started: true, guideSeen: true, seeds: 28 };
    save.settings = { ...save.settings, sound, music, motion, haptics: false };
    save.vitrail = {
      version: 1,
      seen: ['mirror', 'splitter', 'mixer'],
      days: { [day]: { completed: level, rewarded: false } },
    };
    save = openVitrail(save, day, level, true, now);
    const puzzle = activeVitrail(save.vitrail!.session!)!;
    const finalCell = puzzle.cells.findIndex((kind, i) => {
      if (kind !== 'mirror') return false;
      const rotations = [...puzzle.solution];
      rotations[i] = (rotations[i] + 1) % 2;
      return !traceVitrail(puzzle, rotations).solved;
    });
    expect(finalCell).toBeGreaterThanOrEqual(0);
    save.vitrail!.session!.rotations = [...puzzle.solution];
    save.vitrail!.session!.rotations[finalCell] ^= 1;
    return { save, finalCell };
  };
  const seed = async (value: ReturnType<typeof fixture>) => {
    await page.goto(url);
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      value.save,
    );
    await page.goto(url + 'vitrail?day=' + value.save.vitrail!.session!.day);
    await expect(page.getByTestId('vitrail-board')).toBeVisible();
    expect(await cues()).toHaveLength(0);
  };
  const win = async (cell: number, duration: number, count = 1) => {
    await page.getByTestId(`vitrail-cell-${cell}`).click();
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    await expect.poll(async () => (await cues()).length).toBe(count);
    const cue = (await cues()).at(-1)!;
    expect(cue.duration).toBeCloseTo(duration, 2);
    expect(cue.channels).toBe(2);
    expect(cue.gain).toBeCloseTo(0.14, 3);
    expect(cue.peak * cue.gain).toBeLessThan(0.061);
    expect(cue.ended).toBe(false);
  };
  try {
    const first = fixture(0);
    await seed(first);
    const puzzle = activeVitrail(first.save.vitrail!.session!)!;
    const other = puzzle.cells.findIndex((kind, i) => {
      if (kind !== 'mirror' || i === first.finalCell) return false;
      const rotations = [...first.save.vitrail!.session!.rotations];
      rotations[i] ^= 1;
      return !traceVitrail(puzzle, rotations).solved;
    });
    expect(other).toBeGreaterThanOrEqual(0);
    await page.getByTestId(`vitrail-cell-${other}`).click();
    await page.getByTestId(`vitrail-cell-${other}`).click();
    expect(await cues()).toHaveLength(0);
    await win(first.finalCell, 3.2);
    expect((await stored()).seeds).toBe(28);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.setViewportSize({ width: 393, height: 852 });
    expect(await cues()).toHaveLength(1);
    await button('Mon calendrier').click();
    await button('Fermer le calendrier').click();
    expect(await cues()).toHaveLength(1);
    await button('Passer au vitrail 2').click();
    await expect(page.getByTestId('vitrail-victory')).toHaveCount(0);
    await expect.poll(async () => (await cues())[0].ended).toBe(true);
    expect(await cues()).toHaveLength(1);

    const second = fixture(1, { motion: true });
    await seed(second);
    await win(second.finalCell, 3.2);
    await button('Menu principal').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect.poll(async () => (await cues())[0].ended).toBe(true);
    await page.getByTestId('home-future-day').click();
    await expect(page.getByTestId('vitrail-board')).toBeVisible();
    expect(await cues()).toHaveLength(1);

    const third = fixture(2, { music: true });
    await seed(third);
    await win(third.finalCell, 5.6);
    expect((await stored()).seeds).toBe(29);
    await expect.poll(async () => (await loops()).length).toBe(1);
    await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08 * 0.55, 2);
    await expect.poll(async () => (await cues())[0].ended, { timeout: 9000 }).toBe(true);
    await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08, 2);
    await page.reload();
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    expect(await cues()).toHaveLength(0);
    await page.getByTestId('vitrail-stage-2').click();
    expect(await cues()).toHaveLength(0);
    await button('Rejouer ce vitrail').click();
    for (let limit = 0; limit < 100; limit++) {
      const session = (await stored()).vitrail!.session!,
        current = activeVitrail(session)!;
      if (traceVitrail(current, session.rotations).solved) break;
      const cell = vitrailHint(current, session.rotations)!;
      await page.getByTestId(`vitrail-cell-${cell}`).click();
      await expect
        .poll(async () => (await stored()).vitrail!.session!.rotations[cell])
        .toBe((session.rotations[cell] + 1) % rotationPeriod(current.cells[cell]));
    }
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    await expect.poll(async () => (await cues()).length).toBe(1);
    expect((await stored()).seeds).toBe(29);

    const muted = fixture(0, { sound: false });
    await seed(muted);
    await page.getByTestId(`vitrail-cell-${muted.finalCell}`).click();
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    expect(await cues()).toHaveLength(0);

    const archive = fixture(2, { day: '2026-11-19' });
    await seed(archive);
    await win(archive.finalCell, 5.6);
    expect((await stored()).seeds).toBe(28);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await cues())[0].ended).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await button('Voir mon calendrier').click();
    await button('Fermer le calendrier').click();
    expect(await cues()).toHaveLength(1);
    expect((await stored()).seeds).toBe(28);
    expect(errors).toEqual([]);
    console.log(
      'Vitrail audio passed: actual stereo orchestral playback on all three wins, quiet 0.14 mix, no ordinary-move/duplicate/resume sounds, motion-independent effects, gentle music duck and recovery, stage/route/background cancellation, mute, replay and archive with unchanged reward rules.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
