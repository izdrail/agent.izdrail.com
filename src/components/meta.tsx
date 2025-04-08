import { buildUrl } from "@/utils/buildUrl";
import Head from "next/head";
export const Meta = () => {
  const title = "Interactive personal assistant - Build your own vitual private assistant with AI technology on your data";
  const description =
    "An interactive personal assistant that can respond to your voice and text commands. It uses the latest AI technology to provide a seamless experience.";
  const imageUrl = "http://i.imgur.com/AtxdDqr.png";
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};
