import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
					'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				cardButton:
					'bg-[hsl(var(--button-tint))] text-[hsl(var(--button-tint-text))] border border-[hsl(var(--button-tint-border))] hover:bg-[hsl(84,53%,35%)] hover:text-white hover:border-[hsl(84,53%,30%)]',
				gradient:
					'bg-gradient-to-r from-primary to-secondary text-white border border-primary/80 shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
				primary:
					'bg-gradient-to-b from-[hsl(84,53%,40%)] to-[hsl(84,53%,35%)] text-white border border-[hsl(84,53%,30%)] shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
				success:
					'bg-gradient-to-b from-[hsl(142,70%,45%)] to-[hsl(142,70%,40%)] text-white border border-[hsl(142,70%,35%)] shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = 'Button'

export { Button, buttonVariants }
