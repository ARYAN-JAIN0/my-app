import type { Deal, RevenueForecast } from "@/features/finance/types/finance.types";

interface ForecastParams {
  historicalData: number[];
  dealVelocity: number;
  averageDealSize: number;
  pipelineValue: number;
  period: "monthly" | "quarterly" | "annually";
}

export function calculateRevenueForecast(
  params: ForecastParams
): RevenueForecast {
  const { historicalData, dealVelocity, averageDealSize, pipelineValue, period } = params;
  
  // Calculate trend using linear regression
  const n = historicalData.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = historicalData.reduce((a, b) => a + b, 0);
  const sumXY = historicalData.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Forecast periods
  const periodsAhead = period === "monthly" ? 12 : period === "quarterly" ? 4 : 3;
  const forecasts: number[] = [];
  
  for (let i = 0; i < periodsAhead; i++) {
    const forecastValue = intercept + slope * (n + i);
    forecasts.push(Math.max(0, Math.round(forecastValue)));
  }
  
  // Calculate confidence intervals
  const residuals = historicalData.map((y, x) => y - (intercept + slope * x));
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  
  const confidenceIntervals = forecasts.map((forecast) => ({
    lower: Math.max(0, forecast - 1.96 * rmse),
    upper: forecast + 1.96 * rmse,
  }));
  
  // Calculate pipeline conversion
  const expectedDeals = Math.round(pipelineValue / averageDealSize);
  const expectedRevenue = expectedDeals * dealVelocity * averageDealSize;
  
  return {
    period,
    forecasts,
    confidenceIntervals,
    pipelineValue,
    expectedRevenue,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateWinRate(deals: Deal[]): number {
  if (deals.length === 0) return 0;
  
  const wonDeals = deals.filter((d) => d.status === "won").length;
  return wonDeals / deals.length;
}

export function calculateAverageDealSize(deals: Deal[]): number {
  const wonDeals = deals.filter((d) => d.status === "won" && d.value);
  if (wonDeals.length === 0) return 0;
  
  const totalValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  return totalValue / wonDeals.length;
}

export function calculateSalesCycleLength(deals: Deal[]): number {
  const closedDeals = deals.filter((d) => d.status === "won" && d.closeDate && d.createdAt);
  
  if (closedDeals.length === 0) return 0;
  
  const totalDays = closedDeals.reduce((sum, d) => {
    const closeDate = new Date(d.closeDate!);
    const createdDate = new Date(d.createdAt);
    return sum + (closeDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  
  return Math.round(totalDays / closedDeals.length);
}