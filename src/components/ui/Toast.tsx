import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  visible: boolean;
  className?: string;
};

export default function Toast({ message, visible, className }: ToastProps) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 rounded-md shadow-lg",
        "bg-neutral-800 text-white text-sm",
        className
      )}
    >
      <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
      {message}
    </div>
  );
}
