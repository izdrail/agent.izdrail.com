
type ReducedTalkStyle = "talk" | "happy" | "sad";


export const reduceTalkStyle = (talkStyle: string): ReducedTalkStyle => {
  if (talkStyle == "talk" || talkStyle == "happy" || talkStyle == "sad") {
    return talkStyle;
  }

  return "talk";
};
