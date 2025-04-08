import { useState, useCallback } from "react";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  koeiroMapKey: string;
  onChangeAiKey: (openAiKey: string) => void;
  onChangeKoeiromapKey: (koeiromapKey: string) => void;
};
export const Introduction = ({
  openAiKey,
  koeiroMapKey,
  onChangeAiKey,
  onChangeKoeiromapKey,
}: Props) => {
  const [opened, setOpened] = useState(true);

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiKey(event.target.value);
    },
    [onChangeAiKey]
  );

  const handleKoeiromapKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeKoeiromapKey(event.target.value);
    },
    [onChangeKoeiromapKey]
  );

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40  bg-black/30 font-M_PLUS_2">
      <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            About this application
          </div>
          <div>
            You can enjoy conversations with 3D characters using microphone, text input, and voice synthesis all in your web browser.
            You can also change the character (VRM), personality settings, and voice adjustments.
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            Technology introduction
          </div>
          <div>
            For displaying and operating 3D models, I used
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            , for conversation generation I use
            <Link
              url={
                "https://ollama.com/"
              }
              label={"OLLAMA API"}
            />
            , and for voice synthesis I use
            <Link url={"https://github.com/coqui-ai"} label={"coqui"} />

            . Inspiration for this project came from
            <Link
              url={"https://inside.pixiv.blog/2023/04/28/160000"}
              label={"technical article"}
            />
            .
          </div>

        </div>

   
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
             API key
          </div>
          <input
            type="text"
            placeholder=""
            value={koeiroMapKey}
            onChange={handleKoeiromapKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          
        </div>
      </div>
    </div>
  ) : null;
};
