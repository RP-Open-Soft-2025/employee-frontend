import Form from 'next/form'

import { Input } from './ui/input'
import { Label } from './ui/label'

export function AuthForm({
	action,
	children,
	defaultEmployeeId = '',
}: {
	action: NonNullable<
		string | ((formData: FormData) => void | Promise<void>) | undefined
	>
	children: React.ReactNode
	defaultEmployeeId?: string
}) {
	return (
		<Form action={action} className="flex flex-col gap-4 w-full">
			<div className="flex flex-col gap-2">
				<Label
					htmlFor="employee_id"
					className="text-zinc-600 font-normal dark:text-zinc-400"
				>
					Employee ID
				</Label>

				<Input
					id="employee_id"
					name="employee_id"
					className="bg-muted text-md md:text-sm"
					type="text"
					placeholder="EMPXXXX"
					autoComplete="employee_id"
					required
					autoFocus
					defaultValue={defaultEmployeeId}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label
					htmlFor="password"
					className="text-zinc-600 font-normal dark:text-zinc-400"
				>
					Password
				</Label>

				<Input
					id="password"
					name="password"
					className="bg-muted text-md md:text-sm"
					type="password"
					required
				/>
			</div>

			{children}
		</Form>
	)
}
