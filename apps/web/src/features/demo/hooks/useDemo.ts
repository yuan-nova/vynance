import type { DemoTransaction } from "@vynance/shared"
import { useSyncExternalStore } from "react"
import { addDemoRow, clearDemo, demoRows, removeDemoRow, subscribeDemo } from "../services/demo-store"

const EMPTY: DemoTransaction[] = []

/** Transaksi mode demo di perangkat ini (FR-151). */
export function useDemoTransactions(): DemoTransaction[] {
  return useSyncExternalStore(subscribeDemo, demoRows, () => EMPTY)
}

export const demoActions = { add: addDemoRow, remove: removeDemoRow, clear: clearDemo }
