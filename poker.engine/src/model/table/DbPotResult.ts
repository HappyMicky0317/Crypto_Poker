import { DbPlayerAllocationResult } from "./DbPlayerAllocationResult";

import { DbHandEvaluatorResult } from "./DbHandEvaluatorResult";

export class DbPotResult {
    allocations: DbPlayerAllocationResult[] = [];
    playerHandEvaluatorResults: DbHandEvaluatorResult[] = [];
 }