/* Seconds from opt-in to the document end. Cursor 14 ends the story; 15 ends the page. */
(() => {
  "use strict";
  const segments = [
    ["opening", 1.5], ["beginning", 5], ["the-invitation", 11],
    ["the-plan", 1.5], ["the-drive", 1.5], ["arrival", 7],
    ["a-memory", 4.5], ["devotion", 1.5], ["the-stage", 3.5],
    ["celebration", 1.5], ["partner-road", 20], ["finale", 1.5],
  ];
  // Extra knots allocate reading time to individual lines, and hold the clear gate.
  const points = [
    [0, 0], [1.5 * 1.9 / 4.7, 1], [1.5, 1.42],
    [4, 1.60], [6.2, 1.70], [6.5, 2],
    [8, 2.18], [11.5, 2.38], [13, 2.56], [16.5, 2.70], [17.5, 3],
    [19, 4], [20.5, 5], [22.1, 5.38], [23.2, 5.60],
    [24.9, 5.60], [25.3, 5.74], [26.7, 5.90], [27.5, 6],
    [29.2, 6.24], [31.1, 6.54], [32, 7], [33.5, 8],
    [36.3, 8.70], [37, 9], [38.5, 10], [58.5, 14], [60, 15],
  ];
  function cursorAt(seconds) {
    if (seconds <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (seconds <= end) return from + (to - from) * (seconds - start) / (end - start);
    }
    return 15;
  }
  // Earliest matching time is used only after a manual seek. Pausing saves exact time.
  function timeAt(cursor) {
    if (cursor <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (cursor <= to) return to === from ? start : start + (end - start) * (cursor - from) / (to - from);
    }
    return 60;
  }
  window.garbaTimeline = Object.freeze({
    duration: 60, openingDuration: 1.5,
    segments: Object.freeze(segments.map(Object.freeze)), cursorAt, timeAt,
  });
})();
