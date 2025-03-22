"use client";

import type { Attachment, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { checkAuth } from "@/redux/features/auth";
import type { Message } from "@ai-sdk/react";

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    initialMessages: initialMessages as any,
    api: "/api/chat",
    streamProtocol: "text",
    body: { id },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("An error occurred, please try again!");
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Check authentication status on component mount
  useEffect(() => {
    // Temporarily disable auth check to prevent login redirect
    // dispatch(checkAuth());
    // if (!isAuthenticated) {
    //   router.push("/login");
    // }
  }, [dispatch, isAuthenticated, router]);

  // If not authenticated, show UI anyway (temporarily)
  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <>
      <div className="flex flex-col min-w-0 bg-white/70 dark:bg-black/70 h-[calc(100vh-125px)] rounded-lg">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages as any}
          setMessages={setMessages as any}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 pb-4 md:pb-5 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages as any}
              setMessages={setMessages as any}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages as any}
        setMessages={setMessages as any}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
