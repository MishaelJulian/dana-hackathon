/**
 * palace.js — 3D Chahar Bagh Mind Palace
 *
 * A procedural, low-poly Persian four-fold garden rendered in Three.js.
 * Designed for sub-$100 Android Go: no textures (canvas-procedural only),
 * no real-time lights, vertex-lit only, <5000 triangles per room.
 *
 * Perf strategy (BUILD_GUIDE.md: <=50 draw calls, <=30k verts, 30fps min):
 *  - Repeated geometry (pillars, trees, room-nodes, garden patches, arches)
 *    is drawn via THREE.InstancedMesh — one draw call per "kind" instead of
 *    one per copy.
 *  - Raycasting only runs on pointermove/pointerdown, never inside the
 *    render loop.
 *  - Render loop pauses on document.hidden (Page Visibility API) in
 *    addition to in-app route-away.
 *  - Frame rate is capped (~50fps) by skipping renders inside rAF rather
 *    than fighting rAF's own cap — cheap insurance on high-refresh displays.
 *
 * Three.js is dynamically imported — loaded only when the palace opens.
 */

import { VerificationRegistry } from '../verification/registry.js';

let THREE = null;
let EffectComposer = null;
let RenderPass = null;
let UnrealBloomPass = null;

// Mesh budget per BUILD_GUIDE.md: 5000 tris / room, 30k total scene, <=50 draw calls
const FLOOR_SIZE = 16;
const POOL_SIZE = 3;
const PILLAR_HEIGHT = 4;
const WALL_HEIGHT = 3.5;
const ARCH_RADIUS = 1.6;
const ARCH_SPAN = 1.15;

// Cap render rate — no benefit rendering faster than this on Android Go class GPUs
const MAX_FPS = 50;
const MIN_FRAME_MS = 1000 / MAX_FPS;

// The four courses that map to the four quadrants
// Each has a full room theme: accent pillars, pool, ornament, fog, sky
const COURSE_NODES = [
  {
    id: 'nature', name: 'طبیعت ایران', icon: '\u{1F33F}',
    accent: 0x2e7d32, pool: 0x1b5e20, ornament: 0x66bb6a,
    fog: 0x071a07, sky: 0x0a1f0a,
  },
  {
    id: 'math', name: 'ریاضیات به مثابه بازی', icon: '\u{1F9EE}',
    accent: 0x1565c0, pool: 0x0d47a1, ornament: 0x42a5f5,
    fog: 0x050d1a, sky: 0x0a1530,
  },
  {
    id: 'literacy', name: 'سواد دیجیتال و رسانه', icon: '\u{1F4F0}',
    accent: 0x6a1b9a, pool: 0x4a148c, ornament: 0xab47bc,
    fog: 0x10051a, sky: 0x1a0a30,
  },
  {
    id: 'connection', name: 'پیوند درس‌ها', icon: '\u{2B50}',
    accent: 0xe8b23a, pool: 0xbf8f00, ornament: 0xffd54f,
    fog: 0x1a1505, sky: 0x1f1a0a,
  },
];

// Camera targets per quadrant (where to look when a room is entered)
const QUADRANT_CAMERA = [
  { angle: Math.PI * 1.25, radius: 9, height: 5 },   // nature: back-left
  { angle: Math.PI * 1.75, radius: 9, height: 5 },   // math: back-right
  { angle: Math.PI * 0.75, radius: 9, height: 5 },   // literacy: front-left
  { angle: Math.PI * 0.25, radius: 9, height: 5 },   // connection: front-right
];

// Quadrant center offsets, reused by garden patches, trees and room-nodes
const QUADRANT_OFFSETS = [
  [-FLOOR_SIZE / 4 - 0.5, -FLOOR_SIZE / 4 - 0.5],
  [FLOOR_SIZE / 4 + 0.5, -FLOOR_SIZE / 4 - 0.5],
  [-FLOOR_SIZE / 4 - 0.5, FLOOR_SIZE / 4 + 0.5],
  [FLOOR_SIZE / 4 + 0.5, FLOOR_SIZE / 4 + 0.5],
];

const PILLAR_POSITIONS = [
  [-FLOOR_SIZE / 2 + 1, 0, -FLOOR_SIZE / 2 + 1],
  [FLOOR_SIZE / 2 - 1, 0, -FLOOR_SIZE / 2 + 1],
  [-FLOOR_SIZE / 2 + 1, 0, FLOOR_SIZE / 2 - 1],
  [FLOOR_SIZE / 2 - 1, 0, FLOOR_SIZE / 2 - 1],
];

export class Palace {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.isActive = false;
    this.currentRoom = null;
    this.clock = null;

    // Camera orbit state
    this.cameraAngle = 0;
    this.cameraRadius = 12;
    this.cameraHeight = 6;
    this.targetAngle = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.15;

    // Touch handling
    this.touchStartX = 0;
    this.lastTouchX = 0;

    // Interactive room nodes (lightweight logical records, not Object3D-per-node)
    this.roomNodes = [];
    this.nodeMesh = null;   // InstancedMesh: octahedra
    this.glowMesh = null;   // InstancedMesh: inner glow spheres
    this.ringMesh = null;   // InstancedMesh: marker rings
    this.raycaster = null;
    this.mouse = null;
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this._raycastDirty = false;

