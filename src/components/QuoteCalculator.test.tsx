import { render, screen } from '@testing-library/react';
import { QuoteCalculator } from './QuoteCalculator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as verizonPlans from '@/data/verizonPlans';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import type { Plan } from '@/types';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Mock the Select components with improved type safety
vi.mock('@/components/ui/select', () => ({
	Select: ({ onValueChange, children }: { onValueChange: (value: string) => void, children: React.ReactNode }) => (
		<select onChange={(e) => onValueChange(e.target.value)}>{children}</select>
	),
	SelectTrigger: ({ children }: { children: React.ReactNode }) => children,
	SelectValue: ({ children }: { children: React.ReactNode }) => children,
	SelectContent: ({ children }: { children: React.ReactNode }) => children,
	SelectItem: ({ value, children }: { value: string, children: React.ReactNode }) => (
		<option value={value}>{children}</option>
	),
}));

// Mock the verizonPlans module
vi.mock('@/data/verizonPlans', () => ({
	getPlans: vi.fn(),
	formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockPlans: Plan[] = [
	{
		id: 'plan1',
		name: 'Basic Plan',
		basePrice: 70,
		type: 'consumer',
		features: ['5G', 'Unlimited Data'],
		price_1_line: 70,
		price_2_line: 60,
		price_3_line: 45,
		price_4_line: 35,
		price_5plus_line: 30,
		dataAllowance: {
			premium: 'unlimited',
			hotspot: 15,
		},
		streamingQuality: '720p',
		autopayDiscount: 10
	},
];

describe('QuoteCalculator', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlans);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders loading state initially', () => {
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockImplementation(
			() => new Promise(resolve => {
				setTimeout(() => resolve(mockPlans), 100);
			})
		);

		render(<QuoteCalculator />);
		expect(screen.getByText(/loading plans/i)).toBeInTheDocument();
		expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(100);
		});
	});

	it('displays plan selector after loading', () => {
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const planSelector = screen.getByText('Select Plan');
		expect(planSelector).toBeInTheDocument();
	});

	it('calculates quote correctly for single line', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '1');

		const perLinePrice = screen.getByText('Price Per Line');
		const totalCost = screen.getByText('Total Monthly Cost');
		
		expect(perLinePrice.nextElementSibling).toHaveTextContent('$70.00/mo');
		expect(totalCost.nextElementSibling).toHaveTextContent('$70.00/mo');

	});

	it('calculates quote correctly for multiple lines with discount', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '3');

		const perLinePrice = screen.getByText('Price Per Line');
		const totalCost = screen.getByText('Total Monthly Cost');
		
		expect(perLinePrice.nextElementSibling).toHaveTextContent('$45.00/mo');
		expect(totalCost.nextElementSibling).toHaveTextContent('$135.00/mo');
		expect(screen.getByText('Multi-line discount applied!')).toBeInTheDocument();
	});

	it('shows validation error for invalid line count', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '13');

		expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '12');

	});

	it('displays error state when API fails', () => {
		const errorMessage = 'Failed to fetch plans';
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(errorMessage));
		
		render(<QuoteCalculator />);
		
		expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it('displays plan features when plan is selected', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		mockPlans[0].features.forEach(feature => {
			expect(screen.getByText(feature, { exact: false })).toBeInTheDocument();
		});
	});


	it('handles API retry logic correctly', () => {
		const getPlans = verizonPlans.getPlans as ReturnType<typeof vi.fn>;
		getPlans
			.mockRejectedValueOnce(new Error('First failure'))
			.mockResolvedValueOnce(mockPlans);
		
		render(<QuoteCalculator />);
		
		expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		expect(getPlans).toHaveBeenCalledTimes(1);
		
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		const label = screen.getByText(/select plan/i, { selector: 'label' });
		expect(label).toBeInTheDocument();
		expect(getPlans).toHaveBeenCalledTimes(2);
	});


	it('handles edge cases for line count input', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '-1');
		expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '1');
		
		await user.clear(linesInput);
		await user.type(linesInput, '2.5');
		expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '1');
		
		await user.clear(linesInput);
		expect(screen.getByText(/please enter number of lines/i)).toBeInTheDocument();
	});


	it('handles maximum line count correctly', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '12');

		expect(screen.getByRole('spinbutton')).toHaveValue(12);
		expect(screen.getByText(/multi-line discount applied!/i)).toBeInTheDocument();
	});


	it('handles plan data display correctly', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		expect(screen.getByText(/streaming quality/i)).toBeInTheDocument();
		expect(screen.getByText('720p')).toBeInTheDocument();
		expect(screen.getByText(/hotspot/i)).toBeInTheDocument();
		expect(screen.getByText('15GB')).toBeInTheDocument();
	});


	it('handles multiple API failures with exponential backoff', () => {
		const getPlans = verizonPlans.getPlans as ReturnType<typeof vi.fn>;
		getPlans
			.mockRejectedValueOnce(new Error('First failure'))
			.mockRejectedValueOnce(new Error('Second failure'))
			.mockResolvedValueOnce(mockPlans);
		
		render(<QuoteCalculator />);
		
		expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		
		act(() => {
			vi.advanceTimersByTime(1000); // First retry
		});
		
		act(() => {
			vi.advanceTimersByTime(2000); // Second retry
		});

		const label = screen.getByText(/select plan/i, { selector: 'label' });
		expect(label).toBeInTheDocument();
		expect(getPlans).toHaveBeenCalledTimes(3);
	});


	it('maintains accessibility requirements', () => {
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const planSelect = screen.getByLabelText(/select plan/i);
		expect(planSelect).toHaveAttribute('aria-required', 'true');
		
		const linesInput = screen.getByLabelText(/enter number of lines/i);
		expect(linesInput).toHaveAttribute('aria-required', 'true');
		expect(linesInput).toHaveAttribute('type', 'number');
	});

	it('shows appropriate loading states during transitions', () => {
		render(<QuoteCalculator />);
		
		// Initial loading
		expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Loading complete
		expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
		expect(screen.getByText(/select plan/i)).toBeInTheDocument();
	});


	it('displays validation messages for invalid inputs', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.clear(linesInput);
		await user.type(linesInput, '0');
		expect(screen.getByText(/minimum 1 line required/i)).toBeInTheDocument();
		
		await user.clear(linesInput);
		await user.type(linesInput, '15');
		expect(screen.getByText(/maximum 12 lines allowed/i)).toBeInTheDocument();
	});


	it('logs appropriate messages during development', async () => {
		const consoleSpy = vi.spyOn(console, 'log');
		const errorSpy = vi.spyOn(console, 'error');
		
		render(<QuoteCalculator />);
		
		expect(consoleSpy).toHaveBeenCalledWith('Fetching plans...');
		
		await act(async () => {
			vi.advanceTimersByTime(100);
		});
		
		expect(consoleSpy).toHaveBeenCalledWith('Plans fetched successfully:', mockPlans);
		
		consoleSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it('handles calculation errors gracefully', async () => {
		const user = userEvent.setup();
		await act(async () => {
			render(<QuoteCalculator />);
		});
		
		await screen.findByText('Select Plan');
		
		// Enter invalid number of lines
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		await act(async () => {
			await user.clear(linesInput);
			await user.type(linesInput, '0');
		});

		expect(screen.getByText(/please enter a valid number of lines/i)).toBeInTheDocument();
	});

	it('renders within ErrorBoundary', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const ThrowError = () => { throw new Error('Test error'); };
		
		render(
			<ErrorBoundary>
				<ThrowError />
			</ErrorBoundary>
		);
		
		expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
		errorSpy.mockRestore();
	});

	it('filters consumer plans correctly in PlanSelector', async () => {
		const mixedPlans = [
			...mockPlans,
			{
				id: 'business1',
				name: 'Business Plan',
				basePrice: 100,
				type: 'business',
				features: ['5G', 'Priority Data'],
				price_1_line: 100,
				price_2_line: 90,
				price_3_line: 80,
				price_4_line: 70,
				price_5plus_line: 60,
				dataAllowance: {
					premium: 'unlimited',
					hotspot: 100,
				},
				streamingQuality: '4K',
				autopayDiscount: 10
			},
		];
		
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mixedPlans);
		
		render(<QuoteCalculator />);
		await screen.findByText('Select Plan');
		
		// Only consumer plans should be visible
		const select = screen.getByRole('combobox');
		await userEvent.click(select);
		
		expect(screen.getByText('Basic Plan')).toBeInTheDocument();
		expect(screen.queryByText('Business Plan')).not.toBeInTheDocument();
	});

	it('displays quote breakdown correctly', async () => {
		const user = userEvent.setup();
		await act(async () => {
			render(<QuoteCalculator />);
		});
		
		await screen.findByText('Select Plan');
		
		await act(async () => {
			const select = screen.getByRole('combobox');
			await user.selectOptions(select, 'plan1');
			
			const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
			await user.clear(linesInput);
			await user.type(linesInput, '3');
		});

		// Check breakdown sections
		expect(screen.getByText('Subtotal')).toBeInTheDocument();
		expect(screen.getByText('Multi-line Discount')).toBeInTheDocument();
		expect(screen.getByText(/annual savings/i)).toBeInTheDocument();
		
		// Verify calculations
		const subtotal = mockPlans[0].basePrice * 3; // $70 * 3
		const discountedPrice = mockPlans[0].price_3_line * 3; // $45 * 3
		const discount = subtotal - discountedPrice;
		
		expect(screen.getByText(`$${subtotal.toFixed(2)}`)).toBeInTheDocument();
		expect(screen.getByText(`-$${discount.toFixed(2)}`)).toBeInTheDocument();
	});

	it('validates input data correctly', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const invalidPlan = {
			...mockPlans[0],
			price_1_line: undefined // Missing required fields
		};
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockResolvedValue([invalidPlan as any]);
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		expect(screen.getByText(/invalid input data/i)).toBeInTheDocument();
	});


	it('calculates multi-line discounts correctly', async () => {
		const user = userEvent.setup();
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		const select = screen.getByRole('combobox');
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '5');

		// Verify 5+ line discount
		const perLinePrice = screen.getByText('Price Per Line');
		expect(perLinePrice.nextElementSibling).toHaveTextContent('$30.00/mo');
		
		// Calculate annual savings
		const baseTotal = mockPlans[0].basePrice * 5 * 12; // $70 * 5 * 12
		const discountedTotal = mockPlans[0].price_5plus_line * 5 * 12; // $30 * 5 * 12
		const annualSavings = baseTotal - discountedTotal;
		
		expect(screen.getByText(new RegExp(`Annual savings: \\$${annualSavings.toFixed(2)}`))).toBeInTheDocument();
	});

});
