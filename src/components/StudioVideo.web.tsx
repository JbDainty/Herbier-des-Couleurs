import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Asset } from 'expo-asset';
import { setAudioForeground } from '../services/audioFocus';
import type { StudioVideoHandle, StudioVideoProps } from './studioVideoTypes';

const source = Asset.fromModule(require('../../assets/studio/krabel-intro.mp4')).uri;
export const StudioVideo = forwardRef<StudioVideoHandle, StudioVideoProps>(
  function StudioVideo(props, ref) {
    const video = useRef<HTMLVideoElement>(null);
    const latest = useRef(props);
    latest.current = props;
    useImperativeHandle(
      ref,
      () => ({
        async play(current) {
          const node = video.current;
          if (!node || !current()) return;
          node.muted = !latest.current.sound;
          node.volume = 1;
          await node.play();
        },
        pause() {
          const node = video.current;
          if (node) {
            node.muted = true;
            node.pause();
          }
        },
        setForeground: setAudioForeground,
      }),
      [],
    );
    return (
      <video
        ref={video}
        data-testid="studio-video"
        aria-label="Logo du studio Krabel"
        src={source}
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onLoadedData={props.onReady}
        onEnded={props.onEnd}
        onError={props.onError}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: 'white',
        }}
      />
    );
  },
);
