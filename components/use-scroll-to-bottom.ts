import { useEffect, useRef, type RefObject, useCallback } from 'react'

export function useScrollToBottom<T extends HTMLElement>(): [
	RefObject<T>,
	RefObject<T>,
	() => void
] {
	const containerRef = useRef<T>(null)
	const endRef = useRef<T>(null)

	// Function to explicitly scroll to bottom
	const scrollToBottom = useCallback(() => {
		if (endRef.current) {
			endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
		}
	}, [])

	useEffect(() => {
		const container = containerRef.current
		const end = endRef.current

		if (container && end) {
			// Scroll to bottom initially
			scrollToBottom()
			
			// Set up mutation observer to scroll on content changes
			const observer = new MutationObserver((mutations) => {
				// Check if mutations added new nodes or changed text content
				const hasRelevantChanges = mutations.some(mutation => 
					mutation.type === 'childList' || 
					mutation.type === 'characterData'
				)
				
				if (hasRelevantChanges) {
					// Get container's scroll position
					const { scrollTop, scrollHeight, clientHeight } = container
					// Only auto-scroll if user is already near bottom (within 100px)
					const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
					
					if (isNearBottom) {
						setTimeout(scrollToBottom, 100) // Small delay to ensure content is rendered
					}
				}
			})

			observer.observe(container, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: true,
			})

			return () => observer.disconnect()
		}
	}, [scrollToBottom])

	return [containerRef, endRef, scrollToBottom]
}
