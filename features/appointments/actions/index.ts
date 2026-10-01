/**
 * appointments/actions — the one SHARED slice. The queue and the detail screen
 * both mount <AaActions>; nothing else crosses slice boundaries.
 *
 * Barrel: domain and port *types* only. Never export adapters, application or
 * composition from here.
 */
export * from "./domain/action-feedback";
export * from "./domain/action-routes";
export * from "./domain/action-target";
export type * from "./ports/actions-service.port";
export type * from "./ports/appointment-repository.port";
