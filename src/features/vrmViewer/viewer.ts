import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

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
  private _transformControls?: TransformControls;
  private _gridHelper?: THREE.GridHelper;
  private _axesHelper?: THREE.AxesHelper;
  private _isThrottled = false;

  // AI State & Aura
  public aiState: "idle" | "thinking" | "speaking" = "idle";

  // Camera Interpolation
  private _targetCamPos = new THREE.Vector3(-2.25, 1.0, 2.75);
  private _targetCamLookAt = new THREE.Vector3(0, 0, 0);
  private _camLerpSpeed = 3.0;

  // Vector pooling to avoid GC pressure
  private _tempMoveVector = new THREE.Vector3();
  private _tempForward = new THREE.Vector3();
  private _tempRight = new THREE.Vector3();
  private _tempDirection = new THREE.Vector3();
  private _tempHeadPos = new THREE.Vector3();

  public onWorldInteraction?: (id: string) => void;
  private _raycaster: THREE.Raycaster;
  private _mouse: THREE.Vector2;
  private _clickableObjects: THREE.Mesh[] = [];
  private _glbLoadId: number = 0;
  private _isUserInteracting = false;

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
    const directionalLight = new THREE.DirectionalLight(0xfff7e6, 0.7); // Warm sunlight
    directionalLight.position.set(2.0, 5.0, 3.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xe6f0ff, 0.5); // Soft blue ethereal ambient
    scene.add(ambientLight);

    // 3D Environment Helpers (Grid, Axes) — hidden until user enables tools
    this._gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
    this._gridHelper.visible = false;
    scene.add(this._gridHelper);

    this._axesHelper = new THREE.AxesHelper(10);
    this._axesHelper.visible = false;
    scene.add(this._axesHelper);

    // animate
    this._clock = new THREE.Clock();
    this._clock.start();

    // keyboard listeners
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        this._keys[e.code] = true;
        if (this._transformControls) {
          if (e.code === 'KeyG') this._transformControls.setMode('translate');
          if (e.code === 'KeyR') this._transformControls.setMode('rotate');
          if (e.code === 'KeyS') this._transformControls.setMode('scale');
        }
      });
      window.addEventListener("keyup", (e) => (this._keys[e.code] = false));
      window.addEventListener("pointerdown", this._onPointerDown.bind(this));
      document.addEventListener("visibilitychange", () => {
        this._isThrottled = document.visibilityState === "hidden";
      });
    }

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
  }

  public loadVrm(url: string, scale: number = 1.0, position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }, onProgress?: (progress: number) => void): Promise<void> {
    if (this.model?.scene) {
      this.unloadVRM();
    }

    // gltf and vrm
    const newModel = new Model(this._camera || new THREE.Object3D());
    this.model = newModel;
    return newModel.loadVRM(url, onProgress).then(async () => {
      // Unloaded explicitly or superseded by another load while loading
      if (this.model !== newModel) {
        newModel.unLoadVrm();
        return;
      }
      if (!this.model?.scene) return;

      // Performance: Only disable frustum culling for SkinnedMesh to avoid pop-outs,
      // but keep it for everything else.
      this.model.scene.traverse((obj) => {
        if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
          obj.frustumCulled = false;
        }
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


  public loadGlb(url: string, scale: number = 1.0, position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }, onProgress?: (progress: number) => void): Promise<void> {
    this._glbLoadId++;
    const currentLoadId = this._glbLoadId;

    // Remove any previously loaded GLB
    if (this._glbScene) {
      if (this._transformControls) this._transformControls.detach();
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

          // Ensure frustum culling is enabled for performance
          this._glbScene.traverse((obj: THREE.Object3D) => {
            obj.frustumCulled = true;
          });

          this._scene.add(this._glbScene);

          if (this._transformControls) {
            this._transformControls.attach(this._glbScene);
          }

          console.log("GLB model loaded:", url);
          this._setupHotspots();
          resolve();
        },
        (progress: THREE.ProgressEvent) => {
          if (onProgress && progress.total > 0) {
            onProgress(progress.loaded / progress.total);
          }
        },
        (error) => {
          console.error("Error loading GLB model:", error);
          reject(error);
        }
      );
    });
  }

  private _setupHotspots() {
    this.clearClickableSpheres();
    // Re-initialize 3D spheres based on current scene/data if needed
    // For now, index.tsx handles the actual calls to addClickableSphere
  }

  public focusOn(position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }) {
    this._targetCamPos.set(position.x, position.y, position.z);
    this._targetCamLookAt.set(target.x, target.y, target.z);
  }

  public resetFocus() {
    this._targetCamPos.set(-2.25, 1.0, 2.75);
    this._targetCamLookAt.set(0, 0, 0);
  }

  public unloadVRM(): void {
    if (this.model?.scene) {
      if (this._transformControls) this._transformControls.detach();
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

    // Clean up old renderer and controls before re-setup
    if (this._renderer) {
      this._renderer.dispose();
    }
    if (this._transformControls) {
      this._transformControls.detach();
      this._scene.remove(this._transformControls);
      this._transformControls.dispose();
    }
    if (this._cameraControls) {
      this._cameraControls.dispose();
    }

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    // Optimized renderer for large models and high-res tablets
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: pixelRatio < 1.5, // Disable antialiasing on high-DPI screens for performance
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(pixelRatio);

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
    this._cameraControls.enableDamping = true;
    this._cameraControls.dampingFactor = 0.05;

    // Sync targets when user interacts so we don't snap back
    this._cameraControls.addEventListener('start', () => {
      this._isUserInteracting = true;
    });
    this._cameraControls.addEventListener('end', () => {
      this._isUserInteracting = false;
    });
    this._cameraControls.addEventListener('change', () => {
      if (this._isUserInteracting && this._camera && this._cameraControls) {
        this._targetCamPos.copy(this._camera.position);
        this._targetCamLookAt.copy(this._cameraControls.target);
      }
    });

    this._cameraControls.update();

    // TransformControls (Blender-like gizmo)
    this._transformControls = new TransformControls(this._camera, this._renderer.domElement);
    this._transformControls.addEventListener('dragging-changed', (event) => {
      // Disable orbit controls while using transform controls
      if (this._cameraControls) {
        this._cameraControls.enabled = !event.value;
      }
    });
    // Start hidden & disabled — user must toggle them on via the UI
    this._transformControls.visible = false;
    this._transformControls.enabled = false;
    this._transformControls.detach();
    this._scene.add(this._transformControls);

    window.addEventListener("resize", () => {
      this.resize();
    });

    if (this._labelRenderer && parentElement) {
      this._labelRenderer.setSize(width, height);
      this._labelRenderer.domElement.style.zIndex = '50';
      parentElement.appendChild(this._labelRenderer.domElement);
    }

    this.isReady = true;

    // Only start the update loop once
    if (!this._updateStarted) {
      this._updateStarted = true;
      this.update();
    }
  }

  private _updateStarted = false;

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
      this._tempHeadPos.set(0, 0, 0);
      headNode.getWorldPosition(this._tempHeadPos);

      // Update targets for smooth lerp
      this._targetCamPos.set(
        this._camera?.position.x || -2.25,
        this._tempHeadPos.y,
        this._camera?.position.z || 2.75
      );
      this._targetCamLookAt.copy(this._tempHeadPos);
    } else {
      this.resetFocus();
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
    if (this._isThrottled) return; // Save battery when tab is hidden

    const delta = Math.min(this._clock.getDelta(), 0.1); // Cap delta to avoid physics jumps

    // Safety: Detach TransformControls if the object is no longer in the scene
    if (this._transformControls && this._transformControls.object) {
      if (!this._transformControls.object.parent) {
        this._transformControls.detach();
      }
    }

    // update movement
    if (this.model?.scene && this._camera) {
      const moveSpeed = 2.0; // Units per second
      this._tempMoveVector.set(0, 0, 0);

      if (this._keys["KeyW"]) this._tempMoveVector.z -= 1;
      if (this._keys["KeyS"]) this._tempMoveVector.z += 1;
      if (this._keys["KeyA"]) this._tempMoveVector.x -= 1;
      if (this._keys["KeyD"]) this._tempMoveVector.x += 1;

      if (this._tempMoveVector.lengthSq() > 0) {
        this._tempMoveVector.normalize();

        // Get camera forward direction (projected on XZ plane)
        this._camera.getWorldDirection(this._tempForward);
        this._tempForward.y = 0;
        this._tempForward.normalize();

        this._tempRight.crossVectors(this._tempForward, new THREE.Vector3(0, 1, 0)).normalize();

        // Calculate final move direction
        this._tempDirection.set(0, 0, 0);
        this._tempDirection.addScaledVector(this._tempForward, -this._tempMoveVector.z);
        this._tempDirection.addScaledVector(this._tempRight, this._tempMoveVector.x);

        // Update character position
        this.model.scene.position.addScaledVector(this._tempDirection, moveSpeed * delta);

        // Rotate character to face movement direction
        const targetRotation = Math.atan2(this._tempDirection.x, this._tempDirection.z);
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

    // Smooth Camera lerp
    if (this._camera && this._cameraControls && !this._isUserInteracting) {
      this._camera.position.lerp(this._targetCamPos, delta * this._camLerpSpeed);
      this._cameraControls.target.lerp(this._targetCamLookAt, delta * this._camLerpSpeed);
    }

    // Hotspot Pulse (Elite transition)
    this._clickableObjects.forEach((obj, i) => {
      const time = this._clock.elapsedTime;
      obj.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.05);
      if (obj.material instanceof THREE.MeshStandardMaterial) {
        obj.material.emissiveIntensity = 0.6 + Math.sin(time * 3 + i) * 0.4;
      }
    });
  };

  public setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
    if (this._transformControls) {
      this._transformControls.setMode(mode);
      // Only show the arrows if we are actually in a transform mode
      this._transformControls.visible = true;
      this._transformControls.enabled = true;
    }
  }

  public toggleTools(visible: boolean) {
    if (this._gridHelper) this._gridHelper.visible = visible;
    if (this._axesHelper) this._axesHelper.visible = visible;

    // If turning off tools, hide and disable the gizmo (arrows)
    if (!visible && this._transformControls) {
      this._transformControls.visible = false;
      this._transformControls.enabled = false;
    }
  }
}

