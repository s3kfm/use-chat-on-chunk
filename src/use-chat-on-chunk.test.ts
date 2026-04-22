import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UIMessage } from "ai";
import { useChatOnChunk } from "./use-chat-on-chunk.js"; // Adjust your import path

describe("useChatOnChunk (UIMessage format)", () => {
  let onChunkMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChunkMock = vi.fn();
  });

  it("should process a single text part correctly", () => {
    const message: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello world" }],
    };

    renderHook(() => useChatOnChunk({ message, onChunk: onChunkMock }));

    expect(onChunkMock).toHaveBeenCalledWith("Hello world");
    expect(onChunkMock).toHaveBeenCalledTimes(1);
  });

  it("should handle streaming deltas within the same text part", () => {
    let message: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello" }],
    };

    const { rerender } = renderHook(
      ({ msg }) => useChatOnChunk({ message: msg, onChunk: onChunkMock }),
      { initialProps: { msg: message } },
    );

    expect(onChunkMock).toHaveBeenCalledWith("Hello");

    // Simulate the SDK appending text to the first part
    message = {
      ...message,
      parts: [{ type: "text", text: "Hello there!" }],
    };

    rerender({ msg: message });

    // Should only emit the new delta
    expect(onChunkMock).toHaveBeenCalledWith(" there!");
    expect(onChunkMock).toHaveBeenCalledTimes(2);
  });

  it("should process multiple text parts in sequence", () => {
    const message: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [
        { type: "text", text: "Part one. " },
        { type: "text", text: "Part two." },
      ],
    };

    renderHook(() => useChatOnChunk({ message, onChunk: onChunkMock }));

    expect(onChunkMock).toHaveBeenNthCalledWith(1, "Part one. ");
    expect(onChunkMock).toHaveBeenNthCalledWith(2, "Part two.");
    expect(onChunkMock).toHaveBeenCalledTimes(2);
  });

  it("should skip non-text parts (files, tools, etc.)", () => {
    const message: any = {
      id: "msg-1",
      role: "assistant",
      parts: [
        { type: "file", url: "image.png", mediaType: "image/png" },
        { type: "text", text: "Look at this image" },
        { type: "tool-call", toolCallId: "1", toolName: "calc", args: {} },
      ],
    };

    renderHook(() => useChatOnChunk({ message, onChunk: onChunkMock }));

    // Only the text part should trigger the callback
    expect(onChunkMock).toHaveBeenCalledWith("Look at this image");
    expect(onChunkMock).toHaveBeenCalledTimes(1);
  });

  it("should reset state when message.id changes (new bubble)", () => {
    const { rerender } = renderHook(
      ({ msg }) => useChatOnChunk({ message: msg, onChunk: onChunkMock }),
      {
        initialProps: {
          msg: {
            id: "msg-1",
            role: "assistant",
            parts: [{ type: "text", text: "First message" }],
          } as UIMessage,
        },
      },
    );

    expect(onChunkMock).toHaveBeenCalledWith("First message");

    // Change the ID to simulate a new response starting
    const newMessage: UIMessage = {
      id: "msg-2",
      role: "assistant",
      parts: [{ type: "text", text: "Second message" }],
    };

    rerender({ msg: newMessage });

    // Because the ID changed, internal refs reset, allowing "Second message" to be emitted fully
    expect(onChunkMock).toHaveBeenCalledWith("Second message");
  });

  it("should not emit anything if enabled is false", () => {
    const message: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [{ type: "text", text: "Hidden text" }],
    };

    renderHook(() =>
      useChatOnChunk({ message, onChunk: onChunkMock, enabled: false }),
    );

    expect(onChunkMock).not.toHaveBeenCalled();
  });
});
