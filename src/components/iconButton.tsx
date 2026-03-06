import { KnownIconType } from "@charcoal-ui/icons";
import { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType;
  isProcessing: boolean;
  label?: string;
  children?: React.ReactNode;
};

export const IconButton = ({
  iconName,
  isProcessing,
  label,
  children,
  ...rest
}: Props) => {
  return (
    <button
      {...rest}
      className={`rounded-18 text-xs p-12 text-center inline-flex items-center backdrop-blur-xl border border-white/10 shadow-2xl text-white/90 hover:bg-white/15 hover:border-white/20 active:scale-95 transition-all duration-300 ease-out font-Outfit tracking-widest uppercase
        ${rest.className || ""}
      `}
      style={{
        background: "rgba(10, 15, 12, 0.45)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.05) inset",
        ...rest.style,
      }}
    >
      {children}
      {isProcessing ? (
        <div className="animate-pulse"><pixiv-icon name={"24/Dot"} scale="1"></pixiv-icon></div>
      ) : (
        !children && <pixiv-icon name={iconName} scale="1"></pixiv-icon>
      )}
      {label && <div className="ml-8 font-medium">{label}</div>}
    </button>
  );
};
