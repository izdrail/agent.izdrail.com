import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

/**
 * three.js
 * setup()
 */
export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;
  private _glbScene?: THREE.Group;
  private _keys: Record<string, boolean> = {};
  private _labelRenderer?: CSS2DRenderer;

  public onWorldInteraction?: (id: string) => void;
  private _raycaster: THREE.Raycaster;
  private _mouse: THREE.Vector2;
  private _clickableObjects: THREE.Mesh[] = [];
  private _glbLoadId: number = 0;

  constructor() {
    this.isReady = false;

    // scene
    const scene = new THREE.Scene();
    this._scene = scene;

    // Label Renderer (for in-world UI)
    if (typeof window !== "undefined") {
      this._labelRenderer = new CSS2DRenderer();
      this._labelRenderer.setSize(window.innerWidth, window.innerHeight);
      this._labelRenderer.domElement.style.position = 'absolute';
      this._labelRenderer.domElement.style.top = '0px';
      this._labelRenderer.domElement.style.pointerEvents = 'none';
    }

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // animate
    this._clock = new THREE.Clock();
    this._clock.start();

    // keyboard listeners
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => (this._keys[e.code] = true));
      window.addEventListener("keyup", (e) => (this._keys[e.code] = false));
      window.addEventListener("pointerdown", this._onPointerDown.bind(this));
    }

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
  }

  public loadVrm(url: string, scale: number = 1.0, position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }): Promise<void> {
    if (this.model?.scene) {
      this.unloadVRM();
    }

    // gltf and vrm
    const newModel = new Model(this._camera || new THREE.Object3D());
    this.model = newModel;
    return newModel.loadVRM(url).then(async () => {
      // Unloaded explicitly or superseded by another load while loading
      if (this.model !== newModel) {
        newModel.unLoadVrm();
        return;
      }
      if (!this.model?.scene) return;

      // Disable frustum culling
      this.model.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

      // Apply scaling and positioning to the character
      this.model.scene.scale.set(scale, scale, scale);
      this.model.scene.position.set(position.x, position.y, position.z);

      this._scene.add(this.model.scene);

      if (this.model.vrm) {
        const vrma = await loadVRMAnimation(buildUrl("/idle_loop.vrma"));
        if (vrma) this.model.loadAnimation(vrma);
      }

      // HACK:
      requestAnimationFrame(() => {
        this.resetCamera();
      });
    });
  }

  public loadGlb(url: string, scale: number = 1.0, position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }): Promise<void> {
    this._glbLoadId++;
    const currentLoadId = this._glbLoadId;

    // Remove any previously loaded GLB
    if (this._glbScene) {
      this._scene.remove(this._glbScene);
      this._glbScene = undefined;
    }

    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          // If a new load was initiated while we were fetching this one, discard the old one
          if (this._glbLoadId !== currentLoadId) return resolve();

          this._glbScene = gltf.scene;
          // Enable frustum culling (huge performance gain for 370MB models)
          this._glbScene.traverse((obj) => {
            obj.frustumCulled = true;
          });

          // Apply scale and position
          this._glbScene.scale.set(scale, scale, scale);
          this._glbScene.position.set(position.x, position.y, position.z);

          this._scene.add(this._glbScene);
          console.log("GLB model loaded:", url);
          resolve();
        },
        undefined,
        (error) => {
          console.error("Error loading GLB model:", error);
          reject(error);
        }
      );
    });
  }

  public unloadVRM(): void {
    if (this.model?.scene) {
      this._scene.remove(this.model.scene);
      this.model?.unLoadVrm();
    }
  }

  /**
   * React
   */
  public setup(canvas: HTMLCanvasElement) {
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth || canvas.width;
    const height = parentElement?.clientHeight || canvas.height;
    // Optimized renderer for large models and high-res tablets
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance on high-DPI tablets

    // camera
    this._camera = new THREE.PerspectiveCamera(25.0, width / height, 0.1, 1000.0);
    this._camera.position.set(-2.25, 1.0, 2.75);

    // camera controls
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.target.set(0, 0, 0);
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();

    window.addEventListener("resize", () => {
      this.resize();
    });

    if (this._labelRenderer && parentElement) {
      this._labelRenderer.setSize(width, height);
      this._labelRenderer.domElement.style.zIndex = '50';
      parentElement.appendChild(this._labelRenderer.domElement);
    }

    this.isReady = true;
    this.update();
  }

  /**
   * canvas
   */
  public resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    if (!this._camera) return;
    this._camera.aspect =
      parentElement.clientWidth / parentElement.clientHeight;
    this._camera.updateProjectionMatrix();

    if (this._labelRenderer) {
      this._labelRenderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
    }
  }

  /**
   * VRM camera reset head position
   */
  public resetCamera() {
    const vrm = this.model?.vrm as any;
    const headNode = vrm?.humanoid?.getNormalizedBoneNode("head");

    if (headNode) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      this._camera?.position.set(
        this._camera.position.x,
        headWPos.y,
        this._camera.position.z
      );
      this._cameraControls?.target.set(headWPos.x, headWPos.y, headWPos.z);
      this._cameraControls?.update();
    }
  }

  public addWorldUI(id: string, element: HTMLElement, position: { x: number, y: number, z: number }) {
    // Remove if already exists
    const existing = this._scene.getObjectByName(id);
    if (existing) this._scene.remove(existing);

    const label = new CSS2DObject(element);
    label.name = id;
    label.position.set(position.x, position.y, position.z);
    this._scene.add(label);

    // Ensure element itself has pointer events
    element.style.pointerEvents = 'auto';
  }

  public clearClickableSpheres() {
    for (const obj of this._clickableObjects) {
      this._scene.remove(obj);
    }
    this._clickableObjects = [];
  }

  public addClickableSphere(id: string, position: { x: number, y: number, z: number }, colorHex: number, radius = 0.25) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    sphere.userData.id = id;
    this._scene.add(sphere);
    this._clickableObjects.push(sphere);
  }

  private _onPointerDown(event: PointerEvent) {
    if (!this._camera || !this._renderer) return;

    const rect = this._renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._clickableObjects, false);

    if (intersects.length > 0) {
      const first = intersects[0].object;
      if (first.userData && first.userData.id && this.onWorldInteraction) {
        this.onWorldInteraction(first.userData.id);
      }
    }
  }

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();

    // update movement
    if (this.model?.scene && this._camera) {
      const moveSpeed = 2.0; // Units per second
      const moveVector = new THREE.Vector3(0, 0, 0);

      if (this._keys["KeyW"]) moveVector.z -= 1;
      if (this._keys["KeyS"]) moveVector.z += 1;
      if (this._keys["KeyA"]) moveVector.x -= 1;
      if (this._keys["KeyD"]) moveVector.x += 1;

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();

        // Get camera forward direction (projected on XZ plane)
        const forward = new THREE.Vector3();
        this._camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Calculate final move direction
        const direction = new THREE.Vector3();
        direction.addScaledVector(forward, -moveVector.z);
        direction.addScaledVector(right, moveVector.x);

        // Update character position
        this.model.scene.position.addScaledVector(direction, moveSpeed * delta);

        // Rotate character to face movement direction
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.model.scene.rotation.y = targetRotation;

        // Update camera target to follow character
        if (this._cameraControls) {
          this._cameraControls.target.copy(this.model.scene.position);
          this._cameraControls.target.y += 1.3; // Aim at head height
          this._cameraControls.update();
        }
      }
    }

    // update vrm components
    if (this.model) {
      this.model.update(delta);
    }

    if (this._cameraControls) {
      this._cameraControls.update();
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }

    if (this._labelRenderer && this._camera) {
      this._labelRenderer.render(this._scene, this._camera);
    }
  };
}
