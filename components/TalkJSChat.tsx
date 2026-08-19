"use client";

// components/TalkJSChat.tsx
// In-app chat powered by TalkJS.
//
// Props:
//   currentUser  – the logged-in user (Planner or Vendor)
//   otherUser    – the conversation counterpart
//   bookingId    – used as the TalkJS conversation ID so one booking = one thread
//
// The TalkJS SDK is loaded dynamically (it's browser-only) via the official
// `talkjs` npm package. The App ID is read from NEXT_PUBLIC_TALKJS_APP_ID.
//
// Renders a <div> that TalkJS mounts its chatbox into. Cleans up on unmount.

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Loader2, AlertCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TalkJSUser {
  id:     string;   // internal DB User.id
  name:   string;
  email:  string;
  role:   "PLANNER" | "VENDOR";
  photoUrl?: string | null;
}

interface TalkJSChatProps {
  currentUser: TalkJSUser;
  otherUser:   TalkJSUser;
  /** Stable ID for the conversation thread – use bookingId or vendorId+plannerId */
  conversationId: string;
  /** Height of the chat box. Defaults to 420px */
  height?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TalkJSChat({
  currentUser,
  otherUser,
  conversationId,
  height = 420,
}: TalkJSChatProps) {
  const chatboxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no-token" | "error">("loading");

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID;

    if (!appId) {
      setStatus("no-token");
      return;
    }

    let session: import("talkjs").Session | null = null;
    let destroyed = false;

    // TalkJS SDK must be initialised inside Talk.ready
    import("talkjs").then((Talk) => {
      if (destroyed) return;

      Talk.default.ready.then(() => {
        if (destroyed || !chatboxRef.current) return;

        // ── Create / sync users ──────────────────────────────────────
        const me = new Talk.default.User({
          id:       currentUser.id,
          name:     currentUser.name,
          email:    currentUser.email,
          role:     currentUser.role.toLowerCase(),
          photoUrl: currentUser.photoUrl ?? undefined,
        });

        const them = new Talk.default.User({
          id:       otherUser.id,
          name:     otherUser.name,
          email:    otherUser.email,
          role:     otherUser.role.toLowerCase(),
          photoUrl: otherUser.photoUrl ?? undefined,
        });

        // ── Create session ───────────────────────────────────────────
        session = new Talk.default.Session({ appId, me });

        // ── Get or create the conversation ───────────────────────────
        // Using a deterministic ID means the same booking always maps
        // to the same TalkJS thread regardless of who opens it first.
        const conversation = session.getOrCreateConversation(conversationId);
        conversation.setParticipant(me);
        conversation.setParticipant(them);

        // ── Mount chatbox ────────────────────────────────────────────
        const chatbox = session.createChatbox();
        chatbox.select(conversation);
        chatbox.mount(chatboxRef.current!);

        setStatus("ready");
      }).catch(() => {
        if (!destroyed) setStatus("error");
      });
    }).catch(() => {
      if (!destroyed) setStatus("error");
    });

    return () => {
      destroyed = true;
      // Destroy the session to free resources and disconnect websocket
      session?.destroy();
    };
  }, [currentUser, otherUser, conversationId]);

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border bg-background">
      {/* ── Status overlays ──────────────────────────────────────────── */}
      {status === "loading" && (
        <div
          className="flex items-center justify-center gap-2 text-muted-foreground text-sm"
          style={{ height }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading chat…</span>
        </div>
      )}

      {status === "no-token" && (
        <div
          className="flex flex-col items-center justify-center gap-3 text-center px-6 text-muted-foreground text-sm"
          style={{ height }}
        >
          <MessageCircle className="h-8 w-8 opacity-40" />
          <p className="font-medium">Chat not configured</p>
          <p className="text-xs">
            Set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_TALKJS_APP_ID</code> in{" "}
            <code className="bg-muted px-1 rounded">.env.local</code> to enable messaging.
          </p>
        </div>
      )}

      {status === "error" && (
        <div
          className="flex flex-col items-center justify-center gap-3 text-center px-6 text-destructive text-sm"
          style={{ height }}
        >
          <AlertCircle className="h-8 w-8 opacity-60" />
          <p>Failed to load chat. Please refresh and try again.</p>
        </div>
      )}

      {/* ── TalkJS mount target ───────────────────────────────────────── */}
      {/* Always rendered so TalkJS can mount; hidden while loading */}
      <div
        ref={chatboxRef}
        style={{
          height,
          display: status === "ready" ? "block" : "none",
        }}
        aria-label="Chat window"
      />
    </div>
  );
}
