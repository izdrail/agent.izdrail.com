import { useContext, useCallback } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";

interface Props {
    onLoaded?: () => void;
    showCharacter?: boolean;
}

export default function VrmViewer({ onLoaded, showCharacter = true }: Props) {
    const { viewer } = useContext(ViewerContext);

    const canvasRef = useCallback(
        (canvas: HTMLCanvasElement) => {
            if (canvas) {
                viewer.setup(canvas);
                // You can adjust the scale and position of the character here
                // We make the character much smaller (e.g. 0.05) to fit inside the model
                // For position: { x: left/right, y: up/down, z: forward/backward }
                const vrmPromise = showCharacter
                    ? viewer.loadVrm(buildUrl("/AvatarSample_A.vrm"), 0.30, { x: 0, y: -0.50, z: 0.50 })
                    : Promise.resolve();

                // You can also scale up the room instead of scaling down the character
                // and move the room so the chair aligns with the character
                const glbPromise = viewer.loadGlb(buildUrl("/model.glb"), 1.0, { x: 0, y: 0, z: 0 });

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
        [viewer, onLoaded]
    );

    return (
        <div className={"w-full h-full"}>
            <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
        </div>
    );
}
