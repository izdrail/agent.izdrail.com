import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  koeiroParam: KoeiroParam;
  koeiromapKey: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeKoeiromapKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
export const Settings = ({
  openAiKey,
  chatLog,
  systemPrompt,
  koeiroParam,
  koeiromapKey,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  onChangeKoeiromapKey,
}: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl overflow-y-auto custom-scrollbar">
      <div className="absolute top-24 right-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>

      <div className="max-w-3xl mx-auto px-24 py-80">
        <div className="text-white/40 text-[11px] tracking-[6px] uppercase font-bold mb-16">Assistant Dashboard</div>
        <div className="text-white/95 text-4xl font-Cinzel mb-56 border-b border-white/5 pb-24">Settings</div>

        {/* VRM Section */}
        <section className="mb-56">
          <div className="text-white/80 text-xl font-Cinzel mb-20 flex items-center gap-12">
            <span className="opacity-50 text-sm">01</span> Virtual Presence
          </div>
          <div className="bg-white/5 rounded-2xl p-24 border border-white/10 backdrop-blur-md">
            <p className="text-white/50 text-sm mb-20 leading-relaxed italic">
              Upload a .vrm file to change the visual personification of your guide.
            </p>
            <TextButton onClick={onClickOpenVrmFile}>Upload NEW VRM</TextButton>
          </div>
        </section>

        {/* System Prompt Section */}
        <section className="mb-56">
          <div className="text-white/80 text-xl font-Cinzel mb-20 flex items-center gap-12">
            <span className="opacity-50 text-sm">02</span> Personality & Knowledge
          </div>
          <div className="bg-white/5 rounded-2xl p-24 border border-white/10 backdrop-blur-md">
            <p className="text-white/50 text-sm mb-20 leading-relaxed italic">
              Define the AI's persona, its knowledge of Our Rainwater, and its conversational style.
            </p>
            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-20 py-16 bg-black/30 border border-white/10 text-white/90 h-48 rounded-xl w-full focus:border-teal-500/50 outline-none transition-all mb-16 font-light leading-relaxed"
              style={{ minHeight: "160px" }}
            ></textarea>
            <TextButton onClick={onClickResetSystemPrompt}>Reset to Default Persona</TextButton>
          </div>
        </section>

        {/* Presets Section */}
        <section className="mb-56">
          <div className="text-white/80 text-xl font-Cinzel mb-20 flex items-center gap-12">
            <span className="opacity-50 text-sm">03</span> Voice Calibration
          </div>
          <div className="bg-white/5 rounded-2xl p-24 border border-white/10 backdrop-blur-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-32">
              {[
                { label: "Cute", preset: PRESET_A },
                { label: "Energetic", preset: PRESET_B },
                { label: "Cool", preset: PRESET_C },
                { label: "Mature", preset: PRESET_D },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onChangeKoeiroParam(p.preset.speakerX, p.preset.speakerY)}
                  className="px-12 py-10 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-24">
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30 mb-8">
                  <span>Pitch Axis (X)</span>
                  <span className="text-teal-400/60 font-mono">{koeiroParam.speakerX.toFixed(3)}</span>
                </div>
                <input
                  type="range" min={-10} max={10} step={0.001}
                  value={koeiroParam.speakerX}
                  className="w-full h-1 bg-white/10 appearance-none rounded-full cursor-pointer accent-teal-500"
                  onChange={(e) => onChangeKoeiroParam(Number(e.target.value), koeiroParam.speakerY)}
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30 mb-8">
                  <span>Tone Axis (Y)</span>
                  <span className="text-teal-400/60 font-mono">{koeiroParam.speakerY.toFixed(3)}</span>
                </div>
                <input
                  type="range" min={-10} max={10} step={0.001}
                  value={koeiroParam.speakerY}
                  className="w-full h-1 bg-white/10 appearance-none rounded-full cursor-pointer accent-teal-500"
                  onChange={(e) => onChangeKoeiroParam(koeiroParam.speakerX, Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {chatLog.length > 0 && (
          <section className="mb-56">
            <div className="text-white/80 text-xl font-Cinzel mb-20 flex items-center gap-12">
              <span className="opacity-50 text-sm">04</span> Memory Management
            </div>
            <div className="bg-white/5 rounded-2xl p-24 border border-white/10 backdrop-blur-md">
              <p className="text-white/50 text-sm mb-24 leading-relaxed italic">
                Review and edit the current session memory. Clearing this will reset the guide's context.
              </p>

              <div className="space-y-12 max-h-96 overflow-y-auto pr-8 custom-scrollbar mb-24">
                {chatLog.map((value, index) => (
                  <div key={index} className="flex gap-16 items-start bg-black/20 p-12 rounded-xl border border-white/5">
                    <div className="text-[9px] uppercase tracking-tighter text-white/30 w-16 pt-4">
                      {value.role === "assistant" ? "AI" : "YOU"}
                    </div>
                    <input
                      className="bg-transparent border-none text-white/80 text-sm focus:text-white outline-none w-full font-light"
                      type="text"
                      value={value.content}
                      onChange={(event) => onChangeChatLog(index, event.target.value)}
                    />
                  </div>
                ))}
              </div>

              <TextButton onClick={onClickResetChatLog}>Clear Session Memory</TextButton>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
