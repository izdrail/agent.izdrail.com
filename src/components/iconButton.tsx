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
      className={`rounded-16 text-sm p-10 text-center inline-flex items-center backdrop-blur-md border border-white/20 shadow-lg text-white/90 hover:bg-white/10 active:scale-95 transition-all
        ${rest.className || ""}
      `}
      style={{
        background: "rgba(8, 18, 8, 0.45)",
        ...rest.style,
      }}
    >
      {children}
      {isProcessing ? (
        <pixiv-icon name={"24/Dot"} scale="1"></pixiv-icon>
      ) : (
        !children && <pixiv-icon name={iconName} scale="1"></pixiv-icon>
      )}
      {label && <div className="mx-4 font-bold">{label}</div>}
    </button>
  );
};
