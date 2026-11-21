import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { nativeAudioLifecycle } from '../services/nativeAudio';
import type { StudioVideoHandle, StudioVideoProps } from './studioVideoTypes';

export const StudioVideo = forwardRef<StudioVideoHandle, StudioVideoProps>(
  function StudioVideo(props, ref) {
    const latest = useRef(props);
    latest.current = props;
    const player = useVideoPlayer(require('../../assets/studio/krabel-intro.mp4'), (instance) => {
      instance.loop = false;
      instance.muted = !props.sound;
      instance.volume = 1;
      instance.staysActiveInBackground = false;
      instance.allowsExternalPlayback = false;
      instance.audioMixingMode = props.sound ? 'doNotMix' : 'mixWithOthers';
    });
    useImperativeHandle(
      ref,
      () => ({
        async play(current) {
          if (latest.current.sound) {
            const ready = await nativeAudioLifecycle.setActive(true);
            if (!current()) return;
            if (!ready) throw Error('Audio session unavailable');
          }
          if (!current()) return;
          player.muted = !latest.current.sound;
          player.audioMixingMode = latest.current.sound ? 'doNotMix' : 'mixWithOthers';
          player.play();
        },
        pause() {
          try {
            player.muted = true;
            player.pause();
          } catch {
            /* The hook may already have released the decoder. */
          }
        },
        setForeground(active) {
          if (!active) void nativeAudioLifecycle.setActive(false);
        },
      }),
      [player],
    );
    useEffect(() => {
      const ended = player.addListener('playToEnd', () => latest.current.onEnd());
      const status = player.addListener('statusChange', ({ status }) => {
        if (status === 'error') latest.current.onError();
      });
      if (player.status === 'error') latest.current.onError();
      return () => {
        ended.remove();
        status.remove();
      };
    }, [player]);
    return (
      <VideoView
        testID="studio-video"
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        onFirstFrameRender={props.onReady}
      />
    );
  },
);
