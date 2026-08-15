/**
 * palace.js — 3D Chahar Bagh Mind Palace
 *
 * A procedural, low-poly Persian four-fold garden rendered in Three.js.
 * Designed for sub-$100 Android Go: no textures, no real-time lights,
 * vertex-lit only, <5000 triangles per room.
 *
 * Three.js is dynamically imported — loaded only when the palace opens.
 */

import { VerificationRegistry } from '../verification/registry.js';

let THREE = null;

// Mesh budget per BUILD_GUIDE.md: 5000 tris / room, 30k total scene
const FLOOR_SIZE = 16;
const POOL_SIZE = 3;
const PILLAR_HEIGHT = 4;
const WALL_HEIGHT = 3.5;
const ARCH_RADIUS = 1.8;

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

    // Interactive room nodes
    this.roomNodes = [];
    this.raycaster = null;
    this.mouse = null;
    this.hoveredNode = null;
    this.selectedNode = null;

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
    // "No real-time lights. All lighting baked or vertex-shaded."
    // Using one directional for the hackathon MVP; vertex shading for production.
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.6);
    dirLight.position.set(5, 8, 3);
    this.scene.add(dirLight);

    // Ambient — subtle fill
    const ambientLight = new THREE.AmbientLight(0x334455, 0.4);
    this.scene.add(ambientLight);

    // Build the Chahar Bagh room
    this.buildRoom();

    // === Dynamic flora layer ===
    this.floraGroup = new THREE.Group();
    this.scene.add(this.floraGroup);

    // Interactive room nodes above each quadrant
    this.buildRoomNodes();

    // Stars
    this.buildStars();

    // Raycaster for node interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Input handlers
    this.setupInput(canvas);

    // Resize handler
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(canvas);

    console.log('[Palace] Initialised');
  }

  /**
   * Build the Chahar Bagh (four-fold garden) room
   * All geometry is procedural — no loaded assets
   */
  buildRoom() {
    const room = this.getRoomConfig();

    // === Ground ===
    const groundGeo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x2a1f14 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);

    // === Central pool ===
    const poolGeo = new THREE.BoxGeometry(POOL_SIZE, 0.15, POOL_SIZE);
    const poolMat = new THREE.MeshLambertMaterial({
      color: 0x1a5276,
      transparent: true,
      opacity: 0.8,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = 0.08;
    pool.userData.roomAccent = 'pool';
    this.scene.add(pool);

    // Pool border
    const borderGeo = new THREE.BoxGeometry(POOL_SIZE + 0.4, 0.25, POOL_SIZE + 0.4);
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.12;
    this.scene.add(border);

    // === Pathways (cross pattern) ===
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x9e8e7e });
    const pathWidth = 1.2;

    // Horizontal path
    const pathH = new THREE.Mesh(
      new THREE.BoxGeometry(FLOOR_SIZE, 0.05, pathWidth),
      pathMat
    );
    pathH.position.y = 0.03;
    this.scene.add(pathH);

    // Vertical path
    const pathV = new THREE.Mesh(
      new THREE.BoxGeometry(pathWidth, 0.05, FLOOR_SIZE),
      pathMat
    );
    pathV.position.y = 0.03;
    this.scene.add(pathV);

    // === Pillars (4 corners) ===
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, PILLAR_HEIGHT, 6);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xd4c5a9 });
    const pillarPositions = [
      [-FLOOR_SIZE / 2 + 1, 0, -FLOOR_SIZE / 2 + 1],
      [FLOOR_SIZE / 2 - 1, 0, -FLOOR_SIZE / 2 + 1],
      [-FLOOR_SIZE / 2 + 1, 0, FLOOR_SIZE / 2 - 1],
      [FLOOR_SIZE / 2 - 1, 0, FLOOR_SIZE / 2 - 1],
    ];

    pillarPositions.forEach(([x, _, z]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, PILLAR_HEIGHT / 2, z);
      this.scene.add(pillar);
    });

    // === Corner arches (low-poly semicircles) ===
    const archMat = new THREE.MeshLambertMaterial({ color: 0xc4b59a });
    pillarPositions.forEach(([x, _, z]) => {
      this.buildArch(x, z, archMat);
    });

    // === Side walls (partial, with openings) ===
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8d7b6a });
    this.buildWalls(wallMat);

    // === Accent elements (room-specific color) ===
    this.buildAccentElements(room.accent);

    // === Garden quadrants (simple green patches) ===
    this.buildGardenQuadrants();
  }

  /**
   * Build a simple archway (semicircle from boxes)
   * Procedural, low-poly approximation
   */
  buildArch(x, z, material) {
    const archGroup = new THREE.Group();
    archGroup.position.set(x, PILLAR_HEIGHT, z);

    // Horizontal beam
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(ARCH_RADIUS * 2, 0.3, 0.3),
      material
    );
    beam.position.y = 0;
    archGroup.add(beam);

    // Point toward center
    const dx = -x;
    const dz = -z;
    const angle = Math.atan2(dx, dz);
    archGroup.rotation.y = angle;

    this.scene.add(archGroup);
  }

  /**
   * Build partial walls around the perimeter
   */
  buildWalls(material) {
    const wallLength = FLOOR_SIZE / 2 - 2;
    const wallThickness = 0.3;
    const wallY = WALL_HEIGHT / 2;

    // Four walls with gaps in the middle (like a Chahar Bagh opening)
    const walls = [
      { pos: [0, wallY, -FLOOR_SIZE / 2], size: [wallLength, WALL_HEIGHT, wallThickness] },
      { pos: [0, wallY, FLOOR_SIZE / 2], size: [wallLength, WALL_HEIGHT, wallThickness] },
      { pos: [-FLOOR_SIZE / 2, wallY, 0], size: [wallThickness, WALL_HEIGHT, wallLength] },
      { pos: [FLOOR_SIZE / 2, wallY, 0], size: [wallThickness, WALL_HEIGHT, wallLength] },
    ];

    walls.forEach(({ pos, size }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        material
      );
      wall.position.set(...pos);
      this.scene.add(wall);
    });
  }

  /**
   * Build room-specific accent elements
   * Each element is tagged with userData.roomAccent for recoloring
   */
  buildAccentElements(accentColor) {
    const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

    // Four accent pillars near the pool
    const accentGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 5);
    const offset = POOL_SIZE / 2 + 0.8;

    [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]].forEach(([x, z]) => {
      const pillar = new THREE.Mesh(accentGeo, accentMat.clone());
      pillar.position.set(x, 0.75, z);
      pillar.userData.roomAccent = 'pillar';
      this.scene.add(pillar);
    });

    // Central ornament (small octahedron above pool)
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
    this.scene.add(ornament);
  }

  /**
   * Build the four garden quadrants
   */
  buildGardenQuadrants() {
    const quadrantSize = (FLOOR_SIZE / 2 - 2) / 2;
    const gardenMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });

    const offsets = [
      [-FLOOR_SIZE / 4 - 0.5, -FLOOR_SIZE / 4 - 0.5],
      [FLOOR_SIZE / 4 + 0.5, -FLOOR_SIZE / 4 - 0.5],
      [-FLOOR_SIZE / 4 - 0.5, FLOOR_SIZE / 4 + 0.5],
      [FLOOR_SIZE / 4 + 0.5, FLOOR_SIZE / 4 + 0.5],
    ];

    offsets.forEach(([x, z]) => {
      // Green patch
      const patch = new THREE.Mesh(
        new THREE.BoxGeometry(quadrantSize, 0.05, quadrantSize),
        gardenMat
      );
      patch.position.set(x, 0.03, z);
      this.scene.add(patch);

      // Simple tree (cone + cylinder)
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 1.2, 5),
        new THREE.MeshLambertMaterial({ color: 0x5d4037 })
      );
      trunk.position.set(x, 0.6, z);
      this.scene.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 1.5, 6),
        treeMat
      );
      crown.position.set(x, 1.9, z);
      this.scene.add(crown);
    });
  }

  /**
   * Build four interactive room nodes floating above each garden quadrant
   * Each node is a glowing octahedron that bobs and can be clicked to enter
   */
  buildRoomNodes() {
    const offsets = [
      [-FLOOR_SIZE / 4 - 0.5, -FLOOR_SIZE / 4 - 0.5],
      [FLOOR_SIZE / 4 + 0.5, -FLOOR_SIZE / 4 - 0.5],
      [-FLOOR_SIZE / 4 - 0.5, FLOOR_SIZE / 4 + 0.5],
      [FLOOR_SIZE / 4 + 0.5, FLOOR_SIZE / 4 + 0.5],
    ];

    offsets.forEach(([x, z], i) => {
      const course = COURSE_NODES[i];
      const group = new THREE.Group();
      group.position.set(x, 3.5, z);
      group.userData = { courseId: course.id, courseName: course.name, courseIcon: course.icon, index: i };

      // Main octahedron
      const geo = new THREE.OctahedronGeometry(0.45, 0);
      const mat = new THREE.MeshLambertMaterial({
        color: course.accent,
        emissive: course.accent,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `node-${course.id}`;
      group.add(mesh);

      // Inner glow sphere (smaller, brighter)
      const glowGeo = new THREE.SphereGeometry(0.2, 6, 6);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);

      // Ring around the node
      const ringGeo = new THREE.TorusGeometry(0.6, 0.03, 6, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: course.accent,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      this.scene.add(group);
      this.roomNodes.push(group);
    });
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
   * Set up pointer/touch input for camera orbit
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
  }

  onPointerMove(e) {
    // Always update mouse for raycaster (even when not dragging)
    if (this.canvas && this.mouse) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.pointerMoved = true;
    this.targetAngle += dx * 0.005;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;
  }

  onPointerUp(e) {
    // Detect click (not drag) on a node
    if (!this.pointerMoved && this.hoveredNode) {
      this.selectNode(this.hoveredNode);
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

      // Update mouse position for raycaster
      this.updateMouseFromTouch(e.touches[0]);
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

  onTouchEnd(e) {
    // Detect tap on a node
    if (!this.pointerMoved && this.hoveredNode) {
      this.selectNode(this.hoveredNode);
    }

    this.isDragging = false;
    clearTimeout(this._autoRotateTimer);
    this._autoRotateTimer = setTimeout(() => {
      this.autoRotate = true;
    }, 3000);
  }

  /**
   * Update mouse vector from touch position for raycasting
   */
  updateMouseFromTouch(touch) {
    if (!this.canvas || !this.mouse) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Handle node selection (click/tap)
   * Loads the room theme and fires the callback
   */
  selectNode(node) {
    if (!node || !node.userData) return;

    this.selectedNode = node;
    const { courseId, courseName, courseIcon } = node.userData;

    // Load the room (recolors scene, transitions camera)
    this.loadRoom(courseId);

    // Flash the node (pulse scale)
    const mesh = node.children[0];
    if (mesh) {
      mesh.scale.setScalar(1.8);
      setTimeout(() => { mesh.scale.setScalar(1.0); }, 200);
    }

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
   * Animation loop
   */
  animate() {
    if (!this.isActive) return;
    if (!this.renderer || !this.scene || !this.camera) {
      console.error('[Palace] Missing renderer/scene/camera in animate');
      return;
    }

    this.animationId = requestAnimationFrame(() => this.animate());

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

    // Animate room nodes: bob, spin, and pulse on hover
    this.roomNodes.forEach((node, i) => {
      const mesh = node.children[0]; // octahedron
      const ring = node.children[2]; // ring

      // Bob up and down (offset phase per node)
      node.position.y = 3.5 + Math.sin(elapsed * 0.7 + i * 1.5) * 0.2;

      // Slow spin
      mesh.rotation.y += delta * 0.3;
      mesh.rotation.x += delta * 0.15;

      // Ring counter-spin
      ring.rotation.z += delta * 0.5;

      // Hover scale effect
      const isHovered = this.hoveredNode === node;
      const targetScale = isHovered ? 1.4 : 1.0;
      const currentScale = mesh.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      mesh.scale.setScalar(newScale);
      ring.scale.setScalar(newScale);

      // Hover glow intensity
      const mat = mesh.material;
      mat.emissiveIntensity = isHovered ? 0.8 : 0.4;
    });

    // Raycaster hover detection
    if (this.raycaster && this.mouse) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.roomNodes.map(n => n.children[0]);
      const intersects = this.raycaster.intersectObjects(meshes);

      const prevHovered = this.hoveredNode;
      this.hoveredNode = intersects.length > 0 ? intersects[0].object.parent : null;

      // Update cursor
      if (this.canvas) {
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : '';
      }

      // Update overlay label on hover
      if (this.hoveredNode !== prevHovered) {
        const label = document.getElementById('palace-room-label');
        if (label) {
          if (this.hoveredNode) {
            const d = this.hoveredNode.userData;
            label.textContent = `${d.courseIcon} ${d.courseName}`;
          } else {
            const config = this.getRoomConfig();
            label.textContent = `${config.icon} ${config.name}`;
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Start the render loop
   */
  start() {
    if (!this.scene) return;
    this.isActive = true;
    this.clock.start();
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
  }

  /**
   * Load a room by course ID — recolors accent elements, fog, pool, ornament,
   * and smoothly transitions the camera to frame that quadrant.
   */
  loadRoom(courseId) {
    const course = COURSE_NODES.find(c => c.id === courseId);
    if (!course || !this.scene) return;

    this.currentRoom = courseId;

    // Recolor tagged accent elements
    this.scene.traverse((obj) => {
      if (!obj.userData.roomAccent) return;

      switch (obj.userData.roomAccent) {
        case 'pillar':
          obj.material.color.setHex(course.accent);
          break;
        case 'pool':
          obj.material.color.setHex(course.pool);
          break;
        case 'ornament':
          obj.material.color.setHex(course.ornament);
          obj.material.emissive.setHex(course.ornament);
          break;
      }
    });

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

    // Dim the selected node, brighten others
    this.roomNodes.forEach((node) => {
      const isSelected = node.userData.courseId === courseId;
      const mat = node.children[0].material;
      mat.opacity = isSelected ? 1.0 : 0.4;
      mat.emissiveIntensity = isSelected ? 0.6 : 0.15;
    });

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

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    console.log('[Palace] Disposed');
  }
}
