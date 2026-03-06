import { useContext, useCallback, useEffect } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";

interface Props {
    onLoaded?: () => void;
    onProgress?: (progress: number, status: string) => void;
    showCharacter?: boolean;
    showScene?: boolean;
}

export default function VrmViewer({ onLoaded, onProgress, showCharacter = true, showScene = true }: Props) {
    const { viewer } = useContext(ViewerContext);

    const canvasRef = useCallback(
        (canvas: HTMLCanvasElement) => {
            if (canvas) {
                viewer.setup(canvas);

                let vrmProgress = 0;
                let glbProgress = 0;
                let lastStatus = "Initializing: 0%";
                const updateProgress = (vrmP: number, glbP: number) => {
                    vrmProgress = vrmP;
                    glbProgress = glbP;

                    const totalItems = (showCharacter ? 1 : 0) + (showScene ? 1 : 0);
                    if (totalItems === 0) {
                        onProgress?.(100, "Awakening...");
                        return;
                    }

                    // Three.js progress is 0.0 to 1.0. We map it to 30% - 90% range of the UI
                    const vrmFactor = showCharacter ? vrmProgress : 0;
                    const glbFactor = showScene ? glbProgress : 0;
                    const assetProgress = ((vrmFactor + glbFactor) / totalItems);

                    const totalPercentage = Math.round(30 + (assetProgress * 60));
                    let status = "Loading 3D Assets...";

                    if (totalPercentage >= 100) {
                        status = "Awakening...";
                    } else if (totalPercentage > 85) {
                        status = "Finalizing Atmosphere...";
                    }

                    onProgress?.(totalPercentage, status);
                };

                // Initial Staged Progress (Artificial slight delays for better UX)
                onProgress?.(5, "Initializing System Engine...");
                setTimeout(() => onProgress?.(15, "Loading Visual Assets..."), 400);
                setTimeout(() => onProgress?.(25, "Optimizing Graphics..."), 800);

                // You can adjust the scale and position of the character here
                let vrmPromise = Promise.resolve();
                if (showCharacter) {
                    vrmPromise = viewer.loadVrm(
                        buildUrl("/AvatarSample_A.vrm"),
                        showScene ? 0.30 : 1.0,
                        showScene ? { x: 0, y: -0.50, z: 0.50 } : { x: 0, y: -1.3, z: 0 },
                        (p: number) => { updateProgress(p, glbProgress); }
                    );
                } else {
                    viewer.unloadVRM();
                }

                const glbPromise = showScene
                    ? viewer.loadGlb(
                        buildUrl("/model2.glb"),
                        1.0,
                        { x: 0, y: 0, z: 0 },
                        (p: number) => { updateProgress(vrmProgress, p); }
                    )
                    : Promise.resolve();

                Promise.all([vrmPromise, glbPromise]).then(() => {
                    onProgress?.(95, "Finalizing Atmosphere...");
                    setTimeout(() => {
                        onProgress?.(100, "Awakening...");
                        onLoaded?.();
                    }, 500);
                });

                canvas.addEventListener("dragover", function (event) {
                    event.preventDefault();
                });

                canvas.addEventListener("drop", function (event) {
                    event.preventDefault();

                    const files = event.dataTransfer?.files;
                    if (!files) {
                        return;
                    }

                    const file = files[0];
                    if (!file) {
                        return;
                    }

                    const file_type = file.name.split(".").pop();
                    if (file_type === "vrm") {
                        const blob = new Blob([file], { type: "application/octet-stream" });
                        const url = window.URL.createObjectURL(blob);
                        viewer.loadVrm(url, 0.05, { x: 0, y: 0, z: 0 });
                    }
                });
            }
        },
        [viewer, onLoaded, showCharacter, showScene]
    );

    // Ensure VRM is unloaded if showCharacter becomes false or component unmounts
    useEffect(() => {
        if (!showCharacter) {
            viewer.unloadVRM();
        }
        return () => {
            if (!showCharacter) {
                viewer.unloadVRM();
            }
        };
    }, [showCharacter, viewer]);

    return (
        <div className={"w-full h-full"}>
            <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
        </div>
    );
}
