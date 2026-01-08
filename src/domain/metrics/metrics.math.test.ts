import { MetricsMath } from './metrics.math';
import type { OrderMetrics } from './types';

console.log('🧪 Running Metrics Math Tests...\n');

function assertEqual(actual: number, expected: number, testName: string) {
  const tolerance = 0.01;
  const diff = Math.abs(actual - expected);

  if (diff < tolerance) {
    console.log(`✅ PASS: ${testName}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Expected: ${expected}, Got: ${actual}`);
    return false;
  }
}

let passCount = 0;
let failCount = 0;

console.log('📊 Test: calculateDeliveryRate');
if (assertEqual(MetricsMath.calculateDeliveryRate(80, 100), 80, 'Delivery rate 80/100')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateDeliveryRate(0, 100), 0, 'Delivery rate 0/100')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateDeliveryRate(50, 0), 0, 'Delivery rate with zero total')) passCount++; else failCount++;
console.log('');

console.log('📊 Test: calculateReturnRate');
if (assertEqual(MetricsMath.calculateReturnRate(20, 100), 20, 'Return rate 20/100')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateReturnRate(0, 0), 0, 'Return rate with zero total')) passCount++; else failCount++;
console.log('');

console.log('💰 Test: calculateNetProfit');
if (assertEqual(MetricsMath.calculateNetProfit(1000, 300, 100, 50, true), 550, 'Net profit with ad cost')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateNetProfit(1000, 300, 100, 50, false), 600, 'Net profit without ad cost')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateNetProfit(1000, 300, 100, 0, true), 600, 'Net profit with null ad cost')) passCount++; else failCount++;
console.log('');

console.log('📈 Test: calculateAOV');
if (assertEqual(MetricsMath.calculateAOV(10000, 100), 100, 'AOV 10000/100')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateAOV(0, 0), 0, 'AOV with zero orders')) passCount++; else failCount++;
if (assertEqual(MetricsMath.calculateAOV(5000, 25), 200, 'AOV 5000/25')) passCount++; else failCount++;
console.log('');

console.log('🔢 Test: aggregateOrderMetrics');
const testOrders: OrderMetrics[] = [
  { revenue: 1000, cogs: 300, shipping_cost: 100, ad_cost: 50, counts_as_delivered: true, counts_as_return: false, counts_as_active: false, is_final: true },
  { revenue: 800, cogs: 200, shipping_cost: 80, ad_cost: 40, counts_as_delivered: true, counts_as_return: false, counts_as_active: false, is_final: true },
  { revenue: 500, cogs: 150, shipping_cost: 50, ad_cost: 0, counts_as_delivered: false, counts_as_return: true, counts_as_active: false, is_final: true },
  { revenue: 1200, cogs: 400, shipping_cost: 120, ad_cost: 60, counts_as_delivered: false, counts_as_return: false, counts_as_active: true, is_final: false },
];

const aggregated = MetricsMath.aggregateOrderMetrics(testOrders, true);

if (assertEqual(aggregated.totalOrders, 4, 'Total orders')) passCount++; else failCount++;
if (assertEqual(aggregated.deliveredOrders, 2, 'Delivered orders')) passCount++; else failCount++;
if (assertEqual(aggregated.returnOrders, 1, 'Return orders')) passCount++; else failCount++;
if (assertEqual(aggregated.activeOrders, 1, 'Active orders')) passCount++; else failCount++;
if (assertEqual(aggregated.grossSales, 3500, 'Gross sales')) passCount++; else failCount++;
if (assertEqual(aggregated.totalCogs, 1050, 'Total COGS')) passCount++; else failCount++;
if (assertEqual(aggregated.totalShippingCost, 350, 'Total shipping cost')) passCount++; else failCount++;
if (assertEqual(aggregated.totalAdCost, 150, 'Total ad cost')) passCount++; else failCount++;
if (assertEqual(aggregated.netProfit, 1950, 'Net profit')) passCount++; else failCount++;
console.log('');

console.log('═══════════════════════════════');
console.log(`📊 Results: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
