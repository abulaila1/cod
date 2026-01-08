# Metrics Engine - CODMeta

## Overview
Unified metrics calculation engine for CODMeta multi-tenant SaaS. Single source of truth for all analytics calculations.

## Architecture

```
src/domain/metrics/
├── types.ts              # TypeScript interfaces for filters, KPIs, breakdowns
├── metrics.math.ts       # Pure calculation functions (testable)
├── metrics.math.test.ts  # Unit tests for math functions
├── metrics.service.ts    # Service layer with Supabase integration
└── index.ts             # Public exports
```

## Core Principles

### ✅ Single Source of Truth
- All calculations happen in `MetricsService`
- No calculation logic in UI components
- UI only formats and displays results

### ✅ Multi-Tenant Safe
- All queries filter by `business_id`
- RLS policies enforce data isolation
- No cross-business data leakage

### ✅ Status-Flag Based
All metrics use status flags from `statuses` table:
- `counts_as_delivered` - Successful deliveries
- `counts_as_return` - Returns/refusals
- `counts_as_active` - Active orders
- `is_final` - Terminal states

### ✅ Testable & Maintainable
- Pure functions in `metrics.math.ts`
- Unit tests ensure correctness
- Easy to extend and modify

## Usage

### Basic KPIs

```typescript
import { MetricsService } from '@/domain/metrics';

const kpis = await MetricsService.getKpis(businessId, {
  date_from: '2024-01-01',
  date_to: '2024-01-31',
  include_ad_cost: true,
  delivered_denominator: 'delivered', // or 'total'
});

// Returns:
// {
//   total_orders: 1000,
//   delivered_orders: 750,
//   return_orders: 150,
//   active_orders: 100,
//   delivery_rate: 75.0,
//   return_rate: 15.0,
//   gross_sales: 500000,
//   total_cogs: 200000,
//   total_shipping_cost: 50000,
//   total_ad_cost: 30000,
//   net_profit: 220000,
//   aov: 666.67,
//   last_updated_at: '2024-01-31T12:00:00Z'
// }
```

### Time Series

```typescript
const timeSeries = await MetricsService.getTimeSeries(businessId, filters);

// Returns daily breakdown:
// [
//   { date: '2024-01-01', total_orders: 50, delivered_orders: 40, ... },
//   { date: '2024-01-02', total_orders: 45, delivered_orders: 38, ... },
//   ...
// ]
```

### Breakdowns

```typescript
const breakdowns = await MetricsService.getBreakdowns(businessId, filters);

// Returns:
// {
//   by_country: [...],
//   by_carrier: [...],
//   by_employee: [...],
//   by_product: [...]
// }
```

## Filters

```typescript
interface MetricsFilters {
  date_from: string;          // Required: Start date (ISO format)
  date_to: string;            // Required: End date (ISO format)
  country_id?: string;        // Optional: Filter by country
  carrier_id?: string;        // Optional: Filter by carrier
  employee_id?: string;       // Optional: Filter by employee
  product_id?: string;        // Optional: Filter by product
  status_key?: string;        // Optional: Filter by status key
  status_id?: string;         // Optional: Filter by status ID
  include_ad_cost?: boolean;  // Default: true
  delivered_denominator?: 'delivered' | 'total'; // For AOV calculation
}
```

## Calculations

### Delivery Rate
```
delivered_orders / total_orders * 100
```

### Return Rate
```
return_orders / total_orders * 100
```

### Net Profit
```
revenue - cogs - shipping_cost - (ad_cost if include_ad_cost)
```

### AOV (Average Order Value)
```
gross_sales / (delivered_orders OR total_orders)
```

## Testing

Run unit tests:
```bash
npx tsx src/domain/metrics/metrics.math.test.ts
```

Tests cover:
- Division by zero handling
- Null/undefined values
- Aggregation logic
- Edge cases

## Best Practices

### DO ✅
- Use `MetricsService` for all analytics
- Pass filters explicitly
- Format numbers in UI layer only
- Test calculation changes

### DON'T ❌
- Calculate metrics in React components
- Duplicate calculation logic
- Hardcode business logic in UI
- Skip filter validation

## Extension Guide

### Adding New Metrics

1. Add to KPIs interface in `types.ts`
2. Add calculation in `metrics.math.ts`
3. Add test in `metrics.math.test.ts`
4. Update `getKpis` in `metrics.service.ts`
5. Format in UI

### Adding New Filters

1. Add to `MetricsFilters` in `types.ts`
2. Apply filter in `fetchOrdersWithMetrics`
3. Test with different combinations

## Performance Notes

- Indexes on `business_id`, `order_date`, `status_id`
- Selective columns in queries (no SELECT *)
- Single query for all order data
- In-memory aggregation for breakdowns

## Security

- RLS policies on all tables
- Business ID validation
- User membership verification
- No raw SQL injection risks
