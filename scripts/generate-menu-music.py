"""Render the original CC0 menu theme using the project's MIT instrument bank.

python3 scripts/generate-menu-music.py --soundfont /path/to/FluidR3_GM.sf2
"""
import argparse
import ctypes as C
import ctypes.util
import hashlib
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
TITLE = 'Les couleurs s’éveillent'
RATE = 32000
BEAT = 60 / 102
BAR = 3 * BEAT

# Rounded dynamics and modest stereo placement, from left to right across the ensemble.
# GM program, pan, volume, room send
INSTRUMENTS = [
    (46, 48, 81, 28),  # harp
    (45, 82, 80, 25),  # pizzicato strings
    (42, 75, 87, 30),  # cello
    (48, 51, 75, 32),  # bowed strings
    (73, 56, 92, 27),  # flute
    (71, 72, 89, 28),  # clarinet
    (68, 59, 79, 26),  # oboe
    (40, 42, 77, 30),  # violin
    (8, 84, 69, 30),   # celesta
    (60, 63, 70, 32),  # French horn
]
HARP, PIZZ, CELLO, STRINGS, FLUTE, CLARINET, OBOE, VIOLIN, CELESTA, HORN = range(len(INSTRUMENTS))

# G major, with an E-minor middle phrase. Voicings are in ascending order.
G = (43, (55, 59, 62, 67))
D_F = (42, (54, 57, 62, 66))
EM = (40, (55, 59, 64, 67))
C_MAJOR = (48, (55, 60, 64, 67))
G_B = (47, (55, 59, 62, 67))
AM = (45, (55, 60, 64, 69))
D = (50, (54, 57, 62, 66))
D_A = (45, (57, 62, 66, 69))
BM = (47, (54, 59, 62, 66))
D7 = (50, (54, 57, 60, 66))
CHORDS = [
    G, D_F, EM, C_MAJOR, G_B, AM, D, G,
    C_MAJOR, G_B, D_A, EM, AM, G_B, C_MAJOR, D,
    EM, C_MAJOR, G, D_F, BM, EM, C_MAJOR, D,
    G, C_MAJOR, AM, D, G_B, C_MAJOR, D7, G,
]

# Beat offset, duration, MIDI pitch. The opening B–D–G–F#–E figure returns at bar 25.
MELODY = [
    [(0, .46, 71), (.5, .44, 74), (1, .92, 79), (2, .44, 78), (2.5, .45, 76)],
    [(0, 1.35, 74), (1.5, .43, 69), (2, .91, 74)],
    [(0, .44, 71), (.5, .44, 74), (1, .88, 76), (2, .45, 79), (2.5, .44, 76)],
    [(0, 1.42, 72), (1.5, .44, 76), (2, .85, 79)],
    [(0, .91, 74), (1, .43, 71), (1.5, .44, 74), (2, .89, 79)],
    [(0, .90, 81), (1, .44, 79), (1.5, .43, 76), (2, .88, 72)],
    [(0, .45, 74), (.5, .43, 76), (1, .85, 78), (2, .85, 69)],
    [(0, 2.25, 67), (2.5, .42, 71)],
    [(0, .94, 72), (1, .44, 76), (1.5, .43, 79), (2, .88, 84)],
    [(0, 1.4, 83), (1.5, .43, 79), (2, .86, 74)],
    [(0, 1.4, 81), (1.5, .43, 78), (2, .42, 76), (2.5, .42, 74)],
    [(0, 1.4, 76), (1.5, .43, 74), (2, .88, 71)],
    [(0, .44, 72), (.5, .44, 76), (1, .91, 81), (2, .90, 79)],
    [(0, 1.4, 74), (1.5, .44, 71), (2, .86, 74)],
    [(0, .90, 76), (1, .44, 79), (1.5, .43, 81), (2, .88, 84)],
    [(0, 1.39, 81), (1.5, .43, 78), (2, .84, 74)],
    [(0, .91, 76), (1, .44, 74), (1.5, .44, 71), (2, .90, 67)],
    [(0, 1.37, 64), (1.5, .44, 67), (2, .86, 72)],
    [(0, .44, 71), (.5, .43, 74), (1, .87, 79), (2, .86, 74)],
    [(0, 1.38, 78), (1.5, .44, 76), (2, .83, 74)],
    [(0, .94, 71), (1, .44, 74), (1.5, .42, 78), (2, .88, 81)],
    [(0, .93, 79), (1, .44, 76), (1.5, .44, 74), (2, .85, 71)],
    [(0, .44, 72), (.5, .44, 76), (1, .88, 79), (2, .86, 76)],
    [(0, 1.88, 78), (2, .43, 76), (2.5, .42, 74)],
    [(0, .46, 71), (.5, .44, 74), (1, .92, 79), (2, .44, 78), (2.5, .45, 76)],
    [(0, 1.4, 72), (1.5, .44, 76), (2, .87, 79)],
    [(0, .88, 81), (1, .44, 79), (1.5, .44, 76), (2, .88, 72)],
    [(0, .45, 74), (.5, .43, 76), (1, .87, 78), (2, .87, 81)],
    [(0, .94, 79), (1, .44, 74), (1.5, .44, 71), (2, .89, 74)],
    [(0, .44, 76), (.5, .44, 79), (1, .91, 84), (2, .87, 79)],
    [(0, 1.38, 78), (1.5, .44, 76), (2, .86, 74)],
    [(0, 1.86, 67), (2, .44, 69), (2.5, .43, 67)],
]


