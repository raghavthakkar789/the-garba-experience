# Website audio

These audio files are unchanged copies of the user's files in `Audio_folder/`:

- `door_opening_sound.mp3`: door-opening effect (about 1.54 seconds).
- `comming_down_sound.mp3`: character descent effect (about 1.68 seconds).
- `vichudo-kinjal-dave.m4a`: `Vichudo - Kinjal Dave - New Navratri Song.mp3` (about 184 seconds), selected on 2 October 2026.

The new Vichudo source contains AAC audio in an MP4 container despite its `.mp3` filename.
The deployed copy uses `.m4a` so the extension and hosting MIME type match the actual
format. Its bytes are unchanged; no transcoding or quality loss is introduced.
The new URL also avoids reusing the previous track’s browser cache.
Copies live inside `dist` so a deployment serving only that directory includes them.

The logo click unlocks audio. Door and descent effects play once in their respective
animation phases; Vichudo starts when the friends land and loops through the rest
of the story. Reverse scrolling into an intro phase replaces the music with that
phase's effect, then resumes the song's previous position outside the intro.
The header speaker mutes all three tracks; the intro control mutes both effects.
Official YouTube selections replace website audio. Hidden pages pause all tracks.
Reduced-motion/static entry starts Vichudo directly because no descent is animated.
Playback failures expose a retry control. No video or synthesized sound is used.
