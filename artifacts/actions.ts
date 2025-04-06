'use server'

export async function getSuggestions({ documentId }: { documentId: string }) {
	// const suggestions = await getSuggestionsByDocumentId({ documentId });
	const suggestions = {}
	return suggestions ?? []
}
