import { useContext, useCallback, useEffect } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";

interface Props {
    onLoaded?: () => void;
    showCharacter?: boolean;
    showScene?: boolean;
}

export default function VrmViewer({ onLoaded, showCharacter = true, showScene = true }: Props) {
    const { viewer } = useContext(ViewerContext);

    const canvasRef = useCallback(
        (canvas: HTMLCanvasElement) => {
            if (canvas) {
                viewer.setup(canvas);
                // You can adjust the scale and position of the character here
                // We make the character much smaller (e.g. 0.05) to fit inside the model
                // For position: { x: left/right, y: up/down, z: forward/backward }
                let vrmPromise = Promise.resolve();
                if (showCharacter) {
                    vrmPromise = viewer.loadVrm(buildUrl("/AvatarSample_A.vrm"), showScene ? 0.30 : 1.0, showScene ? { x: 0, y: -0.50, z: 0.50 } : { x: 0, y: -1.3, z: 0 });
                } else {
                    viewer.unloadVRM();
                }

                const glbPromise = showScene
                    ? viewer.loadGlb(buildUrl("/model2.glb"), 1.0, { x: 0, y: 0, z: 0 })
                    : Promise.resolve();

                Promise.all([vrmPromise, glbPromise]).then(() => {
                    onLoaded?.();
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
