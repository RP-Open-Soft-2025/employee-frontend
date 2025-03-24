import store from "@/redux/store";

export async function GET() {
  const state = store.getState();
  const employee_id = state.auth.user?.employee_id;

  if (!state.auth.isAuthenticated) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const chats = {};
  return Response.json(chats);
}
