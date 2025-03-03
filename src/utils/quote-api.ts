
import { Plan, ApiError } from "@/types";
import { getPlans } from "@/data/verizonPlans";

/**
 * Handles API errors
 */
export const handleApiError = (err: unknown): ApiError => {
  console.error('Error occurred:', err);
  return {
    message: 'Failed to load plans. Please try again later.',
    details: err instanceof Error ? err.message : 'Unknown error occurred'
  };
};

/**
 * Fetches plans from the API
 */
export const fetchPlans = async (): Promise<{ plans: Plan[], error: ApiError | null }> => {
  try {
    const plans = await getPlans();
    if (!Array.isArray(plans)) {
      throw new Error('Invalid response format');
    }
    // Filter out plans with undefined planLevel or set a default value
    const validPlans = plans.filter(plan => plan.planLevel !== undefined) as Plan[];
    return { plans: validPlans, error: null };
  } catch (err) {
    return { plans: [], error: handleApiError(err) };
  }
};
