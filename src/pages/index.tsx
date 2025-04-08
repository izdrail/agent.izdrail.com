import { useCallback, useContext, useEffect, useState } from "react";
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
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [koeiromapKey, setKoeiromapKey] = useState("");
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

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



useEffect(() => {
  // const introText = "Hello! Welcome to the VRM experience. How can I assist you today?";
  // const screenplay = textsToScreenplay([introText], koeiroParam);
  
  // handleSpeakAi(screenplay[0], () => {
  //   console.log("Intro speech started");
  // });
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
      // Update a specific message in the chat log
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });
      
      setChatLog(newChatLog);
    },
    [chatLog]
  );

  /**
   * Request and play audio for each sentence in sequence
   */
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

  /**
   * Handle conversation with the assistant
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      // Check if the input text is valid
      const newMessage = text;
      if (newMessage == null) return;
      
      setChatProcessing(true);
      
      // Add the user's message to the chat log and display it
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // Prepare messages for Chat GPT
      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ];

      // Get the response stream from Chat GPT
      const stream = await getChatResponseStream(messages, openAiKey).catch(
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
          
          // Update the display with the current received message
          setAssistantMessage(receivedMessage);

          // Extract any tag at the beginning of the response
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // Process the response sentence by sentence
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();
            
            // Skip unpronounceable or unnecessary strings
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
            
            console.log("Processing sentence:", aiText);
            
            aiTextLog += aiText;
            

            console.log("AI Text Log:", aiTalks);

            // Speak the current sentence
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
        
        // Add the complete assistant's response to the chat log
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

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        koeiromapKey={koeiromapKey}
        onChangeAiKey={setOpenAiKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        onChangeKoeiromapKey={setKoeiromapKey}
      />
      <GitHubLink />
    </div>
  );
}