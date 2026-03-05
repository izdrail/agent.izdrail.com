import { useCallback, useContext, useEffect, useState, useRef } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { Menu } from "@/components/menu";
import { IconButton } from "@/components/iconButton";
import { Meta } from "@/components/meta";
import Link from "next/link";
import { Hotspot, HOTSPOTS } from "@/features/constants/hotspotData";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [koeiromapKey, setKoeiromapKey] = useState("");
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  // Al-Rawda State
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Scaling logic
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 1920, h / 1200);
      setScale(s);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load saved parameters from local storage
  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setKoeiroParam(params.koeiroParam ?? DEFAULT_PARAM);
      setChatLog(params.chatLog ?? []);
    }
  }, []);

  // Save parameters to local storage whenever they change
  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, koeiroParam, chatLog })
      )
    );
  }, [systemPrompt, koeiroParam, chatLog]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });
      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      speakCharacter(screenplay, viewer, koeiromapKey, onStart, onEnd);
    },
    [viewer, koeiromapKey]
  );

  const handleSendChat = useCallback(
    async (text: string) => {
      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);

      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ];

      const stream = await getChatResponseStream(messages).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );

      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedMessage += value;
          setAssistantMessage(receivedMessage);

          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );

          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        console.error("Error processing chat response:", e);
      } finally {
        reader.releaseLock();
        const messageLogAssistant: Message[] = [
          ...messageLog,
          { role: "assistant", content: aiTextLog },
        ];
        setChatLog(messageLogAssistant);
        setChatProcessing(false);
      }
    },
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, koeiroParam]
  );

  // Speech Recognition Logic
  const handleRecognitionResult = useCallback(
    (event: any) => {
      const text = event.results[0][0].transcript;
      setUserMessage(text);
      if (event.results[0].isFinal) {
        setUserMessage(text);
        handleSendChat(text);
      }
    },
    [handleSendChat]
  );

  const handleRecognitionEnd = useCallback(() => {
    setIsMicRecording(false);
  }, []);

  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);
      return;
    }
    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);
    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);


  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="garden-container font-M_PLUS_2">
      <Meta />
      <div
        className="scene"
        ref={sceneRef}
        style={{ transform: `scale(${scale})` }}
      >
        {!isLoaded && (
          <div className="loading-screen animate-in fade-in duration-1000">
            <div className="loading-flower">
              <div className="petal-1"></div>
              <div className="petal-2"></div>
              <div className="petal-3"></div>
              <div className="petal-4"></div>
              <div className="petal-5"></div>
            </div>
            <div className="loading-text">Al-Rawda</div>
            <div className="loading-status italic">Preparing the Sanctuary...</div>
          </div>
        )}
        <div className="absolute inset-0">
          <VrmViewer onLoaded={handleLoaded} showCharacter={false} />
        </div>

        {/* TOOLTIP CARD (POP-UP ABOVE MENU) */}
        {activeHotspot && (
          <div
            className={`tip-card open`}
            style={{
              left: "50%",
              bottom: "180px",
              transform: "translateX(-50%)"
            }}
          >
            <div className="tip-inner">
              <div className="tip-bar" style={{ background: "rgba(74, 181, 176, 1)" }}></div>
              <div className="tip-header">
                <div className="tip-icon-wrap">{activeHotspot.icon}</div>
                <div>
                  <div className="tip-title">{activeHotspot.title}</div>
                  <div className="tip-subtitle">{activeHotspot.subtitle}</div>
                </div>
              </div>
              <div className="tip-divider"></div>
              <div className="tip-desc">{activeHotspot.desc}</div>
              <div className="tip-facts">
                {activeHotspot.facts.map((f, i) => (
                  <div key={i} className="tip-fact">
                    <div className="tip-fact-label">{f.label}</div>
                    <div className="tip-fact-value">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="tip-tags">
                {activeHotspot.tags.map((t, i) => (
                  <div
                    key={i}
                    className="tip-tag"
                    style={{ background: t.color, color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    {t.text}
                  </div>
                ))}
              </div>
              <div className="tip-footer">
                <button className="tip-close" onClick={() => setActiveHotspot(null)}>×</button>
                <button
                  className="tip-cta"
                  style={{ background: "rgba(74, 181, 176, 0.8)" }}
                  onClick={() => handleSendChat(`Tell me more about ${activeHotspot.label}`)}
                >
                  Ask Guide
                </button>
              </div>
            </div>
            <div className="tip-arrow arrow-bottom"></div>
          </div>
        )}

        {/* DISCOVERY SIDEBAR (RIGHT) */}
        <div className="side-controls">
          {HOTSPOTS.map((hs) => (
            <IconButton
              key={`menu-${hs.id}`}
              iconName={"24/Dot"}
              label={hs.label}
              isProcessing={false}
              onClick={() => setActiveHotspot(hs)}
              className="group"
              style={{
                background: activeHotspot?.id === hs.id ? "rgba(74, 181, 176, 0.45)" : "rgba(8, 18, 8, 0.45)",
                borderColor: activeHotspot?.id === hs.id ? "rgba(74, 181, 176, 0.8)" : "rgba(255, 255, 255, 0.15)",
                padding: "16px",
                minWidth: "60px",
                justifyContent: "center"
              }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{hs.icon}</span>
            </IconButton>
          ))}
        </div>

        {/* ASSISTANT HUD (BOTTOM) */}
        <div className="bottom-controls">
          <IconButton
            iconName="24/Microphone"
            label={isMicRecording ? "Listening..." : "Voice Guide"}
            isProcessing={isMicRecording}
            onClick={handleClickMicButton}
            style={{
              background: isMicRecording ? "rgba(74, 181, 176, 0.4)" : "rgba(8, 18, 8, 0.45)",
              borderColor: isMicRecording ? "rgba(74, 181, 176, 1)" : "rgba(255, 255, 255, 0.15)"
            }}
          />

          <IconButton
            iconName={showChatLog ? "24/CommentOutline" : "24/CommentFill"}
            label="History"
            isProcessing={false}
            disabled={chatLog.length <= 0}
            onClick={() => setShowChatLog(!showChatLog)}
          />

          <IconButton
            iconName="24/Menu"
            label="Settings"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          />

          <Link href="/assistant">
            <IconButton
              iconName="24/CommentFill"
              label="Face-to-Face"
              isProcessing={false}
              style={{
                background: "rgba(201, 184, 154, 0.2)",
                borderColor: "rgba(201, 184, 154, 0.3)"
              }}
            />
          </Link>
        </div>
      </div>

      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        koeiromapKey={koeiromapKey}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showChatLog={showChatLog}
        setShowChatLog={setShowChatLog}
        onChangeAiKey={setOpenAiKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        onChangeKoeiromapKey={setKoeiromapKey}
      />
    </div>
  );
}