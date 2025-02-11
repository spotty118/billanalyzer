# VeriPlan Quotient

A comprehensive plan management and quotation system for Verizon mobile plans.

## Recent Improvements

### Data Structure and Validation
- Implemented Zod schemas for runtime data validation
- Enhanced plan data structure with detailed features
- Added versioning system for plans and promotions
- Improved promotion model with eligibility rules
- Added data consistency checks

### Performance Optimizations
- Added memoization to quote calculations
- Implemented API response caching
- Optimized plan filtering and calculations
- Added request retry mechanism
- Enhanced React component efficiency

### Error Handling
- Comprehensive error boundaries implementation
- Enhanced API error handling with detailed messages
- Improved input validation across components
- Added file upload sanitization
- Structured error responses

### Security Improvements
- CSRF protection for API requests
- File validation and sanitization
- Session handling improvements
- Request rate limiting
- Input sanitization

## Architecture

### Core Components
- `QuoteCalculator`: Main component for plan pricing calculations
- `BillAnalyzer`: Bill analysis and comparison tool
- `PromotionsOverview`: Promotion management system

### Data Layer
- Structured plan data with versioning
- Type-safe interfaces
- Runtime validation using Zod
- Cached API responses

### API Layer
- Singleton API service
- Request/response interceptors
- Error handling middleware
- File upload sanitization
- Response caching

## Usage

### Quote Calculator
```typescript
import { QuoteCalculator } from '@/components/QuoteCalculator';

// Basic usage
<QuoteCalculator />

// The calculator handles:
// - Plan selection
// - Line quantity
// - Price calculations
// - Multi-line discounts
// - Annual savings
```

### Bill Analysis
```typescript
import { apiService } from '@/services/api';

// Analyze bill
const result = await apiService.analyzeBill(file);
```

## Plan Data Structure

```typescript
interface Plan {
  id: string;
  name: string;
  basePrice: number;
  multiLineDiscounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
  dataAllowance: {
    premium: number;
    hotspot?: number;
  };
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
  version: string;
  lastUpdated: string;
}
```

## Future Improvements

1. Data Layer
   - Implement real-time plan updates
   - Add data migration system
   - Enhanced caching strategies

2. Performance
   - Add service worker for offline support
   - Implement progressive loading
   - Add request batching

3. Features
   - Advanced plan comparison
   - Custom plan builder
   - Historical pricing analysis

4. Security
   - Add rate limiting per user
   - Implement audit logging
   - Enhanced session management

## Best Practices

1. Data Management
   - Always validate data at runtime
   - Use versioning for data changes
   - Implement proper error boundaries

2. Performance
   - Memoize expensive calculations
   - Cache API responses
   - Optimize component renders

3. Security
   - Sanitize all inputs
   - Validate file uploads
   - Implement proper CSRF protection

4. Error Handling
   - Use structured error responses
   - Implement retry mechanisms
   - Provide clear error messages

## Contributing

1. Follow the TypeScript styleguide
2. Add tests for new features
3. Update documentation
4. Maintain backward compatibility
