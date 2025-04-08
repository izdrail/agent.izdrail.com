import { wait } from "@/utils/wait";
import { synthesizeVoiceApi } from "./synthesizeVoice";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";
import { Talk } from "./messages";

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    koeiroApiKey: string,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime));
      }
      lastTime = Date.now();
      const buffer = await fetchAudio(screenplay.talk, koeiroApiKey);
      console.log("buffer", buffer);
      if (!buffer) {
        console.error("Failed to fetch audio");
        return;
      }
       await viewer.model?.speak(buffer, screenplay);
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        onStart?.();
        if (!audioBuffer) {
          return;
        }
        return viewer.model?.speak(audioBuffer, screenplay);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
};

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk,
  apiKey: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceApi(
    talk.message,
  );

  if (!ttsVoice) {
    throw new Error("Failed to fetch audio");
  }
  // ttsVoice is the stream audio data
  return ttsVoice.arrayBuffer();

};