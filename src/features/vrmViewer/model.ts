import * as THREE from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMAnimation } from "../../lib/VRMAnimation/VRMAnimation";
import { VRMLookAtSmootherLoaderPlugin } from "@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin";
import { LipSync } from "../lipSync/lipSync";
import { EmoteController } from "../emoteController/emoteController";
import { Screenplay } from "../messages/messages";

export class Model {
  public vrm?: VRM | null;
  public scene?: THREE.Group;
  public mixer?: THREE.AnimationMixer;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;
  private _lipSync?: LipSync;

  constructor(lookAtTargetParent: THREE.Object3D) {
    this._lookAtTargetParent = lookAtTargetParent;
    this._lipSync = new LipSync(new AudioContext());
  }

  public async loadVRM(url: string, onProgress?: (progress: number) => void): Promise<void> {
    const loader = new GLTFLoader();
    loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        })
    );

    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf),
        (progress: THREE.ProgressEvent) => {
          if (onProgress && progress.total > 0) {
            onProgress(progress.loaded / progress.total);
          }
        },
        (error: ErrorEvent) => reject(error)
      );
    });

    this.scene = gltf.scene;
    this.vrm = gltf.userData.vrm;

    if (this.vrm) {
      this.scene.name = "VRMRoot";
      // Cast needed: rotateVRM0 types don't expose VRMCore in this package version
      VRMUtils.rotateVRM0(this.vrm as any);
      this.mixer = new THREE.AnimationMixer(this.scene);
      this.emoteController = new EmoteController(this.vrm, this._lookAtTargetParent);
    } else {
      this.scene.name = "GLTFScene";
      this.mixer = new THREE.AnimationMixer(this.scene);
    }
  }

  public unLoadVrm() {
    if (this.scene) {
      VRMUtils.deepDispose(this.scene);
      this.vrm = null;
      this.scene = undefined;
    }
  }


  public async loadAnimation(vrmAnimation: VRMAnimation): Promise<void> {
    const { vrm, mixer } = this;
    if (vrm == null || mixer == null) {
      throw new Error("You have to load VRM first");
    }

    const clip = vrmAnimation.createAnimationClip(vrm);
    const action = mixer.clipAction(clip);
    action.play();
  }


  public async speak(buffer: ArrayBuffer, screenplay: Screenplay) {
    this.emoteController?.playEmotion(screenplay.expression);
    await new Promise((resolve) => {
      this._lipSync?.playFromArrayBuffer(buffer, () => {
        resolve(true);
      });
    });
  }

  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update();
      this.emoteController?.lipSync("aa", volume);
    }

    this.emoteController?.update(delta);
    this.mixer?.update(delta);
    this.vrm?.update(delta);
  }
}
