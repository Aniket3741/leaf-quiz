// Builds the 3D level: terrain, trees, player, learning stations, gates, enemies, coins
import * as THREE from 'three';
export const END = -190;
export const STATION_Z = [-12, -52, -92, -132];
export const GATE_Z = [-40, -80, -120, -160];
const M = (c, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });

export function buildWorld(scene) {
  const add = (g, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent.add(o); return o; };
  // terrain + path
  add(new THREE.PlaneGeometry(400, 400), M(0x4caf50), 0, -0.02, -100).rotation.x = -Math.PI / 2;
  add(new THREE.BoxGeometry(16, 0.3, 230), M(0xd9b878), 0, -0.15, -100);
  [-8, 8].forEach((x) => add(new THREE.BoxGeometry(0.5, 0.5, 230), M(0x8d6e4b), x, 0.1, -100));
  // scenery
  const tg = new THREE.ConeGeometry(2, 5, 7), trg = new THREE.CylinderGeometry(0.4, 0.5, 2, 6), tm = M(0x2e8b3d), trm = M(0x6d4c2f);
  for (let i = 0; i < 90; i++) {
    const x = (i % 2 ? 1 : -1) * (11 + Math.random() * 30), z = 20 - Math.random() * 230, k = 0.7 + Math.random() * 0.9;
    add(tg, tm, x, 3.5 * k, z).scale.setScalar(k); add(trg, trm, x, k, z).scale.setScalar(k);
  }
  const fg = new THREE.SphereGeometry(0.3, 6, 6);
  for (let i = 0; i < 80; i++) add(fg, M([0xff6fa5, 0xffe066, 0xffffff][i % 3]), (Math.random() - 0.5) * 60, 0.3, 20 - Math.random() * 230);
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const c = add(new THREE.SphereGeometry(5 + Math.random() * 3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), (Math.random() - 0.5) * 160, 40, -Math.random() * 220);
    c.scale.set(2, 0.5, 1); clouds.push(c);
  }
  // player
  const P = new THREE.Group(); scene.add(P);
  const body = add(new THREE.CylinderGeometry(0.4, 0.5, 1, 10), M(0x42a5f5), 0, 0.7, 0, P);
  add(new THREE.SphereGeometry(0.4, 12, 10), M(0xffcc99), 0, 1.6, 0, P);
  add(new THREE.ConeGeometry(0.35, 0.6, 6), M(0x2ecc71), 0, 2.1, 0, P);
  [-0.15, 0.15].forEach((x) => add(new THREE.SphereGeometry(0.07, 6, 6), M(0x111111), x, 1.65, -0.35, P));
  const legs = [-0.2, 0.2].map((x) => add(new THREE.BoxGeometry(0.25, 0.4, 0.3), M(0x37474f), x, 0.2, 0, P));
  // learning stations
  const stations = STATION_Z.map((z) => {
    const g = new THREE.Group(); g.position.set(0, 0, z); scene.add(g);
    add(new THREE.CylinderGeometry(1, 1.3, 0.8, 8), M(0x888888), 0, 0, 0, g);
    const cr = add(new THREE.OctahedronGeometry(0.7), M(0x66ffcc, 0x22aa88), 0, 2, 0, g);
    const lt = new THREE.PointLight(0x66ffcc, 30, 10, 2); lt.position.y = 2; g.add(lt);
    return { g, cr, z, done: false };
  });
  // gates
  const gates = GATE_Z.map((z) => {
    const g = new THREE.Group(); g.position.set(0, 0, z); scene.add(g);
    [-8, 8].forEach((x) => add(new THREE.BoxGeometry(1.2, 7, 1.2), M(0x6d4c2f), x, 3.5, 0, g));
    add(new THREE.BoxGeometry(17, 1, 1.2), M(0x6d4c2f), 0, 7, 0, g);
    const bar = add(new THREE.BoxGeometry(15, 6, 0.4), new THREE.MeshLambertMaterial({ color: 0x55ccff, emissive: 0x2277aa, transparent: true, opacity: 0.6 }), 0, 3, 0, g);
    return { g, bar, z, open: false, ty: 0 };
  });
  // final portal
  const portal = add(new THREE.TorusGeometry(3, 0.4, 10, 30), M(0xffd54a, 0xaa8800), 0, 3.5, END);
  const pin = add(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0xfff6b0, transparent: true, opacity: 0.6 }), 0, 3.5, END);
  // enemies + coins
  const enemies = [], coins = [];
  const eg = new THREE.SphereGeometry(0.7, 10, 8), sg = new THREE.ConeGeometry(0.15, 0.5, 5), em = M(0x8b2e8b, 0x330033), sm = M(0xff4444);
  STATION_Z.forEach((z, i) => {
    [8, 17, 26].forEach((d, k) => {
      const g = new THREE.Group(); g.add(new THREE.Mesh(eg, em));
      for (let n = 0; n < 10; n++) {
        const a = (n / 10) * 6.28, dir = new THREE.Vector3(Math.cos(a), Math.sin(n) * 0.6, Math.sin(a)).normalize();
        const s = new THREE.Mesh(sg, sm); s.position.copy(dir).multiplyScalar(0.8);
        s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(s);
      }
      scene.add(g); enemies.push({ g, z: z - d, sp: 1 + i * 0.35 + k * 0.2, ph: k * 2 + i, dead: false });
    });
    for (let k = 0; k < 5; k++) {
      const c = add(new THREE.SphereGeometry(0.35, 10, 8), M(0xffd54a, 0x996600), (k - 2) * 2.5, 1.2, z - 6 - k * 5);
      c.scale.z = 0.3; coins.push({ m: c, got: false });
    }
  });
  return { P, body, legs, stations, gates, portal, pin, enemies, coins, clouds };
}
