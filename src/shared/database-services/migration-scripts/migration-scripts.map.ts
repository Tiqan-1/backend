import { MigrationScript } from './migration-script'
import { V1 } from './v1'

export const MIGRATION_SCRIPTS_MAP = new Map<number, MigrationScript>([[1, new V1()]])
