import { reduceTalkStyle } from "@/utils/reduceTalkStyle";
import { koeiromapV0 } from "../koeiromap/koeiromap";
import { TalkStyle } from "../messages/messages";

export async function synthesizeVoice(
  message: string,
) {
  const koeiroRes = await koeiromapV0(message);
  return koeiroRes.arrayBuffer();
}

export async function synthesizeVoiceApi(
  message: string,
) {
  
  const body = {
    text: message,
  };

  const res = await fetch("https://audio.izdrail.com/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  return  (await res);

}
