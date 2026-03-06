import { buildUrl } from "@/utils/buildUrl";
import Head from "next/head";

export const Meta = () => {
  const title = "Garden Dashboard - Track and manage your garden plants, zones & tasks";
  const description =
    "A smart garden dashboard to monitor plant health, water levels, sunlight, and daily tasks. Stay on top of every zone in your garden with real-time insights.";

  return (
    <Head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
};