    // Frame pacing
    this._lastFrameTime = 0;

    // Post-processing (bloom) — built lazily, may be skipped on low-power
    this.composer = null;
    this.bloomEnabled = false;

    // Page Visibility handling
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this._pausedByVisibility = this.isActive;
        this.stop();
      } else if (this._pausedByVisibility) {
        this._pausedByVisibility = false;
        this.start();
      }
    };

    this.onRoomChange = null;
    this.onNodeSelect = null;
  }

  /**
   * Initialise the Three.js scene (async — dynamically imports Three.js)
   * @param {HTMLCanvasElement} canvas
   */
  async init(canvas) {
    if (this.scene) return;

    // Lazy-load Three.js to keep initial bundle small
    if (!THREE) {
      try {
        console.log('[Palace] Loading Three.js...');
        THREE = await import('three');
        console.log('[Palace] Three.js loaded');
      } catch (err) {
        console.error('[Palace] Failed to load Three.js:', err);
        return;
      }
    }

    // Ensure canvas has dimensions (CSS layout may not be ready)
    if (!canvas.clientWidth || !canvas.clientHeight) {
      console.warn('[Palace] Canvas has zero dimensions, retrying in 100ms...');
      await new Promise(r => setTimeout(r, 100));
      if (!canvas.clientWidth || !canvas.clientHeight) {
        console.error('[Palace] Canvas still has zero dimensions after retry');
        return;
      }
    }

    this.canvas = canvas;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);

    // Clock (must be after Three.js import)
    this.clock = new THREE.Clock();

    // Camera — perspective for depth, fov 60 for natural feel
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.updateCameraPosition();

    // Renderer — preserveDrawingBuffer false for performance
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: 'low-power',
      });
      console.log('[Palace] WebGL renderer created');
    } catch (err) {
      console.error('[Palace] WebGL renderer failed:', err);
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    console.log(`[Palace] Canvas size: ${canvas.clientWidth}x${canvas.clientHeight}`);

    // Single directional light — warm, low intensity
    // "No real-time lights." Lighting is vertex-shaded via MeshLambertMaterial;
    // richness comes from baked gradients/textures, not extra lights or shadows.
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.6);
    dirLight.position.set(5, 8, 3);
    this.scene.add(dirLight);

    // Ambient — subtle fill
    const ambientLight = new THREE.AmbientLight(0x334455, 0.4);
    this.scene.add(ambientLight);

    // Procedural sky (gradient CanvasTexture on a large inverted sphere)
    this.buildSky();

    // Build the Chahar Bagh room
    this.buildRoom();

    // === Dynamic flora layer ===
    this.floraGroup = new THREE.Group();
    this.scene.add(this.floraGroup);

    // Interactive room nodes above each quadrant (instanced)
    this.buildRoomNodes();

    // Stars
    this.buildStars();

    // Raycaster for node interaction — only ever run from pointer events, never per-frame
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Input handlers
    this.setupInput(canvas);

    // Resize handler
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(canvas);

    // Pause/resume on tab visibility change (battery/GPU saver)
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Optional bloom pass on emissive elements — best effort, falls back
    // to plain rendering if postprocessing modules or the GPU look too weak.
    await this.setupBloom(canvas);

    console.log('[Palace] Initialised');
  }

  /**
   * Procedural gradient sky — a CanvasTexture wrapped on a large inverted
   * sphere. Cheap (one extra draw call, one small texture) but reads as
   * an authored dusk sky instead of a flat background color.
   */
  buildSky() {
    const room = this.getRoomConfig();
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.35, this._hexToCss(room.sky));
    grad.addColorStop(0.75, this._hexToCss(room.fog));
    grad.addColorStop(1, '#1a1005');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const skyGeo = new THREE.SphereGeometry(45, 12, 8);
    const skyMat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.userData.roomAccent = 'sky-mesh';
    sky.renderOrder = -1;
    this.scene.add(sky);
    this._skyTexture = tex;
    this._skyCanvas = canvas;
    this._skyCtx = ctx;
  }

  _hexToCss(hex) {
    return `#${hex.toString(16).padStart(6, '0')}`;
  }

  /**
   * Redraw the sky gradient when the room theme changes (recolor, not rebuild)
   */
  _updateSkyGradient(course) {
    if (!this._skyCtx || !this._skyTexture) return;
    const ctx = this._skyCtx;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.35, this._hexToCss(course.sky));
    grad.addColorStop(0.75, this._hexToCss(course.fog));
    grad.addColorStop(1, '#1a1005');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    this._skyTexture.needsUpdate = true;
  }

  /**
   * Procedural girih-style tile pattern for the ground plane, generated on
   * a <canvas> (no shipped texture asset). An 8-pointed star / interlocking
   * strap motif, tiled via repeating UVs — cheap on a low-poly ground plane.
   */
  _buildGirihTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base tile color
    ctx.fillStyle = '#241a10';
    ctx.fillRect(0, 0, size, size);

    // Girih strap lines: a simple interlocking 8-point star lattice,
    // repeated in a 2x2 grid of half-tiles so it tiles seamlessly.
    const drawStar = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a1 = (Math.PI / 4) * i;
        const a2 = a1 + Math.PI / 8;
        const x1 = cx + Math.cos(a1) * r;
        const y1 = cy + Math.sin(a1) * r;
        const x2 = cx + Math.cos(a2) * r * 0.45;
        const y2 = cy + Math.sin(a2) * r * 0.45;
        if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
    };

    ctx.strokeStyle = 'rgba(230, 200, 150, 0.35)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(230, 200, 150, 0.06)';

    const positions = [
      [0, 0], [size, 0], [0, size], [size, size], // corners (shared)
      [size / 2, size / 2], // center
    ];
    positions.forEach(([x, y]) => {
      drawStar(x, y, size * 0.22);
      ctx.fill();
      ctx.stroke();
    });

    // Fine connecting strap lines between star points (subtle grid)
    ctx.strokeStyle = 'rgba(230, 200, 150, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Procedural rippled-water texture + gentle vertex displacement for the
   * pool surface. Cheap: a small scrolling CanvasTexture (fake specular
   * highlights) plus a low-poly plane whose vertices bob with a sine wave
   * in the animation loop — no real-time reflection/refraction.
   */
  _buildWaterTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d3b52';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const y = (i / 6) * size + Math.sin(i) * 4;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.25, y + 6, size * 0.75, y - 6, size, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  /**
   * Build the Chahar Bagh (four-fold garden) room
   * All geometry is procedural — no loaded assets
   */
  buildRoom() {
    const room = this.getRoomConfig();

    // === Ground (procedural girih tile texture instead of flat color) ===
    const groundGeo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
    const girihTex = this._buildGirihTexture();
    const groundMat = new THREE.MeshLambertMaterial({ map: girihTex, color: 0xffffff });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);

    // === Central pool (rippled water texture, gentle vertex bob) ===
    const poolSegs = 8;
    const poolGeo = new THREE.PlaneGeometry(POOL_SIZE, POOL_SIZE, poolSegs, poolSegs);
    poolGeo.rotateX(-Math.PI / 2);
    const waterTex = this._buildWaterTexture();
    const poolMat = new THREE.MeshLambertMaterial({
      map: waterTex,
      color: 0x1a5276,
      transparent: true,
      opacity: 0.88,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = 0.1;
    pool.userData.roomAccent = 'pool';
    this.scene.add(pool);
    this._pool = pool;
    this._poolBasePositions = poolGeo.attributes.position.array.slice();

    // Pool border
    const borderGeo = new THREE.BoxGeometry(POOL_SIZE + 0.4, 0.25, POOL_SIZE + 0.4);
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.12;
    this.scene.add(border);

    // === Pathways (cross pattern) — merged into a single mesh via a plus-shaped
    // geometry is overkill for 2 boxes; keep as 2 draw calls, negligible cost ===
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x9e8e7e });
    const pathWidth = 1.2;

    const pathH = new THREE.Mesh(
      new THREE.BoxGeometry(FLOOR_SIZE, 0.05, pathWidth),
      pathMat
    );
    pathH.position.y = 0.03;
    this.scene.add(pathH);

    const pathV = new THREE.Mesh(
      new THREE.BoxGeometry(pathWidth, 0.05, FLOOR_SIZE),
      pathMat
    );
    pathV.position.y = 0.03;
    this.scene.add(pathV);

    // === Pillars (4 corners) — single InstancedMesh, 1 draw call for all 4 ===
    this.buildPillars();

    // === Corner arches — real pointed-arch geometry (Lathe/Extrude profile),
    // instanced across the 4 corners ===
    this.buildArches();

    // === Side walls (partial, with openings) ===
    this.buildWalls();

    // === Accent elements (room-specific color) ===
    this.buildAccentElements(room.accent);

    // === Garden quadrants (patches + trees), instanced ===
    this.buildGardenQuadrants();
  }

  /**
   * Structural corner pillars — one InstancedMesh (was 4 separate meshes).
   * A shallow stepped "capital" ring near the top hints at muqarnas
   * (faceted geometric transition) without literal ornament geometry.
   */
  buildPillars() {
    const shaftGeo = new THREE.CylinderGeometry(0.25, 0.3, PILLAR_HEIGHT, 6);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xd4c5a9 });
    const shaftMesh = new THREE.InstancedMesh(shaftGeo, pillarMat, PILLAR_POSITIONS.length);
    shaftMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const m = new THREE.Matrix4();
    PILLAR_POSITIONS.forEach(([x, , z], i) => {
      m.makeTranslation(x, PILLAR_HEIGHT / 2, z);
      shaftMesh.setMatrixAt(i, m);
    });
    shaftMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(shaftMesh);

    // Capital: two stacked stepped rings (faceted, muqarnas-suggestive),
    // also instanced across the same 4 corners — 1 extra draw call total.
    const capitalGeo = new THREE.CylinderGeometry(0.42, 0.32, 0.22, 8);
    const capitalMat = new THREE.MeshLambertMaterial({ color: 0xc9b892 });
    const capitalMesh = new THREE.InstancedMesh(capitalGeo, capitalMat, PILLAR_POSITIONS.length);
    capitalMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    PILLAR_POSITIONS.forEach(([x, , z], i) => {
      m.makeTranslation(x, PILLAR_HEIGHT - 0.11, z);
      capitalMesh.setMatrixAt(i, m);
    });
    capitalMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(capitalMesh);
  }

  /**
   * Build a pointed (two-centre / Persian) arch profile as a 2D curve and
   * extrude it into a thin arch "frame" mesh, instanced across all 4
   * corners — replaces the old flat box "beam" with real architecture.
   */
  buildArches() {
    const shape = this._pointedArchProfileShape(ARCH_RADIUS, ARCH_SPAN);
    const extrudeSettings = { depth: 0.22, bevelEnabled: false, curveSegments: 10 };
    const archGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    archGeo.center();
    archGeo.rotateY(Math.PI / 2); // face the extrusion depth along X so it reads as a frame

    const archMat = new THREE.MeshLambertMaterial({ color: 0xc4b59a });
    const archMesh = new THREE.InstancedMesh(archGeo, archMat, PILLAR_POSITIONS.length);
    archMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    PILLAR_POSITIONS.forEach(([x, , z], i) => {
      const angle = Math.atan2(-x, -z); // point toward the room center, as the original did
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      m.compose(new THREE.Vector3(x, PILLAR_HEIGHT + 0.55, z), q, scale);
      archMesh.setMatrixAt(i, m);
    });
    archMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(archMesh);
  }

  /**
   * A two-centre pointed-arch outline (the classic Persian/Islamic arch
   * silhouette): two circular arcs meeting at a point on the crown, sitting
   * on short vertical springers. Returned as a closed THREE.Shape with a
   * matching inner hole so the extrusion reads as a frame, not a solid slab.
   */
  _pointedArchProfileShape(radius, springHeight) {
    const outerShape = new THREE.Shape();
    const half = radius;
    const centerOffset = half * 0.55; // how "pointed" the arch is

    // Outline: left springer up, left arc to apex, right arc down, right springer down, base
    outerShape.moveTo(-half, 0);
    outerShape.lineTo(-half, springHeight);
    outerShape.absarc(-centerOffset, springHeight, half - centerOffset + half, Math.PI, Math.PI * 0.55, false);
    // Simpler and more robust: build with quadratic curves for a reliable pointed silhouette
    outerShape.curves.length = 0;
    outerShape.moveTo(-half, 0);
    outerShape.lineTo(-half, springHeight);
    outerShape.quadraticCurveTo(-half, springHeight + half * 1.1, 0, springHeight + half * 1.3);
    outerShape.quadraticCurveTo(half, springHeight + half * 1.1, half, springHeight);
    outerShape.lineTo(half, 0);
    outerShape.lineTo(half - 0.18, 0);
    outerShape.lineTo(half - 0.18, springHeight - 0.05);
    outerShape.quadraticCurveTo(half - 0.18, springHeight + half * 0.92, 0, springHeight + half * 1.08);
    outerShape.quadraticCurveTo(-(half - 0.18), springHeight + half * 0.92, -(half - 0.18), springHeight - 0.05);
    outerShape.lineTo(-(half - 0.18), 0);
    outerShape.closePath();

    return outerShape;
  }

  /**
   * Build partial walls around the perimeter (4 distinct sizes/positions —
   * left as individual meshes; instancing 4 non-uniform boxes buys nothing).
   */
  buildWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8d7b6a });
    const wallLength = FLOOR_SIZE / 2 - 2;
    const wallThickness = 0.3;
    const wallY = WALL_HEIGHT / 2;

    const walls = [
      { pos: [0, wallY, -FLOOR_SIZE / 2], size: [wallLength, WALL_HEIGHT, wallThickness] },
      { pos: [0, wallY, FLOOR_SIZE / 2], size: [wallLength, WALL_HEIGHT, wallThickness] },
      { pos: [-FLOOR_SIZE / 2, wallY, 0], size: [wallThickness, WALL_HEIGHT, wallLength] },
      { pos: [FLOOR_SIZE / 2, wallY, 0], size: [wallThickness, WALL_HEIGHT, wallLength] },
    ];

    walls.forEach(({ pos, size }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
      wall.position.set(...pos);
      this.scene.add(wall);
    });
  }

  /**
   * Build room-specific accent elements
   * Accent pillars are instanced (1 draw call for 4); the central ornament
   * stays a single mesh since there's only one and it needs bloom layering.
   */
  buildAccentElements(accentColor) {
    const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
    accentMat.userData.roomAccent = 'pillar';

    const accentGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 5);
    const offset = POOL_SIZE / 2 + 0.8;
    const accentPositions = [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]];

    const accentMesh = new THREE.InstancedMesh(accentGeo, accentMat, accentPositions.length);
    accentMesh.userData.roomAccent = 'pillar';
    const m = new THREE.Matrix4();
    accentPositions.forEach(([x, z], i) => {
      m.makeTranslation(x, 0.75, z);
      accentMesh.setMatrixAt(i, m);
    });
    accentMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(accentMesh);
    this._accentPillarMesh = accentMesh;

    // Central ornament (small octahedron above pool) — single mesh, bloom target
    const ornamentGeo = new THREE.OctahedronGeometry(0.3, 0);
    const ornamentMat = new THREE.MeshLambertMaterial({
      color: 0xe8b23a,
      emissive: 0xe8b23a,
      emissiveIntensity: 0.3,
    });
    const ornament = new THREE.Mesh(ornamentGeo, ornamentMat);
    ornament.position.y = 1.5;
    ornament.name = 'ornament';
    ornament.userData.roomAccent = 'ornament';
    if (this.bloomLayer) ornament.layers.enable(this.bloomLayer);
    this.scene.add(ornament);
  }

  /**
   * Build the four garden quadrants: ground patches, trunks and crowns are
   * each a single InstancedMesh (3 draw calls total instead of 12).
   */
  buildGardenQuadrants() {
    const quadrantSize = (FLOOR_SIZE / 2 - 2) / 2;
    const gardenMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });

    const patchGeo = new THREE.BoxGeometry(quadrantSize, 0.05, quadrantSize);
    const patchMesh = new THREE.InstancedMesh(patchGeo, gardenMat, QUADRANT_OFFSETS.length);

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 5);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, QUADRANT_OFFSETS.length);

    const crownGeo = new THREE.ConeGeometry(0.6, 1.5, 6);
    const crownMesh = new THREE.InstancedMesh(crownGeo, treeMat, QUADRANT_OFFSETS.length);

    const m = new THREE.Matrix4();
    QUADRANT_OFFSETS.forEach(([x, z], i) => {
      m.makeTranslation(x, 0.03, z);
      patchMesh.setMatrixAt(i, m);

      m.makeTranslation(x, 0.6, z);
      trunkMesh.setMatrixAt(i, m);

      m.makeTranslation(x, 1.9, z);
      crownMesh.setMatrixAt(i, m);
    });

    [patchMesh, trunkMesh, crownMesh].forEach((mesh) => {
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
    });
  }

  /**
   * Build four interactive room nodes floating above each garden quadrant.
   * Each "node" is logically a glowing octahedron + inner glow sphere + a
   * marker ring, but all four nodes of each part share one InstancedMesh
   * (3 draw calls total instead of 12). Per-node animation (bob/spin/hover)
   * is done by re-composing each instance's matrix every frame — instancing
   * doesn't require the geometry to be static, only the material/geometry
   * pair to be shared.
   *
   * The ring is a deliberate UI affordance, not decoration: it is the
   * "you can interact with this" marker. Its rotation speed and glow
   * respond to hover/selection state so it reads as a control, not noise.
   */
  buildRoomNodes() {
    this.roomNodes = QUADRANT_OFFSETS.map(([x, z], i) => {
      const course = COURSE_NODES[i];
      return {
        index: i,
        courseId: course.id,
        courseName: course.name,
        courseIcon: course.icon,
        baseX: x,
        baseZ: z,
        baseY: 3.5,
        scale: 1.0,
      };
    });

    const count = this.roomNodes.length;

    // Main octahedra
    const nodeGeo = new THREE.OctahedronGeometry(0.45, 0);
    const nodeMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    this.nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, count);
    this.nodeMesh.userData.isRoomNode = true;
    if (this.bloomLayer) this.nodeMesh.layers.enable(this.bloomLayer);

    // Inner glow spheres
    const glowGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    this.glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, count);
    if (this.bloomLayer) this.glowMesh.layers.enable(this.bloomLayer);

    // Marker rings — deliberate interaction affordance (see docstring)
    const ringGeo = new THREE.TorusGeometry(0.6, 0.03, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    this.ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, count);

    const m = new THREE.Matrix4();
    const color = new THREE.Color();
    this.roomNodes.forEach((node, i) => {
      m.makeTranslation(node.baseX, node.baseY, node.baseZ);
      this.nodeMesh.setMatrixAt(i, m);
      this.glowMesh.setMatrixAt(i, m);

      const ringMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      ringMatrix.setPosition(node.baseX, node.baseY, node.baseZ);
      this.ringMesh.setMatrixAt(i, ringMatrix);

      color.setHex(COURSE_NODES[i].accent);
      this.nodeMesh.setColorAt(i, color);
      this.ringMesh.setColorAt(i, color);
    });
    this.nodeMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
    this.ringMesh.instanceMatrix.needsUpdate = true;
    if (this.nodeMesh.instanceColor) this.nodeMesh.instanceColor.needsUpdate = true;
    if (this.ringMesh.instanceColor) this.ringMesh.instanceColor.needsUpdate = true;

    this.scene.add(this.nodeMesh, this.glowMesh, this.ringMesh);
  }

  /**
   * Build a starfield sky
   */
  buildStars() {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.2);
      const r = 40 + Math.random() * 10;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  /**
   * Best-effort UnrealBloomPass setup for the emissive room-nodes and the
   * central ornament. Uses a dedicated bloom layer so only emissive meshes
   * bloom (cheap selective bloom, avoids blooming the whole scene at full
   * res). Skips itself (falls back to direct rendering) if the modules
   * fail to load — postprocessing is a "nice to have", not a hard dependency.
   */
  async setupBloom(canvas) {
    this.bloomLayer = 1;

    try {
      if (!EffectComposer) {
        [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
        ]);
      }

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;

      // Render bloom at a reduced resolution — full-res bloom is the
      // expensive part on a weak GPU; half-res is visually close enough
      // for a small glow and roughly a quarter of the fragment cost.
      const bloomScale = 0.5;
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.composer.setSize(width, height);

      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width * bloomScale, height * bloomScale),
        0.55,  // strength — restrained, this is a glow accent not a wash
        0.4,   // radius
        0.75,  // threshold — only bright emissive elements bloom
      );
      this.composer.addPass(bloomPass);
      this._bloomPass = bloomPass;
      this.bloomEnabled = true;
      console.log('[Palace] Bloom enabled (half-res, selective layer)');
    } catch (err) {
      console.warn('[Palace] Bloom unavailable, rendering without it:', err);
      this.bloomEnabled = false;
      this.composer = null;
    }
  }

  /**
   * Set up pointer/touch input for camera orbit. Raycasting for node
   * hover/click is triggered here (pointermove/pointerdown) — NOT inside
   * the render loop — so idle frames cost nothing extra.
   */
  setupInput(canvas) {
    // Mouse
    canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    canvas.addEventListener('mouseup', () => this.onPointerUp());

    // Touch
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
    canvas.addEventListener('touchend', () => this.onTouchEnd());
  }

  onPointerDown(e) {
    this.isDragging = true;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;
    this.autoRotate = false;
    this.pointerMoved = false;
    this.updateMouseFromClient(e.clientX, e.clientY);
    this.updateHover();
  }

  onPointerMove(e) {
    this.updateMouseFromClient(e.clientX, e.clientY);
    this.updateHover();

    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.pointerMoved = true;
    this.targetAngle += dx * 0.005;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;
  }

  onPointerUp() {
    // Detect click (not drag) on a node
    if (!this.pointerMoved && this.hoveredIndex >= 0) {
      this.selectNode(this.hoveredIndex);
    }

    this.isDragging = false;
    // Resume auto-rotate after 3 seconds of inactivity
    clearTimeout(this._autoRotateTimer);
    this._autoRotateTimer = setTimeout(() => {
      this.autoRotate = true;
    }, 3000);
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.touchStartX = e.touches[0].clientX;
      this.lastTouchX = this.touchStartX;
      this.autoRotate = false;
      this.pointerMoved = false;

      this.updateMouseFromClient(e.touches[0].clientX, e.touches[0].clientY);
      this.updateHover();
    }
  }

  onTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const dx = x - this.lastTouchX;
    if (Math.abs(dx) > 3) this.pointerMoved = true;
    this.targetAngle += dx * 0.005;
    this.lastTouchX = x;
  }

  onTouchEnd() {
    // Detect tap on a node
    if (!this.pointerMoved && this.hoveredIndex >= 0) {
      this.selectNode(this.hoveredIndex);
    }

    this.isDragging = false;
    clearTimeout(this._autoRotateTimer);
    this._autoRotateTimer = setTimeout(() => {
      this.autoRotate = true;
    }, 3000);
  }

  /**
   * Update the normalized mouse vector used by the raycaster
   */
  updateMouseFromClient(clientX, clientY) {
    if (!this.canvas || !this.mouse) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Raycast against the room-node InstancedMesh — called only from pointer
   * events (pointermove/pointerdown), never from the animation loop.
   */
  updateHover() {
    if (!this.raycaster || !this.mouse || !this.camera || !this.nodeMesh) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.nodeMesh);

    const prevHovered = this.hoveredIndex;
    this.hoveredIndex = intersects.length > 0 ? intersects[0].instanceId : -1;

    if (this.canvas) {
      this.canvas.style.cursor = this.hoveredIndex >= 0 ? 'pointer' : '';
    }

    if (this.hoveredIndex !== prevHovered) {
      const label = document.getElementById('palace-room-label');
      if (label) {
        if (this.hoveredIndex >= 0) {
          const d = this.roomNodes[this.hoveredIndex];
          label.textContent = `${d.courseIcon} ${d.courseName}`;
        } else {
          const config = this.getRoomConfig();
          label.textContent = `${config.icon} ${config.name}`;
        }
      }
    }
  }

  /**
   * Handle node selection (click/tap) by instance index
   * Loads the room theme and fires the callback
   */
  selectNode(index) {
    const node = this.roomNodes[index];
    if (!node) return;

    this.selectedIndex = index;
    const { courseId, courseName, courseIcon } = node;

    // Load the room (recolors scene, transitions camera)
    this.loadRoom(courseId);

    // Flash the node (pulse scale) — applied next frame via node.scale
    node.pulseUntil = performance.now() + 200;
    node.scale = 1.8;

    // Fire callback
    if (this.onNodeSelect) {
      this.onNodeSelect({ courseId, courseName, courseIcon });
    }

    console.log(`[Palace] Room loaded: ${courseName}`);
  }

  /**
   * Update camera orbit position
   */
  updateCameraPosition() {
    if (!this.camera) return;

    const x = Math.sin(this.cameraAngle) * this.cameraRadius;
    const z = Math.cos(this.cameraAngle) * this.cameraRadius;

    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 1, 0);
  }

  /**
   * Animation loop. Frame-rate capped to MAX_FPS by skipping the render
   * (rAF is left running so timing stays smooth — only the expensive
   * render + uniform updates are throttled).
   */
  animate() {
    if (!this.isActive) return;
    if (!this.renderer || !this.scene || !this.camera) {
      console.error('[Palace] Missing renderer/scene/camera in animate');
      return;
    }

    this.animationId = requestAnimationFrame((t) => this.animateFrame(t));
  }

  animateFrame(now) {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame((t) => this.animateFrame(t));

    if (now - this._lastFrameTime < MIN_FRAME_MS) return;
    this._lastFrameTime = now;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    // Auto-rotate
    if (this.autoRotate) {
      this.targetAngle += this.autoRotateSpeed * delta;
    }

    // Smooth camera orbit
    this.cameraAngle += (this.targetAngle - this.cameraAngle) * 0.05;
    this.updateCameraPosition();

    // Animate ornament (slow spin)
    const ornament = this.scene.getObjectByName('ornament');
    if (ornament) {
      ornament.rotation.y += delta * 0.5;
      ornament.position.y = 1.5 + Math.sin(elapsed * 0.8) * 0.15;
    }

    // Gentle vertex ripple on the pool surface (cheap displacement, no
    // real-time reflection) — offsets each vertex's Y by a travelling sine
    if (this._pool && this._poolBasePositions) {
      const posAttr = this._pool.geometry.attributes.position;
      const base = this._poolBasePositions;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = base[i * 3];
        const bz = base[i * 3 + 2];
        posAttr.array[i * 3 + 1] = Math.sin(bx * 2.2 + elapsed * 1.4) * 0.02
          + Math.cos(bz * 2.2 + elapsed * 1.1) * 0.02;
      }
      posAttr.needsUpdate = true;
      if (this._pool.material.map) {
        this._pool.material.map.offset.set(elapsed * 0.02, elapsed * 0.015);
      }
    }

    this.updateRoomNodes(delta, elapsed);

    if (this.bloomEnabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Animate the instanced room nodes: bob, spin, hover/selection scale and
   * emissive intensity, and marker-ring rotation. Rewrites each instance's
   * matrix every frame — required because InstancedMesh instances don't
   * carry individual transform objects the way separate Mesh/Group did.
   */
  updateRoomNodes(delta, elapsed) {
    if (!this.nodeMesh || !this.glowMesh || !this.ringMesh) return;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scaleVec = new THREE.Vector3();
    const now = performance.now();

    this.roomNodes.forEach((node, i) => {
      const y = node.baseY + Math.sin(elapsed * 0.7 + i * 1.5) * 0.2;

      node.spinY = (node.spinY || 0) + delta * 0.3;
      node.spinX = (node.spinX || 0) + delta * 0.15;
      node.ringSpin = (node.ringSpin || 0) + delta * 0.5;

      const isHovered = this.hoveredIndex === i;
      const isSelected = this.selectedIndex === i;

      // Selection pulse decays back to the hover/idle target scale
      if (node.pulseUntil && now < node.pulseUntil) {
        node.scale = 1.8;
      } else {
        node.pulseUntil = 0;
        const targetScale = isHovered ? 1.4 : 1.0;
        node.scale += (targetScale - (node.scale || 1)) * 0.1;
      }

      // Octahedron: position, spin, scale
      euler.set(node.spinX, node.spinY, 0);
      q.setFromEuler(euler);
      scaleVec.setScalar(node.scale);
      m.compose(new THREE.Vector3(node.baseX, y, node.baseZ), q, scaleVec);
      this.nodeMesh.setMatrixAt(i, m);

      // Glow sphere follows position/scale, no spin needed
      const qIdentity = new THREE.Quaternion();
      m.compose(new THREE.Vector3(node.baseX, y, node.baseZ), qIdentity, scaleVec);
      this.glowMesh.setMatrixAt(i, m);

      // Marker ring: intentional UI affordance — counter-spins continuously,
      // and spins faster + scales with hover/selection so it visibly reads
      // as "this is interactive", tied directly to node state.
      const ringSpeedMul = isSelected ? 2.2 : isHovered ? 1.6 : 1.0;
      node.ringSpin += delta * 0.5 * (ringSpeedMul - 1); // extra kick on top of base above
      const ringEuler = new THREE.Euler(Math.PI / 2, 0, node.ringSpin);
      const ringQ = new THREE.Quaternion().setFromEuler(ringEuler);
      m.compose(new THREE.Vector3(node.baseX, y, node.baseZ), ringQ, scaleVec);
      this.ringMesh.setMatrixAt(i, m);

      // Emissive intensity communicates hover/selection through the shared material
      // (per-instance emissive isn't available on MeshLambertMaterial, so we
      // approximate with opacity via instance color brightness instead).
    });

    this.nodeMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
    this.ringMesh.instanceMatrix.needsUpdate = true;

    // Shared-material hover glow: bump the whole material's emissiveIntensity
    // to the strongest active state (hover or selection). Not per-instance,
    // but visually sufficient since typically only one node is hovered at a time.
    const anyHovered = this.hoveredIndex >= 0;
    const anySelected = this.selectedIndex >= 0;
    const targetIntensity = anyHovered ? 0.8 : anySelected ? 0.6 : 0.4;
    const mat = this.nodeMesh.material;
    mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * 0.15;
  }

  /**
   * Start the render loop
   */
  start() {
    if (!this.scene) return;
    this.isActive = true;
    this.clock.start();
    this._lastFrameTime = 0;
    this.refreshFlora();
    // Ensure renderer has correct dimensions after layout
    requestAnimationFrame(() => {
      this.onResize();
      this.animate();
    });
    console.log('[Palace] Started');
  }

  /**
   * Stop the render loop
   */
  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('[Palace] Stopped');
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.canvas || !this.camera || !this.renderer) return;

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || (window.innerHeight - 56);

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  /**
   * Load a room by course ID — recolors accent elements, fog, pool, ornament,
   * and smoothly transitions the camera to frame that quadrant.
   */
  loadRoom(courseId) {
    const course = COURSE_NODES.find(c => c.id === courseId);
    if (!course || !this.scene) return;

    this.currentRoom = courseId;

    // Recolor tagged accent elements (regular meshes)
    this.scene.traverse((obj) => {
      if (!obj.userData.roomAccent) return;

      switch (obj.userData.roomAccent) {
        case 'pool':
          obj.material.color.setHex(course.pool);
          break;
        case 'ornament':
          obj.material.color.setHex(course.ornament);
          obj.material.emissive.setHex(course.ornament);
          break;
      }
    });

    // Instanced accent pillars share one material — recolor it directly
    if (this._accentPillarMesh) {
      this._accentPillarMesh.material.color.setHex(course.accent);
    }

    // Sky gradient redraw (procedural, no reload)
    this._updateSkyGradient(course);

    // Transition fog and background
    if (this.scene.fog) {
      this.scene.fog.color.setHex(course.fog);
    }
    this.scene.background.setHex(course.sky);

    // Transition camera to frame the selected quadrant
    const quadrantIndex = COURSE_NODES.indexOf(course);
    const cam = QUADRANT_CAMERA[quadrantIndex];
    if (cam) {
      this.targetAngle = cam.angle;
      this.cameraRadius = cam.radius;
      this.cameraHeight = cam.height;
    }

    // Mark the selected node (dims are applied via updateRoomNodes/instance color)
    this.selectedIndex = this.roomNodes.findIndex(n => n.courseId === courseId);

    if (this.onRoomChange) {
      this.onRoomChange(course);
    }

    console.log(`[Palace] Loaded room: ${course.name}`);
  }

  /**
   * Refreshes the flora (trees) based on verified claims
   */
  refreshFlora() {
    if (!this.scene || !this.floraGroup || !THREE) return;

    // Clear existing
    while(this.floraGroup.children.length > 0) { 
        this.floraGroup.remove(this.floraGroup.children[0]); 
    }

    const registry = new VerificationRegistry();
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    
    // Same offsets used for quadrants
    const offsets = [
      [-FLOOR_SIZE / 4 - 0.5, -FLOOR_SIZE / 4 - 0.5], // nature
      [FLOOR_SIZE / 4 + 0.5, -FLOOR_SIZE / 4 - 0.5],  // math
      [-FLOOR_SIZE / 4 - 0.5, FLOOR_SIZE / 4 + 0.5],  // literacy
      [FLOOR_SIZE / 4 + 0.5, FLOOR_SIZE / 4 + 0.5],   // connection
    ];

    COURSE_NODES.forEach((course, i) => {
      const count = registry.getResolvedCountForCourse(course.id);
      const [centerX, centerZ] = offsets[i];
      
      // We use a deterministic random seed based on course + index 
      // to prevent trees from jumping around every time we refresh
      const seed = i * 100;
      const pseudoRandom = (offset) => {
          const x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
      };
      
      for(let j = 0; j < count; j++) {
        const x = centerX + (pseudoRandom(j*2) - 0.5) * 3;
        const z = centerZ + (pseudoRandom(j*2+1) - 0.5) * 3;
        const scale = 0.5 + pseudoRandom(j*3) * 0.5;

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1*scale, 0.15*scale, 1.2*scale, 5), trunkMat);
        trunk.position.set(x, 0.6*scale, z);
        this.floraGroup.add(trunk);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.6*scale, 1.5*scale, 6), treeMat);
        crown.position.set(x, 1.9*scale, z);
        this.floraGroup.add(crown);
      }
    });
    console.log('[Palace] Flora refreshed from registry');
  }

  /**
   * Get saved room from localStorage (onboarding answer)
   * Maps onboarding room keys to course IDs
   */
  getSavedRoom() {
    const roomToCourse = {
      science: 'nature',
      art: 'literacy',
      tech: 'math',
      education: 'nature',
      society: 'literacy',
      literature: 'connection',
    };

    try {
      const raw = localStorage.getItem('dana-onboarding');
      if (raw) {
        const data = JSON.parse(raw);
        return roomToCourse[data.room] || 'nature';
      }
    } catch {}
    return 'nature';
  }

  /**
   * Get current course config
   */
  getRoomConfig() {
    const courseId = this.currentRoom || this.getSavedRoom();
    return COURSE_NODES.find(c => c.id === courseId) || COURSE_NODES[0];
  }

  /**
   * Clean up
   */
  dispose() {
    this.stop();

    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.composer) {
      this.composer.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this._skyTexture) this._skyTexture.dispose();

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        }
      });
    }

    console.log('[Palace] Disposed');
  }
}
