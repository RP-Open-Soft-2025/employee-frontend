import { cookies } from "next/headers";
import store from "@/redux/store";
import { notFound } from "next/navigation";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { DBMessage } from "@/lib/db/schema";
import { Attachment, UIMessage } from "ai";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  // const chat = await getChatById({ id });

  // if (!chat) {
  //   notFound();
  // }

  const state = store.getState();
  const userID = state.auth.user?.empID;

  // if (chat.visibility === "private") {
  //   if (!state.auth.isAuthenticated) {
  //     return notFound();
  //   }

  //   if (userID !== chat.userId) {
  //     return notFound();
  //   }
  // }

  // const messagesFromDb = await getMessagesByChatId({ id });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role as UIMessage["role"],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: "",
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  if (!chatModelFromCookie) {
    return (
      <>
        {/* <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={chat.visibility}
          isReadonly={userID !== chat.userId}
        /> */}
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      {/* <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie.value}
        selectedVisibilityType={chat.visibility}
        isReadonly={userID !== chat.userId}
      /> */}
      <DataStreamHandler id={id} />
    </>
  );
}
