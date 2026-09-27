# Magic Quest expansion — 2026-09-27

## Market observations
- Magic Sort (Grand Games): colour feedback, magic tools and continued level releases; its current Play Store release notes list 100 new levels. https://play.google.com/store/apps/details?id=com.grandgames.magicsort
- Water Sort: Color Tube Puzzle (Flyfox): pouring sound, background music, daily challenges and progression rewards. https://play.google.com/store/apps/details?id=water.sort.puzzle.color.sort.games
- Water Sort Club (Gamovation): music and satisfying water sounds. https://play.google.com/store/apps/details?id=com.gamovation.watersort

Store listings describe the products; these are design references, not comparative playtest results. No graphics, music or code from these games was copied.

## Implemented
- 300 stored, solution-verified, distinct bottle layouts. Original levels 1–30 preserved. New levels increase from 4 to 8 colours; every colour has exactly four units.
- Three chapters of 100 stages, ten-stage map pages, current-position shortcut, completion stars and five mastery titles.
- Original, locally bundled forest/moon/castle music loops with layered bell, pad and bass voices. Separate music/effect toggles and volume controls. Playback begins on user interaction and pauses when the page is hidden.
- Pouring noise/bubbles aligned to visible stream, completion chords, victory fanfare, error/undo/hint cues.
- Target-position bursts, three expanding shock rings, radial rays, star particles, impact glow, splash droplets, ripples and consecutive-completion chains.
- Daily puzzle selected deterministically by Korean calendar day; local best move count. Free practice has three difficulties and permits puzzles beyond campaign unlocks. Practice and daily wins do not award campaign stars.
- Star-unlocked gold and aurora bottle treatments. Reduced motion, symbol overlays, optional haptics, keyboard controls and local save migration retained.

## Validation boundaries
Automated solution replay checks cover all 300 boards and enforce colour conservation, capacity, illegal-move rejection and immutable inputs. Browser checks cover desktop, 390×844 and 360×640 layouts, 8-colour practice, audio playing/pause state, daily completion, map navigation and saved progress. These viewport checks do not replace physical-device audio/performance testing. Persistence is local to the browser; there is no account/cloud sync.
