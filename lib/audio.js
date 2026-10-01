// Procedural music + sound effects (Web Audio API, no asset files needed)
export function createAudio() {
  let AC, mg, timer;
  const tone = (f, d, t = 'sine', v = 0.15, when = 0, slide = 0) => {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain(), s = AC.currentTime + when;
    o.type = t; o.frequency.setValueAtTime(f, s);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), s + d);
    g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(0.001, s + d);
    o.connect(g); g.connect(mg); o.start(s); o.stop(s + d);
  };
  const init = () => {
    if (AC) { AC.resume(); return; }
    AC = new (window.AudioContext || window.webkitAudioContext)();
    mg = AC.createGain(); mg.connect(AC.destination);
    const sc = [0, 2, 4, 7, 9, 12, 9, 7]; let i = 0;
    timer = setInterval(() => {
      if (AC.state !== 'running') return;
      tone(196 * Math.pow(2, sc[i % 8] / 12), 0.35, 'triangle', 0.045);
      if (i % 4 === 0) tone(98, 0.8, 'sine', 0.05);
      i++;
    }, 380);
  };
  const sfx = {
    jump: () => tone(320, 0.18, 'square', 0.07, 0, 300),
    coin: () => { tone(880, 0.1, 'sine', 0.12); tone(1320, 0.15, 'sine', 0.12, 0.08); },
    ok: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.09)),
    bad: () => tone(220, 0.5, 'sawtooth', 0.12, 0, -150),
    gate: () => tone(120, 1.1, 'sawtooth', 0.1, 0, 300),
    hit: () => tone(150, 0.25, 'square', 0.15, 0, -80),
    stomp: () => tone(500, 0.15, 'square', 0.1, 0, -300),
    use: () => tone(660, 0.2, 'sine', 0.12, 0, 200),
    win: () => {
      const m = [[523, 0], [523, 0.14], [523, 0.28], [659, 0.42], [784, 0.7], [659, 0.95], [784, 1.15], [1047, 1.45]];
      m.forEach(([f, t]) => { tone(f, 0.32, 'triangle', 0.16, t); tone(f / 2, 0.32, 'square', 0.04, t); });
      [523, 659, 784, 1047].forEach((f) => tone(f, 1.4, 'triangle', 0.1, 1.45));
      for (let i = 0; i < 14; i++) tone(1200 + Math.random() * 1800, 0.12, 'sine', 0.05, 1.6 + i * 0.09);
    },
  };
  return {
    init, sfx,
    setMuted: (m) => { if (mg) mg.gain.value = m ? 0 : 1; },
    stop: () => { clearInterval(timer); if (AC) AC.close(); AC = null; },
  };
}
