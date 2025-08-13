import { MigrationScript } from './migration-script'
import { V1 } from './v1'
import { V2 } from './v2'
import { V3 } from './v3'
import { V4 } from './v4'
import { V5 } from './v5'
import { V6 } from './v6'
import { V7 } from './v7'
import { V8 } from './v8'
import { V9 } from './v9'

export const MIGRATION_SCRIPTS_MAP = new Map<number, MigrationScript>([
    [1, new V1()],
    [2, new V2()],
    [3, new V3()],
    [4, new V4()],
    [5, new V5()],
    [6, new V6()],
    [7, new V7()],
    [8, new V8()],
    [9, new V9()],
])
