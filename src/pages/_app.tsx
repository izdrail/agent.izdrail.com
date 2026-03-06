import "@/styles/globals.css";
import "@/styles/garden.css";
import type { AppProps } from "next/app";
import "@charcoal-ui/icons";
import { PwaPrompt } from "@/components/pwaPrompt";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <PwaPrompt />
    </>
  );
}
