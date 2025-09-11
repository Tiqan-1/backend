import { ProgramDocument } from './schemas/program.schema'

export type ProgramWithSubscription = ProgramDocument & { subscriptionId: string }