def score():
    rng = np.random.default_rng(231122)
    events = []

    def note(bar, at, length, channel, pitch, velocity):
        start = max(0, (3 * bar + at) * BEAT + rng.uniform(-.008, .008))
        end = start + length * BEAT
        velocity += int(rng.integers(-2, 3))
        events.extend([
            (round(start * RATE), True, channel, pitch, velocity),
            (round(end * RATE), False, channel, pitch, 0),
        ])

    for i, ((bass, tones), phrase) in enumerate(zip(CHORDS, MELODY)):
        middle = 16 <= i < 24
        reprise = i >= 24
        note(i, .02, 1.80 if middle else .82, CELLO, bass, 53 if middle else 48)
        note(i, 2.02, .78, CELLO, tones[0], 41)
        for at, index in [(1, 1), (2, 2)]:
            note(i, at, .68, PIZZ, tones[index], 43 if middle else 49)
            if i % 4 in (0, 1) or reprise:
                note(i, at, .63, PIZZ, tones[0], 41)
        for at, index in enumerate([0, 1, 2, 3, 2, 1]):
            note(i, at / 2 + .025, .44, HARP, tones[index] + (12 if at >= 2 else 0),
                 (48 if at in (0, 3) else 42) + (3 if reprise else 0))
        if i >= 2:
            for pitch in (tones[1], tones[2]):
                note(i, .035, 2.78, STRINGS, pitch, 38 if middle else 42)
        lead = FLUTE if i < 8 or reprise else VIOLIN if 8 <= i < 12 else CLARINET
        for at, duration, pitch in phrase:
            note(i, at, duration, lead, pitch, (76 if lead == VIOLIN else 69) + (2 if reprise else 0))
        if 12 <= i < 16 or 20 <= i < 24:
            for at, duration, pitch in phrase:
                note(i, at + .018, duration * .93, OBOE, pitch - 12, 47)
        if i in (3, 7, 10, 15, 19, 23, 25, 27, 29):
            for at, pitch in [(1.5, tones[3] + 12), (2.25, tones[2] + 12)]:
                note(i, at, .56, CELESTA, pitch, 48 if i > 23 else 42)
        if i in (7, 15, 23, 27, 30, 31):
            note(i, .15, 2.30, HORN, tones[0], 42)
        if reprise and i % 2 == 1:
            note(i, .22, 1.35, VIOLIN, tones[2] + 12, 43)
            note(i, 1.65, 1.02, VIOLIN, tones[1] + 12, 42)
    return sorted(events)


