import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback } from "react";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
};

/**
    The message input container component.
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);

  // handels when the speech recognition result is received
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setUserMessage(text);

      // response
      if (event.results[0].isFinal) {
        setUserMessage(text);
        // starts the chat process
        onChatProcessStart(text);
      }
    },
    [onChatProcessStart]
  );

  // handels when the speech recognition ends
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

  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    // Firefox Speach Recognition API
    if (!SpeechRecognition) {
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB"; // language
    recognition.interimResults = true; // show interim results
    recognition.continuous = false; // continuous mode

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing}
      isMicRecording={isMicRecording}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
