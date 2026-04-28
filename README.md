# use-chat-on-chunk

A lightweight, specialized React hook for the **Vercel AI SDK** that captures individual text deltas (chunks) as they stream.

[![npm version](https://img.shields.io/npm/v/use-chat-on-chunk.svg)](https://www.npmjs.com/package/use-chat-on-chunk)
[![license](https://img.shields.io/npm/l/use-chat-on-chunk.svg)](https://github.com/s3kfm/use-chat-on-chunk)

## What it is & The Problem it Solves

### The Problem: "The Full String Headache"
Vercel's `useChat` is incredible for UI, but it provides the **entire accumulated message content** on every update. If you want to trigger side-effects like **Text-to-Speech (TTS)**, real-time logging, or animations, you don't want the whole string—you only want the *new* part that just arrived.

Manually calculating the difference between the "old" text and "new" text leads to bug-prone boilerplate involving complex `useRef` management and string slicing.

### The Solution
`use-chat-on-chunk` acts as an **intelligent event listener** for your stream. It internally tracks the "high-water mark" of the message and fires a callback **only for the new delta**.

- 🎯 **Vercel AI SDK Native**: Designed to work seamlessly with the `Message` object.
- 🔄 **Reset**: Automatically resets its internal pointer when the `message.id` changes (new response).

---

## Installation

```bash
npm install use-chat-on-chunk

```

## Usage
```typescript
import { useChat } from '@ai-sdk/react';
import { useChatOnChunk } from 'use-chat-on-chunk';

export default function Chat() {
  const { messages, status } = useChat({
    //configuration
  });
  const lastMessage = messages[messages.length - 1];

  useChatOnChunk({
    message: lastMessage,
    enabled: status === 'streaming',
    onChunk: (chunk) => {
      console.log('New chunk arrived:', chunk);
      // Perfect for feeding into a TTS engine or triggering animations
    }
  });

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

## API Reference

### `useChatOnChunk(options)`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`message`** | `Message \| undefined` | `undefined` | The message object from Vercel's `useChat`. The hook tracks `message.content`. |
| **`enabled`** | `boolean` | `true` | When `false`, the hook pauses tracking. Recommended to map this to `status === 'streaming'`. |
| **`onChunk`** | `(chunk: string) => void` | `undefined` | Callback function that receives only the newly appended text string. |

---


#### Stream Reset
The hook internally monitors the `message.id`. If the ID changes (e.g., the user sends a new prompt and a new assistant message is created), the hook automatically resets its internal character pointer to **0**. This ensures that the first chunk of a new message is captured correctly and isn't compared to the previous message's length.

