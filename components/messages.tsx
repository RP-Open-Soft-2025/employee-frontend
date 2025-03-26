import type { UIMessage } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import { Overview } from "./overview";
import { memo } from "react";
import type { Vote } from "@/lib/db/schema";
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@/lib/utils";

// Chat separator component
const ChatSeparator = ({ chatId }: { chatId: string }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          "bg-muted text-muted-foreground",
          "dark:bg-secondary/50 dark:text-muted-foreground/80"
        )}
      >
        Chat ID: {chatId}
      </div>
    </div>
  );
};

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers["status"];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Group messages by chat ID
  const groupedMessages = messages.reduce((acc, message) => {
    const messageChatId = message.id.split("-")[0];
    if (!acc[messageChatId]) {
      acc[messageChatId] = [];
    }
    acc[messageChatId].push(message);
    return acc;
  }, {} as Record<string, UIMessage[]>);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto [scrollbar-width:_none] pt-4"
    >
      {messages.length === 0 && <Overview />}

      {Object.entries(groupedMessages).map(
        ([messageChatId, chatMessages], groupIndex) => (
          <div
            key={messageChatId}
            className={`flex flex-col gap-6 ${
              groupIndex !== Object.entries(groupedMessages).length - 1
                ? "mb-5"
                : ""
            }`}
          >
            <ChatSeparator chatId={messageChatId} />
            {chatMessages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                chatId={chatId}
                message={message}
                isLoading={
                  status === "streaming" && messages.length - 1 === index
                }
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
              />
            ))}
          </div>
        )
      )}

      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />}

      <div ref={messagesEndRef} className="h-0" />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  return (
    equal(prevProps.messages, nextProps.messages) &&
    equal(prevProps.votes, nextProps.votes) &&
    prevProps.status === nextProps.status &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isArtifactVisible === nextProps.isArtifactVisible
  );
});
