import { VRMExpression, VRMExpressionPresetName } from "@pixiv/three-vrm";
import { KoeiroParam } from "../constants/koeiroParam";

// ChatGPT API
export type Message = {
  role: "assistant" | "system" | "user";
  content: string;
};

const talkStyles = [
  "happy",
  "excited",
  "surprised",
] as const;
export type TalkStyle = (typeof talkStyles)[number];

export type Talk = {
  style: TalkStyle;
  speakerX: number;
  speakerY: number;
  message: string;
};

const emotions = ["happy", "excited", "surprised"] as const;
type EmotionType = (typeof emotions)[number] & VRMExpressionPresetName;


export type Screenplay = {
  expression: EmotionType;
  talk: Talk;
};

export const splitSentence = (text: string): string[] => {
  const splitMessages = text.split(/(?<=[。．！？\n])/g);
  return splitMessages.filter((msg) => msg !== "");
};

export const textsToScreenplay = (
  texts: string[],
  koeiroParam: KoeiroParam
): Screenplay[] => {
  const screenplays: Screenplay[] = [];
  let prevExpression = "happy";
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    const match = text.match(/\[(.*?)\]/);

    const tag = (match && match[1]) || prevExpression;

    const message = text.replace(/\[(.*?)\]/g, "");

    let expression = prevExpression;
    if (emotions.includes(tag as any)) {
      expression = tag;
      prevExpression = tag;
    }

    screenplays.push({
      expression: expression as EmotionType,
      talk: {
        style: emotionToTalkStyle(expression as EmotionType),
        speakerX: koeiroParam.speakerX,
        speakerY: koeiroParam.speakerY,
        message: message,
      },
    });
  }

  return screenplays;
};

const emotionToTalkStyle = (emotion: EmotionType): TalkStyle => {
  switch (emotion) {
    case "happy":
      return "happy";
      case "surprised":
      return "excited";
    case "surprised":
      return "surprised";
      default:
      return "happy";
  }
};
