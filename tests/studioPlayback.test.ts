import { describe, expect, it, vi } from 'vitest';
import { createStudioPlayback } from '../src/animation/studioPlayback';

const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function fixture(play = vi.fn(async (_current: () => boolean) => {})) {
  const pause = vi.fn(),
    blocked = vi.fn(),
    finish = vi.fn();
  return {
    playback: createStudioPlayback({ play, pause, blocked, finish }),
    play,
    pause,
    blocked,
    finish,
  };
}
describe('studio launch playback', () => {
  it('waits for preferences and finishes only once on end/skip/error races', async () => {
    const f = fixture();
    expect(f.play).not.toHaveBeenCalled();
    f.playback.setEnabled(true);
    await tick();
    expect(f.play).toHaveBeenCalledTimes(1);
    f.playback.finish();
    f.playback.finish();
    f.playback.dispose();
    f.playback.setForeground(false);
    f.playback.setForeground(true);
    f.playback.retry();
    expect(f.finish).toHaveBeenCalledTimes(1);
    expect(f.pause).toHaveBeenCalledTimes(1);
    expect(f.play).toHaveBeenCalledTimes(1);
  });
  it('pauses in the background and resumes without rewinding the source', async () => {
    let position = 1.7;
    const play = vi.fn(async (_current: () => boolean) => {
      position += 0.1;
    });
    const f = fixture(play);
    f.playback.setEnabled(true);
    await tick();
    f.playback.setForeground(false);
    expect(f.pause).toHaveBeenCalledTimes(1);
    f.playback.setForeground(true);
    await tick();
    expect(position).toBeCloseTo(1.9);
    expect(f.play).toHaveBeenCalledTimes(2);
    expect(f.finish).not.toHaveBeenCalled();
  });
  it('does not start late audio after backgrounding or skipping during activation', async () => {
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = vi.fn();
    const f = fixture(
      vi.fn(async (current) => {
        await ready;
        if (current()) started();
      }),
    );
    f.playback.setEnabled(true);
    f.playback.setForeground(false);
    release();
    await tick();
    expect(started).not.toHaveBeenCalled();
    f.playback.setForeground(true);
    await tick();
    expect(started).toHaveBeenCalledTimes(1);
    f.playback.finish();
    expect(f.finish).toHaveBeenCalledTimes(1);
  });
  it('offers a gesture retry when autoplay is blocked rather than silently muting', async () => {
    const play = vi
      .fn(async (_current: () => boolean) => {})
      .mockRejectedValueOnce(Error('NotAllowedError'));
    const f = fixture(play);
    f.playback.setEnabled(true);
    await tick();
    expect(f.blocked).toHaveBeenLastCalledWith(true);
    expect(f.finish).not.toHaveBeenCalled();
    f.playback.retry();
    await tick();
    expect(f.play).toHaveBeenCalledTimes(2);
    expect(f.blocked).toHaveBeenLastCalledWith(false);
  });
  it('disposes without opening the game and invalidates pending playback', async () => {
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = vi.fn();
    const f = fixture(
      vi.fn(async (current) => {
        await waiting;
        if (current()) started();
      }),
    );
    f.playback.setEnabled(true);
    f.playback.dispose();
    release();
    await tick();
    expect(started).not.toHaveBeenCalled();
    expect(f.finish).not.toHaveBeenCalled();
  });
});
