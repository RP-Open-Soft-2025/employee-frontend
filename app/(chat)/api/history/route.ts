import store from "@/redux/store";

export async function GET() {
  const state = store.getState();
  const userID = state.auth.user?.empID;

  if (!state.auth.isAuthenticated) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  // const chats = await getChatsByUserId({ id: userID! });
  const chats = {};
  return Response.json(chats);
}
