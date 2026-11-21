export type StudioVideoHandle = {
  play: (current: () => boolean) => Promise<void>;
  pause: () => void;
  setForeground: (active: boolean) => void;
};
export type StudioVideoProps = {
  sound: boolean;
  onReady: () => void;
  onEnd: () => void;
  onError: () => void;
};
