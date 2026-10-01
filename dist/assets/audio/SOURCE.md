# Website audio

These MP3s are unchanged copies of the user's files in `Audio_folder/`:

- `door_opening_sound.mp3`: door-opening effect (about 1.54 seconds).
- `comming_down_sound.mp3`: character descent effect (about 1.68 seconds).
- `vichudo-kinjal-dave.mp3`: `Vichudo - Kinjal Dave - New Navratri Song 2024 - KD Digital.mp3` (about 210 seconds).

The Vichudo file is also byte-identical to the MP3 supplied on 30 September 2026.
Copies live inside `dist` so a deployment serving only that directory includes them.

The logo click unlocks audio. Door and descent effects play once in their respective
animation phases; Vichudo starts when the friends land and loops through the rest
of the story. Reverse scrolling into an intro phase replaces the music with that
phase's effect, then resumes the song's previous position outside the intro.
The header speaker mutes all three tracks; the intro control mutes both effects.
Official YouTube selections replace website audio. Hidden pages pause all tracks.
Reduced-motion/static entry starts Vichudo directly because no descent is animated.
Playback failures expose a retry control. No video or synthesized sound is used.
