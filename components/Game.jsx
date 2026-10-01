'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LESSONS, QS } from '@/lib/data';
import { buildWorld, END } from '@/lib/world';
import { createAudio } from '@/lib/audio';
import { Menu, Learn, Question, Win, Hud, Touch, Confetti  } from './Overlays';

export default function Game() {
  const cv = useRef(null);
  const G = useRef({});                       // { S: game state, w: world, a: audio, jump }
  const th = useRef(0);
  const [ui, setUi] = useState({ hp: 3, coins: 0, gi: 0, hint: 'Walk toward the glowing crystal!' });
  const [panel, setPanel] = useState('menu'); // menu | learn | q | win | null
  const [qi, setQi] = useState(0), [li, setLi] = useState(0), [res, setRes] = useState(null);
  const [toast, setToastText] = useState(''), [muted, setMuted] = useState(false), [fade, setFade] = useState(false), [score, setScore] = useState(0);

  // ---- helpers (use refs/setters only, so they are safe inside the game loop) ----
  const say = (t, ms = 2200) => { setToastText(t); clearTimeout(th.current); th.current = setTimeout(() => setToastText(''), ms); };
  const show = (p) => { G.current.S.pause = p !== null; setPanel(p); };
  const sync = () => {
    const { S, w } = G.current; let hint;
    if (S.gi >= 4) hint = 'Enter the golden portal!';
    else if (!w.stations[S.gi].done) hint = S.near >= 0 ? 'Press E / tap Use to learn' : 'Find the glowing Learning Crystal';
    else hint = 'Dodge or stomp the bugs, then reach Gate ' + (S.gi + 1);
    setUi({ hp: S.hp, coins: S.coins, gi: S.gi, hint });
  };
  const interact = () => {
    const { S, a } = G.current; if (S.pause || S.near < 0) return;
    a.sfx.use(); setLi(S.near); show('learn');
  };
  const learnDone = () => {
    const { w, a } = G.current, st = w.stations[li];
    st.done = true; st.cr.material.color.set(0xffd54a); a.sfx.coin(); show(null); sync(); say('Concept learned! Head to Gate ' + (li + 1));
  };
  const openQ = (i) => { setQi(i); setRes(null); show('q'); };
  const answer = (k) => {
    const { S, w, a } = G.current; if (res) return;
    const ok = k === QS[qi].c; setRes({ k, ok });
    if (!ok) { a.sfx.bad(); return; }
    a.sfx.ok();
    setTimeout(() => {
      const g = w.gates[qi]; g.open = true; g.ty = 9; a.sfx.gate();
      S.gi = qi + 1; S.coins += 5; show(null); sync(); say(S.gi >= 4 ? 'All gates open! Enter the portal!' : 'Gate opened! Keep going!');
    }, 1800);
  };
  const reset = (msg) => {
    const { S, w } = G.current; S.pause = true; setFade(true);
    setTimeout(() => {
      w.P.position.set(0, 0, 10); Object.assign(S, { hp: 3, coins: 0, gi: 0, vy: 0, ground: true, inv: 0, yaw: 0 });
      w.gates.forEach((g) => { g.open = false; g.ty = 0; });
      w.stations.forEach((s) => { s.done = false; s.cr.material.color.set(0x66ffcc); });
      w.enemies.forEach((e) => { e.dead = false; e.g.visible = true; });
      w.coins.forEach((c) => { c.got = false; c.m.visible = true; });
      sync(); setFade(false); show(null); if (msg) say(msg);
    }, 450);
  };
  const start = () => { G.current.a.init(); reset('Walk toward the glowing crystal!'); };
  const toggleMute = () => { const m = !muted; setMuted(m); G.current.a.setMuted(m); };

  // ---- 3D engine: scene, input, game loop ----
  useEffect(() => {
    const el = cv.current;
    const R = new THREE.WebGLRenderer({ canvas: el, antialias: true }); R.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fdcff); scene.fog = new THREE.Fog(0x9fdcff, 25, 90);
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 2.2));
    const sun = new THREE.DirectionalLight(0xfff2cc, 2); sun.position.set(20, 40, 10); scene.add(sun);
    const w = buildWorld(scene), a = createAudio();
    const S = { hp: 3, coins: 0, gi: 0, pause: true, inv: 0, vy: 0, ground: true, cd: 0, near: -1, t: 0, yaw: 0, keys: {}, joy: { x: 0, z: 0 } };
    const jump = () => { if (S.ground && !S.pause) { S.vy = 9; S.ground = false; a.sfx.jump(); } };
    G.current = { S, w, a, jump }; w.P.position.set(0, 0, 10);

    const resize = () => { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
    resize();
    const kd = (e) => { S.keys[e.code] = 1; if (e.code === 'Space') e.preventDefault(); if (e.code === 'KeyE') interact(); };
    const ku = (e) => { S.keys[e.code] = 0; };
    let drag = null;
    const pd = (e) => { drag = e.clientX; }, pu = () => { drag = null; };
    const pm = (e) => { if (drag !== null) { S.yaw -= (e.clientX - drag) * 0.006; drag = e.clientX; } };
    addEventListener('resize', resize); addEventListener('keydown', kd); addEventListener('keyup', ku);
    el.addEventListener('pointerdown', pd); addEventListener('pointerup', pu); addEventListener('pointermove', pm);

    const clk = new THREE.Clock(), v = new THREE.Vector3(); let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clk.getDelta(), 0.05); S.t += dt;
      const { P, legs, body, stations, gates, enemies, coins, clouds, portal, pin } = w, K = S.keys;
      clouds.forEach((c, i) => { c.position.x += dt * (1 + i * 0.1); if (c.position.x > 100) c.position.x = -100; });
      stations.forEach((s) => { s.cr.rotation.y += dt * 2; s.cr.position.y = 2 + Math.sin(S.t * 2) * 0.2; });
      portal.rotation.z += dt; pin.visible = S.gi >= 4;
      gates.forEach((g) => { g.g.position.y += (g.ty - g.g.position.y) * Math.min(1, dt * 2.5); g.bar.material.opacity = g.open ? 0.15 : 0.5 + Math.sin(S.t * 3) * 0.1; });
      enemies.forEach((e) => { if (e.dead) return; e.g.position.set(Math.sin(S.t * e.sp + e.ph) * 6.5, 0.9 + Math.abs(Math.sin(S.t * 3 + e.ph)) * 0.2, e.z); e.g.rotation.y += dt * 2; });
      coins.forEach((c) => { c.m.rotation.y += dt * 3; });

      if (!S.pause) {
        let ix = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + S.joy.x;
        let iz = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + S.joy.z;
        if (K.Space) jump();
        const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
        const sp = K.ShiftLeft ? 10 : 7, y = S.yaw;
        const vx = (-Math.sin(y) * iz + Math.cos(y) * ix) * sp, vz = (-Math.cos(y) * iz - Math.sin(y) * ix) * sp;
        P.position.x += vx * dt; P.position.z += vz * dt;
        if (l > 0.1) { let d = Math.atan2(-vx, -vz) - P.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); P.rotation.y += d * Math.min(1, dt * 12); }
        S.vy -= 24 * dt; P.position.y += S.vy * dt; if (P.position.y <= 0) { P.position.y = 0; S.vy = 0; S.ground = true; }
        P.position.x = Math.max(-7.3, Math.min(7.3, P.position.x)); P.position.z = Math.min(P.position.z, 18);
        const wk = l > 0.1 && S.ground ? Math.sin(S.t * 14) : 0; legs[0].position.z = wk * 0.15; legs[1].position.z = -wk * 0.15; body.rotation.z = wk * 0.05;

        // gate collision + question trigger
        const gt = S.gi < 4 ? gates[S.gi] : null;
        if (gt && !gt.open) {
          if (P.position.z < gt.z + 1.2) P.position.z = gt.z + 1.2;
          if (S.cd <= 0 && P.position.z < gt.z + 4.5) {
            if (stations[S.gi].done) openQ(S.gi); else { say('🔒 Learn at the crystal first!'); S.cd = 2.5; P.position.z += 2; }
          }
        }
        S.cd -= dt; S.inv -= dt; P.visible = S.inv <= 0 || Math.floor(S.t * 14) % 2 === 0;

        // nearest learning station
        let n = -1; stations.forEach((s, i) => { if (Math.hypot(s.g.position.x - P.position.x, s.z - P.position.z) < 3.5) n = i; });
        if (n !== S.near) { S.near = n; sync(); }

        // coins
        v.set(P.position.x, P.position.y + 1, P.position.z);
        coins.forEach((c) => { if (!c.got && c.m.position.distanceTo(v) < 1.2) { c.got = true; c.m.visible = false; S.coins++; a.sfx.coin(); sync(); } });
        // enemies: stomp from above, or lose a heart
        enemies.forEach((e) => {
          if (e.dead || Math.hypot(e.g.position.x - P.position.x, e.z - P.position.z) >= 1.2) return;
          if (S.vy < -1 && P.position.y > 0.5) { e.dead = true; e.g.visible = false; S.vy = 9; S.coins += 2; a.sfx.stomp(); sync(); say('Bug squashed! +2 🪙', 900); }
          else if (S.inv <= 0 && P.position.y < 1.2) {
            S.hp--; S.inv = 1.5; a.sfx.hit(); P.position.z += 3; sync();
            if (S.hp <= 0) { S.pause = true; say('Out of hearts! Back to the start…'); setTimeout(() => reset(), 1200); }
          }
        });
        // finish
        if (S.gi >= 4 && P.position.z < END + 3) { a.sfx.win(); setScore(S.coins); show('win'); }
      }
      const tx = w.P.position.x + Math.sin(S.yaw) * 8, tz = w.P.position.z + Math.cos(S.yaw) * 8;
      cam.position.lerp(v.set(tx, w.P.position.y + 5, tz), Math.min(1, dt * 8));
      cam.lookAt(w.P.position.x, w.P.position.y + 1.5, w.P.position.z);
      R.render(scene, cam);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf); a.stop(); R.dispose();
      removeEventListener('resize', resize); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
      el.removeEventListener('pointerdown', pd); removeEventListener('pointerup', pu); removeEventListener('pointermove', pm);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 touch-none select-none overflow-hidden bg-emerald-950">
      <canvas ref={cv} className="block h-full w-full" />
      <Hud ui={ui} muted={muted} onMute={toggleMute} />
      <Touch onJoy={(x, z) => { G.current.S.joy = { x, z }; }} onJump={() => G.current.jump()} onUse={interact} />
      {toast && <div className="pointer-events-none fixed left-1/2 top-[22%] z-10 -translate-x-1/2 rounded-xl border-2 border-amber-300 bg-emerald-950/95 px-4 py-2 text-center text-sm text-white sm:text-base">{toast}</div>}
      {panel === 'menu' && <Menu onStart={start} />}
      {panel === 'learn' && <Learn lesson={LESSONS[li]} onDone={learnDone} />}
      {panel === 'q' && <Question idx={qi} q={QS[qi]} res={res} onPick={answer} onReturn={() => { show(null); reset('Gates re-locked. Try again!'); }} />}
      {panel === 'win' && <><Win coins={score} onAgain={() => reset()} /><Confetti /></>}
      <div className={`pointer-events-none fixed inset-0 z-30 bg-black transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
