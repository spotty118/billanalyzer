import React from 'react';

export const Select = ({ onValueChange, children }: any) => (
	<select onChange={(e) => onValueChange(e.target.value)}>
		{children}
	</select>
);

export const SelectTrigger = ({ children }: any) => children;
export const SelectValue = ({ children }: any) => children;
export const SelectContent = ({ children }: any) => children;
export const SelectItem = ({ value, children }: any) => (
	<option value={value}>{children}</option>
);