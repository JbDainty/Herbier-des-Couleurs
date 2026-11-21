type Port = {
  play: (current: () => boolean) => Promise<void>;
  pause: () => void;
  blocked: (waiting: boolean) => void;
  finish: () => void;
};

/** One launch, with cancellable activation and no seek/replay on foreground changes. */
export function createStudioPlayback(port: Port) {
  let enabled = false,
    foreground = true,
    closed = false,
    generation = 0;
  const play = async () => {
    if (!enabled || !foreground || closed) return;
    const token = ++generation;
    const current = () => !closed && enabled && foreground && token === generation;
    port.blocked(false);
    try {
      await port.play(current);
      if (!current() && (!foreground || closed || !enabled)) port.pause();
    } catch {
      if (current()) {
        port.pause();
        port.blocked(true);
      }
    }
  };
  const pause = () => {
    generation++;
    port.pause();
  };
  return {
    setEnabled(next: boolean) {
      if (closed || enabled === next) return;
      enabled = next;
      if (next) void play();
      else pause();
    },
    setForeground(next: boolean) {
      if (closed || foreground === next) return;
      foreground = next;
      if (next) void play();
      else pause();
    },
    retry: () => {
      void play();
    },
    finish() {
      if (closed) return;
      closed = true;
      pause();
      port.finish();
    },
    dispose() {
      if (closed) return;
      closed = true;
      pause();
    },
  };
}
