/**
 * reports/dashboard — appointment metrics for a date range.
 * Barrel: domain, query keys and port *types* only.
 */
export * from "./domain/report-metrics";
export * from "./domain/report-range";
export * from "./domain/report-routes";
export { reportsQueryKeys } from "./infrastructure/query-keys";
export type * from "./ports/reports-query.port";
export type * from "./ports/reports-service.port";
