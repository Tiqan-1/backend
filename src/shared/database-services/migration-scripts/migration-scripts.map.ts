import { MigrationScript } from './migration-script'
import { V1 } from './v1'
import { V2 } from './v2'

export const MIGRATION_SCRIPTS_MAP = new Map<number, MigrationScript>([
    [1, new V1()],
    [2, new V2()],
])
