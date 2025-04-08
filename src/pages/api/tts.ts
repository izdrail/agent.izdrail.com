import { conquaTTS} from "@/features/koeiromap/koeiromap";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message;

  const speakerX = req.body.speakerX;



 //send 
  const voice = await conquaTTS(
    message,
    speakerX,
  );

  console.log("voice", voice);
  

}
