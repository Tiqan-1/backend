import { MigrationScript } from './migration-script'
import { V1 } from './v1'
import { V2 } from './v2'
import { V3 } from './v3'
import { V4 } from './v4'
import { V5 } from './v5'

export const MIGRATION_SCRIPTS_MAP = new Map<number, MigrationScript>([
    [1, new V1()],
    [2, new V2()],
    [3, new V3()],
    [4, new V4()],
    [5, new V5()],
])
