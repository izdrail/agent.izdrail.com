import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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

  constructor() {
    this.isReady = false;

    // scene
    const scene = new THREE.Scene();
    this._scene = scene;

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // animate
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  public loadVrm(url: string, scale: number = 1.0, position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }): Promise<void> {
    if (this.model?.scene) {
      this.unloadVRM();
    }

    // gltf and vrm
    this.model = new Model(this._camera || new THREE.Object3D());
    return this.model.loadVRM(url).then(async () => {
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
    this._camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0);
    this._camera.position.set(0, 1.3, 1.5);
    this._cameraControls?.target.set(0, 1.3, 0);
    this._cameraControls?.update();
    // camera controls
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();

    window.addEventListener("resize", () => {
      this.resize();
    });
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

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();
    // update vrm components
    if (this.model) {
      this.model.update(delta);
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
