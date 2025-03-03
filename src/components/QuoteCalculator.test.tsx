import { render, screen, waitFor } from '@testing-library/react';
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
		price_1_line: 70,
		price_2_line: 60,
		price_3_line: 45,
		price_4_line: 35,
		price_5plus_line: 30,
		type: 'consumer',
		features: ['5G', 'Unlimited Data'],
		dataAllowance: {
			premium: 'unlimited',
			hotspot: 15,
		},
		streamingQuality: '720p',
		autopayDiscount: 10,
		planLevel: 'welcome' // Added required planLevel property
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

	it('renders loading state initially', async () => {
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockImplementation(
			() => new Promise(resolve => {
				setTimeout(() => resolve(mockPlans), 100);
			})
		);

		render(<QuoteCalculator />);
		
		expect(screen.getByText(/loading plans/i)).toBeInTheDocument();
		expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

		// Use act with a callback that's not async
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for updates to complete
		await waitFor(() => {
			expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
		});
	});

	it('displays plan selector after loading', async () => {
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to update
		await waitFor(() => {
			const planSelector = screen.getByText('Select Plan');
			expect(planSelector).toBeInTheDocument();
		});
	});

	it('calculates quote correctly for single line', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '1');

		// Wait for UI to update after user interactions
		await waitFor(() => {
			const perLinePrice = screen.getByText('Price Per Line');
			const totalCost = screen.getByText('Total Monthly Cost');
			
			expect(perLinePrice.nextElementSibling).toHaveTextContent('$70.00/mo');
			expect(totalCost.nextElementSibling).toHaveTextContent('$70.00/mo');
		});
	});

	it('calculates quote correctly for multiple lines with discount', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '3');

		// Wait for UI to update after user interactions
		await waitFor(() => {
			const perLinePrice = screen.getByText('Price Per Line');
			const totalCost = screen.getByText('Total Monthly Cost');
			
			expect(perLinePrice.nextElementSibling).toHaveTextContent('$45.00/mo');
			expect(totalCost.nextElementSibling).toHaveTextContent('$135.00/mo');
			expect(screen.getByText('Multi-line discount applied!')).toBeInTheDocument();
		});
	});

	it('shows validation error for invalid line count', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '13');

		// Wait for UI to update after user interactions
		await waitFor(() => {
			expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '12');
		});
	});

	it('displays error state when API fails', async () => {
		// Suppress console.error for this test
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		
		const errorMessage = 'Failed to fetch plans';
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error(errorMessage));
		
		render(<QuoteCalculator />);
		
		// Wait for error state to appear
		await waitFor(() => {
			expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		});
		
		consoleErrorSpy.mockRestore();
	});

	it('displays plan features when plan is selected', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		// Wait for plan features to appear
		await waitFor(() => {
			mockPlans[0].features.forEach(feature => {
				expect(screen.getByText(feature, { exact: false })).toBeInTheDocument();
			});
		});
	});

	it('handles API retry logic correctly', async () => {
		const getPlans = verizonPlans.getPlans as ReturnType<typeof vi.fn>;
		getPlans
			.mockRejectedValueOnce(new Error('First failure'))
			.mockResolvedValueOnce(mockPlans);
		
		render(<QuoteCalculator />);
		
		// Wait for initial error
		await waitFor(() => {
			expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		});
		
		expect(getPlans).toHaveBeenCalledTimes(1);
		
		// Advance timers for retry
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		// Wait for successful load after retry
		await waitFor(() => {
			const label = screen.getByText(/select plan/i, { selector: 'label' });
			expect(label).toBeInTheDocument();
		});
		
		expect(getPlans).toHaveBeenCalledTimes(2);
	});

	it('handles edge cases for line count input', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '-1');
		
		await waitFor(() => {
			expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '1');
		});
		
		await user.clear(linesInput);
		await user.type(linesInput, '2.5');
		
		await waitFor(() => {
			expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '1');
		});
		
		await user.clear(linesInput);
		
		await waitFor(() => {
			expect(screen.getByText(/please enter number of lines/i)).toBeInTheDocument();
		});
	});

	it('handles maximum line count correctly', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '12');

		await waitFor(() => {
			expect(screen.getByRole('spinbutton')).toHaveValue(12);
			expect(screen.getByText(/multi-line discount applied!/i)).toBeInTheDocument();
		});
	});

	it('handles plan data display correctly', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		await waitFor(() => {
			expect(screen.getByText(/streaming quality/i)).toBeInTheDocument();
			expect(screen.getByText('720p')).toBeInTheDocument();
			expect(screen.getByText(/hotspot/i)).toBeInTheDocument();
			expect(screen.getByText('15GB')).toBeInTheDocument();
		});
	});

	it('handles multiple API failures with exponential backoff', async () => {
		const getPlans = verizonPlans.getPlans as ReturnType<typeof vi.fn>;
		getPlans
			.mockRejectedValueOnce(new Error('First failure'))
			.mockRejectedValueOnce(new Error('Second failure'))
			.mockResolvedValueOnce(mockPlans);
		
		render(<QuoteCalculator />);
		
		// Wait for initial error
		await waitFor(() => {
			expect(screen.getByText(/failed to load plans/i)).toBeInTheDocument();
		});
		
		// First retry
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		
		// Second retry
		act(() => {
			vi.advanceTimersByTime(2000);
		});

		// Wait for successful load after retries
		await waitFor(() => {
			const label = screen.getByText(/select plan/i, { selector: 'label' });
			expect(label).toBeInTheDocument();
		});
		
		expect(getPlans).toHaveBeenCalledTimes(3);
	});

	it('maintains accessibility requirements', async () => {
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load
		await waitFor(() => screen.getByText('Select Plan'));
		
		const planSelect = screen.getByLabelText(/select plan/i);
		expect(planSelect).toHaveAttribute('aria-required', 'true');
		
		const linesInput = screen.getByLabelText(/enter number of lines/i);
		expect(linesInput).toHaveAttribute('aria-required', 'true');
		expect(linesInput).toHaveAttribute('type', 'number');
	});

	it('shows appropriate loading states during transitions', async () => {
		render(<QuoteCalculator />);
		
		// Initial loading
		expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for loading to complete
		await waitFor(() => {
			expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
			expect(screen.getByText(/select plan/i)).toBeInTheDocument();
		});
	});

	it('displays validation messages for invalid inputs', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to load before interacting
		await waitFor(() => screen.getByText('Select Plan'));
		
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		
		await user.clear(linesInput);
		await user.type(linesInput, '0');
		
		await waitFor(() => {
			expect(screen.getByText(/minimum 1 line required/i)).toBeInTheDocument();
		});
		
		await user.clear(linesInput);
		await user.type(linesInput, '15');
		
		await waitFor(() => {
			expect(screen.getByText(/maximum 12 lines allowed/i)).toBeInTheDocument();
		});
	});

	it('logs appropriate messages during development', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		
		render(<QuoteCalculator />);
		
		expect(consoleSpy).toHaveBeenCalledWith('Fetching plans...');
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		// Wait for component to update
		await waitFor(() => screen.getByText('Select Plan'));
		
		expect(consoleSpy).toHaveBeenCalledWith('Plans fetched successfully:', mockPlans);
		
		consoleSpy.mockRestore();
	});

	it('handles calculation errors gracefully', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		// Wait for component to load
		await waitFor(() => screen.getByText('Select Plan'));
		
		// Enter invalid number of lines
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		await user.clear(linesInput);
		await user.type(linesInput, '0');

		await waitFor(() => {
			expect(screen.getByText(/please enter a valid number of lines/i)).toBeInTheDocument();
		});
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
				price_1_line: 100,
				price_2_line: 90,
				price_3_line: 80,
				price_4_line: 70,
				price_5plus_line: 60,
				type: 'business',
				features: ['5G', 'Priority Data'],
				dataAllowance: {
					premium: 'unlimited',
					hotspot: 100,
				},
				streamingQuality: '4K',
				autopayDiscount: 10,
				planLevel: 'welcome'
			},
		];
		
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mixedPlans);
		
		render(<QuoteCalculator />);
		
		await waitFor(() => screen.getByText('Select Plan'));
		
		// Only consumer plans should be visible
		const select = screen.getByRole('combobox');
		await userEvent.click(select);
		
		await waitFor(() => {
			expect(screen.getByText('Basic Plan')).toBeInTheDocument();
			expect(screen.queryByText('Business Plan')).not.toBeInTheDocument();
		});
	});

	it('displays quote breakdown correctly', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');
		
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		await user.clear(linesInput);
		await user.type(linesInput, '3');

		// Wait for UI to update after interactions
		await waitFor(() => {
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
	});

	it('validates input data correctly', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		
		// Create a plan with missing required fields
		const invalidPlan = {
			...mockPlans[0],
			price_1_line: undefined // Missing required fields
		};
		(verizonPlans.getPlans as ReturnType<typeof vi.fn>).mockResolvedValue([invalidPlan as any]);
		
		render(<QuoteCalculator />);
		
		await waitFor(() => screen.getByText('Select Plan'));
		
		const select = screen.getByRole('combobox');
		await user.selectOptions(select, 'plan1');

		await waitFor(() => {
			expect(screen.getByText(/invalid input data/i)).toBeInTheDocument();
		});
	});

	it('calculates multi-line discounts correctly', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<QuoteCalculator />);
		
		act(() => {
			vi.advanceTimersByTime(100);
		});
		
		await waitFor(() => screen.getByText('Select Plan'));
		
		const linesInput = screen.getByPlaceholderText(/enter number of lines/i);
		const select = screen.getByRole('combobox');
		
		await user.selectOptions(select, 'plan1');
		await user.clear(linesInput);
		await user.type(linesInput, '5');

		await waitFor(() => {
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
});
