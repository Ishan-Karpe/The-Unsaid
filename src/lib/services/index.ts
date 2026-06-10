// Services barrel export
export { authService } from './auth';
export { keyDerivationService } from './keyDerivationService';
export { draftService } from './draftService';
export { preferencesService } from './preferencesService';
export { insightsService } from './insightsService';
export { exportService } from './exportService';
export { passwordChangeService } from './passwordChangeService';
export { kdfMigrationService } from './kdfMigrationService';
export { versionService } from './versionService';
export type { KdfMigrationResult } from './kdfMigrationService';
export type { ListVersionsResult, RestoreVersionResult } from './versionService';
export type { UserPreferences, PreferencesResult, AIPersonality } from './preferencesService';
export type { InsightsResult } from './insightsService';
export type { ExportResult, ExportPayload } from './exportService';
export type { PasswordChangeResult, PasswordChangeProgress } from './passwordChangeService';
