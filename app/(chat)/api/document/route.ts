import store from "@/redux/store";
import type { ArtifactKind } from '@/components/artifact';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const state = store.getState();

  if (!state.auth.isAuthenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  // const documents = await getDocumentsById({ id });

  // const [document] = documents;

  // if (!document) {
  //   return new Response('Not Found', { status: 404 });
  // }

  // if (document.userId !== session.user.id) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  // return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const state = store.getState();
  const employee_id = state.auth.user?.employee_id;

  if (!state.auth.isAuthenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  if (employee_id) {
    // const document = await saveDocument({
    //   id,
    //   content,
    //   title,
    //   kind,
    //   userId: session.user.id,
    // });

    const document = {};

    return Response.json(document, { status: 200 });
  }

  return new Response('Unauthorized', { status: 401 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const state = store.getState();

  if (!state.auth.isAuthenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  // const documents = await getDocumentsById({ id });

  // const [document] = documents;

  // if (document.userId !== session.user.id) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  // await deleteDocumentsByIdAfterTimestamp({
  //   id,
  //   timestamp: new Date(timestamp),
  // });

  return new Response('Deleted', { status: 200 });
}