def render(font):
    lib = C.CDLL(ctypes.util.find_library('fluidsynth'))
    ptr, integer = C.c_void_p, C.c_int

    def bind(name, result, *types):
        function = getattr(lib, name)
        function.restype = result
        function.argtypes = list(types)
        return function

    settings = bind('new_fluid_settings', ptr)()
    number = bind('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)
    number(settings, b'synth.sample-rate', RATE)
    number(settings, b'synth.gain', 0.7)
    number(settings, b'synth.reverb.room-size', 0.45)
    number(settings, b'synth.reverb.level', 0.32)
    synth = bind('new_fluid_synth', ptr, ptr)(settings)
    load = bind('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)
    program = bind('fluid_synth_program_select', integer, ptr, integer, integer, integer, integer)
    control = bind('fluid_synth_cc', integer, ptr, integer, integer, integer)
    note_on = bind('fluid_synth_noteon', integer, ptr, integer, integer, integer)
    note_off = bind('fluid_synth_noteoff', integer, ptr, integer, integer)
    write = bind('fluid_synth_write_float', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
    free = bind('delete_fluid_synth', None, ptr)
    free_settings = bind('delete_fluid_settings', None, ptr)
    size = round(len(CHORDS) * BAR * RATE)
    events = score()
    audio = np.zeros((size * 2, 2), dtype=np.float32)
    try:
        soundfont = load(synth, str(font).encode(), 1)
        if soundfont < 0:
            raise RuntimeError('Unable to load FluidR3 GM')
        for channel, (patch, pan, volume, reverb) in enumerate(INSTRUMENTS):
            if program(synth, channel, soundfont, 0, patch) != 0:
                raise RuntimeError(f'FluidR3 GM program {patch} is unavailable')
            control(synth, channel, 10, pan)
            control(synth, channel, 7, volume)
            control(synth, channel, 91, reverb)
        cursor = 0
        for repeat in range(2):
            for offset, on, channel, pitch, velocity in events:
                frame = repeat * size + offset
                block = audio[cursor:frame]
                if len(block):
                    write(synth, len(block), block.ctypes.data, 0, 2, block.ctypes.data, 1, 2)
                cursor = frame
                if on:
                    note_on(synth, channel, pitch, velocity)
                else:
                    note_off(synth, channel, pitch)
        block = audio[cursor:]
        if len(block):
            write(synth, len(block), block.ctypes.data, 0, 2, block.ctypes.data, 1, 2)
    finally:
        free(synth)
        free_settings(settings)

    # The last few milliseconds lead back into the same room tail that begins the loop.
    filtered = sosfilt(butter(2, [48, 6900], fs=RATE, btype='bandpass', output='sos'), audio, axis=0)
    loop = filtered[size:]
    fade_length = round(.025 * RATE)
    fade = np.sin(np.linspace(0, np.pi / 2, fade_length))[:, None] ** 2
    loop[-fade_length:] = loop[-fade_length:] * (1 - fade) + filtered[size - fade_length:size] * fade
    loop *= .60 / np.max(np.abs(loop))
    return np.round(loop * 32767).astype('<i2')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--soundfont', type=Path, required=True)
    font = parser.parse_args().soundfont
    sources = json.loads((ROOT / 'scripts/audio-sources.json').read_text())
    with font.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != sources['instruments']['soundfont_sha256']:
            parser.error('The file does not match the project’s MIT-licensed FluidR3 GM bank.')
    audio = render(font)
    notice = (f'{TITLE} — original composition and arrangement for Herbier des couleurs, CC0 1.0.\n'
              'Instrument samples: FluidR3 GM, MIT.\n' + (ROOT / 'public/licenses/FluidR3-MIT.txt').read_text())
    with tempfile.TemporaryDirectory(prefix='herbier-menu-music-') as folder:
        source = Path(folder) / 'menu.wav'
        with wave.open(str(source), 'wb') as file:
            file.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
            file.writeframes(audio.tobytes())
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
            '-codec:a', 'libmp3lame', '-q:a', '4', '-metadata', f'title={TITLE}',
            '-metadata', f'comment={notice}', str(ROOT / 'assets/music/menu.mp3'),
        ], check=True)
    print(f'{TITLE}: {len(audio) / RATE:.2f} s, {len(INSTRUMENTS)} instruments, CC0 score and MIT instrument notice.')


if __name__ == '__main__':
    main()
