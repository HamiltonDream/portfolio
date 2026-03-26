/** Shared mutable state between R3F scene and DOM overlays */
export const scrollState = {
  scroll: 0,
  progress: 0,
  /** Audio-reactive values (0-1 range), updated by AudioReactor */
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
  /** True when a beat/kick is detected this frame */
  beat: false,
  /** True when audio analysis is active */
  audioActive: false,
};
