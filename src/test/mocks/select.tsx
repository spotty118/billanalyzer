
import { type ReactNode } from 'react';

export const Select = ({ onValueChange, children }: { onValueChange: (value: string) => void, children: ReactNode }) => (
	<select onChange={(e) => onValueChange(e.target.value)}>
		{children}
	</select>
);

export const SelectTrigger = ({ children }: { children: ReactNode }) => children;
export const SelectValue = ({ children }: { children: ReactNode }) => children;
export const SelectContent = ({ children }: { children: ReactNode }) => children;
export const SelectItem = ({ value, children }: { value: string, children: ReactNode }) => (
	<option value={value}>{children}</option>
);
