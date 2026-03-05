import { useEffect, useRef } from "react";
import { Message } from "@/features/messages/messages";
import { IconButton } from "./iconButton";

type Props = {
  messages: Message[];
  onClose: () => void;
};

export const ChatLog = ({ messages, onClose }: Props) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-24 bg-black/40 backdrop-blur-xl">
      <div className="absolute top-24 right-24">
        <IconButton iconName="24/Close" isProcessing={false} onClick={onClose} />
      </div>

      <div className="w-full max-w-2xl h-full flex flex-col pt-64 pb-24 overflow-hidden">
        <div className="text-white/40 text-[10px] tracking-[6px] uppercase font-bold mb-24 text-center">Conversation History</div>

        <div className="flex-1 overflow-y-auto pr-8 custom-scrollbar scroll-hidden">
          {messages.map((msg, i) => (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              <Chat role={msg.role} message={msg.content} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Chat = ({ role, message }: { role: string; message: string }) => {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex flex-col mb-24 ${isAssistant ? "items-start" : "items-end"}`}>
      <div className="text-[9px] tracking-[3px] uppercase text-white/30 mb-8 px-8">
        {isAssistant ? "Character" : "You"}
      </div>
      <div
        className={`max-w-[85%] px-20 py-14 rounded-2xl text-[15px] leading-relaxed shadow-xl border
          ${isAssistant
            ? "bg-white/10 backdrop-blur-md border-white/10 text-white/90 rounded-tl-none font-light"
            : "bg-teal-900/40 backdrop-blur-md border-teal-500/20 text-white/95 rounded-tr-none font-medium"
          }`}
      >
        {message}
      </div>
    </div>
  );
};
