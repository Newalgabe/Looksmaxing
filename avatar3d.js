import * as THREE from 'three';

const JAW_MAP = { 'Receding': -2, 'Soft': -1, 'Average': 0, 'Sharp': 1, 'Chiseled': 2 };
const TILT_MAP = { 'Negative': -1, 'Neutral': 0, 'Positive': 1 };
const SYM_MAP = { 'Asymmetrical': 1, 'Average': 0.5, 'Symmetrical': 0 };

const _instances = new WeakMap();

export class Avatar3DRenderer {
  constructor(canvas) {
    if (_instances.has(canvas)) {
      return _instances.get(canvas);
    }

    this.canvas = canvas;
    this.stats = null;
    this.timeMs = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12141a);

    this.camera = new THREE.PerspectiveCamera(28, canvas.width / canvas.height, 0.1, 20);
    this.camera.position.set(0, 0.4, 4.5);
    this.camera.lookAt(0, 0, 0);

    this._setupLights();

    this.headGroup = new THREE.Group();
    this.scene.add(this.headGroup);

    this.meshes = {};
    this._buildHead();
    this._buildEyes();
    this._buildNose();
    this._buildMouth();
    this._buildHair();
    this._buildNeck();
    this._buildShoulders();
    this._buildAccessories();

    _instances.set(canvas, this);
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffeedd, 1.8);
    key.position.set(3, 4, 5);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.6);
    fill.position.set(-3, 1, 3);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x00f0ff, 0.4);
    rim.position.set(0, 2, -4);
    this.scene.add(rim);
  }

  _createSkinMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xf0c8b0,
      roughness: 0.55,
      metalness: 0.0,
      flatShading: false
    });
  }

  _buildHead() {
    const geo = new THREE.SphereGeometry(1.4, 48, 36);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + y * y + z * z);
      const nx = x / d, ny = y / d, nz = z / d;

      let displacement = 0;

      if (nz > 0.2) {
        const jawFactor = Math.max(0, Math.min(1, (-ny + 0.1) / 0.6));
        const sideFactor = Math.abs(nx);
        if (jawFactor > 0 && sideFactor > 0.15) {
          displacement += jawFactor * sideFactor * 0.3;
        }
      }

      const newR = 1.4 + displacement;
      pos.setXYZ(i, nx * newR, ny * newR, nz * newR);
    }
    geo.computeVertexNormals();

    this.meshes.head = new THREE.Mesh(geo, this._createSkinMat());
    this.headGroup.add(this.meshes.head);
    this._headPositions = pos;
  }

  _updateHeadMorph() {
    const s = this.stats;
    if (!s || !this._headPositions) return;
    const pos = this._headPositions;
    const jawVal = JAW_MAP[s.jaw] || 0;
    const symVal = SYM_MAP[s.symmetry] || 0;
    const isBotchedJaw = s.botchedJaw;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + y * y + z * z);
      const nx = x / d, ny = y / d, nz = z / d;

      let displacement = 0;

      if (nz > 0.2) {
        const jawFactor = Math.max(0, Math.min(1, (-ny + 0.1) / 0.6));
        const sideFactor = Math.abs(nx);
        if (jawFactor > 0 && sideFactor > 0.15) {
          const jawDisplace = jawVal * 0.06;
          displacement += jawFactor * sideFactor * jawDisplace;

          if (isBotchedJaw && jawFactor > 0.3) {
            displacement += (Math.sin(i * 2.7) * 0.08);
          }
        }

        if (isBotchedJaw && sideFactor > 0.1 && jawFactor > 0.2) {
          displacement += 0.06 * Math.sin(i * 1.3 + 0.5);
        }

        const asym = symVal * 0.04 * sideFactor * jawFactor;
        displacement += (nx > 0 ? asym : -asym);
      }

      const newR = 1.4 + displacement;
      pos.setXYZ(i, nx * newR, ny * newR, nz * newR);
    }
    pos.needsUpdate = true;
    this.meshes.head.geometry.computeVertexNormals();
  }

  _buildEyes() {
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x08090d, roughness: 0.3 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x4a6a7a, roughness: 0.2 });

    for (const side of ['left', 'right']) {
      const group = new THREE.Group();
      const xOff = side === 'left' ? -0.45 : 0.45;

      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), eyeMat);
      eyeball.position.set(0, 0, 0.05);
      group.add(eyeball);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), irisMat);
      iris.position.set(0, 0, 0.14);
      group.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), pupilMat);
      pupil.position.set(0, 0, 0.18);
      group.add(pupil);

      group.position.set(xOff, 0.18, 1.28);
      this.headGroup.add(group);
      this.meshes[`eye_${side}`] = { group, eyeball, iris, pupil };
    }

    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xf0c8b0, roughness: 0.6, side: THREE.DoubleSide
    });
    this._upperLidLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.04), lidMat);
    this._upperLidLeft.position.set(-0.45, 0.24, 1.32);
    this.headGroup.add(this._upperLidLeft);

    this._lowerLidLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.04), lidMat);
    this._lowerLidLeft.position.set(-0.45, 0.13, 1.32);
    this.headGroup.add(this._lowerLidLeft);

    this._upperLidRight = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.04), lidMat);
    this._upperLidRight.position.set(0.45, 0.24, 1.32);
    this.headGroup.add(this._upperLidRight);

    this._lowerLidRight = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.04), lidMat);
    this._lowerLidRight.position.set(0.45, 0.13, 1.32);
    this.headGroup.add(this._lowerLidRight);

    this._blinkState = 0;
  }

  _updateEyes() {
    const s = this.stats;
    if (!s) return;
    const tiltVal = TILT_MAP[s.tilt] || 0;
    const isBotched = s.botchedCanthoplasty;

    for (const side of ['left', 'right']) {
      const eye = this.meshes[`eye_${side}`];
      if (!eye) continue;
      const rot = side === 'left' ? -tiltVal * 0.1 : tiltVal * 0.1;
      eye.group.rotation.z = rot;

      if (isBotched && side === 'left') {
        eye.group.position.y = 0.14;
        eye.group.scale.y = 0.7;
      } else {
        eye.group.position.y = 0.18;
        eye.group.scale.y = 1;
      }
    }
  }

  _blink(delta) {
    const blinkCycle = 4000;
    const blinkDuration = 120;
    const phase = delta % blinkCycle;
    let blinkAmt = 0;
    if (phase < blinkDuration) {
      const t = phase / blinkDuration;
      blinkAmt = t < 0.5 ? t * 2 : (1 - t) * 2;
    }

    const s = 1 - blinkAmt * 0.85;
    if (this._lowerLidLeft) {
      const posY = s < 0.5 ? 0.18 : 0.13;
      this._lowerLidLeft.scale.y = Math.max(0.1, s);
      this._lowerLidRight.scale.y = Math.max(0.1, s);
    }
  }

  _buildNose() {
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xe8b898, roughness: 0.6, metalness: 0
    });
    const base = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), noseMat);
    base.position.set(0, -0.08, 1.38);
    base.rotation.x = 0.15;
    this.headGroup.add(base);
    this.meshes.noseBase = base;

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), noseMat);
    tip.position.set(0, -0.2, 1.46);
    this.headGroup.add(tip);
    this.meshes.noseTip = tip;

    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.2, 6), noseMat);
    bridge.position.set(0, 0.05, 1.32);
    this.headGroup.add(bridge);
    this.meshes.noseBridge = bridge;
  }

  _buildMouth() {
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0xcc7788, roughness: 0.4, metalness: 0
    });
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI), mouthMat);
    lip.position.set(0, -0.58, 1.32);
    lip.rotation.x = 0.2;
    this.headGroup.add(lip);
    this.meshes.mouth = lip;
  }

  _updateMouth() {
    const s = this.stats;
    if (!s || !this.meshes.mouth) return;
    const conf = s.confidence || 50;
    const smileAmt = (conf - 50) / 50;
    this.meshes.mouth.rotation.z = -smileAmt * 0.2;
    this.meshes.mouth.position.y = -0.58 + smileAmt * 0.03;
  }

  _buildHair() {
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x08090d, roughness: 0.9, metalness: 0.05
    });
    this.meshes.hairMat = hairMat;

    const geo = new THREE.SphereGeometry(1.45, 32, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.15) {
        pos.setXYZ(i, 0, 0, 0);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const hair = new THREE.Mesh(geo, hairMat);
    this.headGroup.add(hair);
    this.meshes.hair = hair;
    this._hairPositions = pos;
  }

  _updateHair() {
    const s = this.stats;
    if (!s || !this._hairPositions) return;
    const hl = s.hairline || 1;
    const gender = s.gender || 'male';
    const isBotched = s.botchedHair;

    const pos = this._hairPositions;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (x === 0 && y === 0 && z === 0) continue;

      const d = Math.sqrt(x * x + y * y + z * z);
      const nx = x / d, ny = y / d, nz = z / d;

      let keep = true;
      const sideHair = Math.abs(nx) > 0.55 && ny < 0.3 && nz > 0.6;

      if (gender === 'male') {
        if (hl <= 1) {
          keep = ny > -0.1;
        } else if (hl <= 3) {
          if (nz > 0.2 && ny > 0.1) {
            const templeRecess = Math.abs(nx) > 0.45 && ny < 0.5;
            keep = !templeRecess;
          }
          keep = keep || sideHair;
        } else if (hl <= 5) {
          keep = ny < 0.1 || sideHair;
        } else {
          keep = sideHair;
        }
      } else {
        if (hl <= 2) {
          keep = ny > -0.4;
        } else if (hl <= 5) {
          keep = ny > -0.2 || ny < -0.5;
        } else {
          keep = Math.abs(nx) > 0.5 || ny < -0.5;
        }
      }

      if (!keep) {
        pos.setXYZ(i, 0, 0, 0);
      } else {
        const hairR = 1.45 + (ny > 0.4 ? 0.05 : 0);
        pos.setXYZ(i, nx * hairR, ny * hairR, nz * hairR);
      }
    }
    pos.needsUpdate = true;
    this.meshes.hair.geometry.computeVertexNormals();

    if (isBotched) {
      this.meshes.hairMat.color.setHex(0x441122);
    } else {
      this.meshes.hairMat.color.setHex(0x08090d);
    }
  }

  _buildNeck() {
    const skinMat = this._createSkinMat();
    const geo = new THREE.CylinderGeometry(0.25, 0.4, 0.7, 12);
    const neck = new THREE.Mesh(geo, skinMat);
    neck.position.set(0, -1.65, 0);
    this.headGroup.add(neck);
    this.meshes.neck = neck;
  }

  _buildShoulders() {
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x3e4451, roughness: 0.7, metalness: 0.1
    });
    this.meshes.clothMat = clothMat;

    const geo = new THREE.SphereGeometry(1.0, 16, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (y > -0.2) {
        pos.setXYZ(i, 0, 0, 0);
      } else {
        pos.setXYZ(i, x * 2.0, y * 0.5 - 1.8, z * 0.6);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const shoulders = new THREE.Mesh(geo, clothMat);
    this.headGroup.add(shoulders);
    this.meshes.shoulders = shoulders;
  }

  _updateClothing() {
    const s = this.stats;
    if (!s || !this.meshes.clothMat) return;
    const style = s.style || 30;
    let color;
    if (style >= 80) color = 0x0a0a0c;
    else if (style >= 60) color = 0x1e1c24;
    else if (style >= 30) color = 0x4b5263;
    else color = 0x2b221a;
    this.meshes.clothMat.color.setHex(color);
  }

  _buildAccessories() {
    this._accGroup = new THREE.Group();
    this.headGroup.add(this._accGroup);
  }

  _updateAccessories() {
    const s = this.stats;
    if (!s) return;
    const style = s.style || 0;
    const gender = s.gender || 'male';

    while (this._accGroup.children.length > 0) {
      const c = this._accGroup.children[0];
      this._accGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }

    if (style >= 50) {
      const frameMat = new THREE.MeshStandardMaterial({
        color: style >= 80 ? 0xffea00 : 0x00f0ff,
        roughness: 0.3, metalness: 0.8
      });
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x0c0e14, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.85
      });

      for (const side of ['left', 'right']) {
        const xOff = side === 'left' ? -0.45 : 0.45;
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), lensMat);
        lens.position.set(xOff, 0.2, 1.4);
        this._accGroup.add(lens);

        const rim = new THREE.Mesh(
          new THREE.RingGeometry(0.13, 0.14, 16), frameMat
        );
        rim.position.set(xOff, 0.2, 1.41);
        this._accGroup.add(rim);
      }

      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.02, 0.02), frameMat
      );
      bridge.position.set(0, 0.18, 1.41);
      this._accGroup.add(bridge);
    }

    if (style >= 75) {
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0xb0b5c2, roughness: 0.2, metalness: 0.9
      });
      const curve = new THREE.EllipseCurve(0, 0, 0.3, 0.25, 0.1 * Math.PI, 0.9 * Math.PI, false, 0);
      const points = curve.getPoints(12);
      const path = new THREE.CatmullRomCurve3(
        points.map(p => new THREE.Vector3(p.x, p.y - 1.1, 1.1))
      );
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(path, 12, 0.015, 4, false), chainMat
      );
      this._accGroup.add(tube);

      const medallion = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 8), 
        new THREE.MeshStandardMaterial({ color: 0xffca28, roughness: 0.2, metalness: 0.8 })
      );
      medallion.position.set(0, -1.3, 1.25);
      this._accGroup.add(medallion);
    }

    if (style >= 90) {
      const hpMat = new THREE.MeshStandardMaterial({
        color: 0xf8f8f2, roughness: 0.4, metalness: 0.0
      });
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.04, 6, 24, Math.PI * 0.7),
        hpMat
      );
      band.rotation.x = 0.3;
      band.position.set(0, 0.55, 0.7);
      this._accGroup.add(band);

      for (const side of ['left', 'right']) {
        const xOff = side === 'left' ? -0.72 : 0.72;
        const cup = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.22, 0.1), hpMat
        );
        cup.position.set(xOff, 0.15, 0.85);
        this._accGroup.add(cup);
      }
    }
  }

  render(stats, timeMs = 0) {
    this.stats = stats;
    this.timeMs = timeMs;

    if (!stats) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this._updateHeadMorph();
    this._updateEyes();
    this._blink(timeMs);
    this._updateMouth();
    this._updateHair();
    this._updateClothing();
    this._updateAccessories();

    const breath = Math.sin(timeMs * 0.002) * 0.006;
    this.headGroup.position.y = breath;

    const rotSpeed = 0.15;
    this.headGroup.rotation.y = Math.sin(timeMs * 0.0003) * 0.2;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.renderer.dispose();
    _instances.delete(this.canvas);
  }
}

export function drawAvatar3D(canvas, stats, timeMs = 0) {
  let renderer = _instances.get(canvas);
  if (!renderer) {
    renderer = new Avatar3DRenderer(canvas);
  }
  renderer.render(stats, timeMs);
}
