import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";

export function useChatOnChunk({
  message,
  onChunk,
  enabled = true,
}: {
  message: UIMessage | undefined;
  onChunk?: (text: string) => void;
  enabled?: boolean;
}) {
  const lastPartIndexRef = useRef(0);
  const lastIndexRef = useRef(0);
  // Track the ID to detect bubble transitions
  const currentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) return;

    // 1. Detect a New Bubble:
    // If the ID changes, it's a new message (even if the role is still 'assistant')
    if (message.id !== currentMessageIdRef.current) {
      lastPartIndexRef.current = 0;
      lastIndexRef.current = 0;
      currentMessageIdRef.current = message.id;
    }

    // 2. Only process assistant content
    if (!enabled) return;
    const { parts } = message;
    if (!parts) return;

    // 3. Process Part Deltas
    for (let p = lastPartIndexRef.current; p < parts.length; p++) {
      const part = parts[p]!;

      if (part.type === "text") {
        const fullText = part.text;
        const newText = fullText.slice(lastIndexRef.current);

        if (newText.length > 0) {
          onChunk?.(newText);
          lastIndexRef.current = fullText.length;
        }
      }

      if (p < parts.length - 1) {
        lastPartIndexRef.current = p + 1;
        lastIndexRef.current = 0;
      }
    }
  }, [message, onChunk]);
}
