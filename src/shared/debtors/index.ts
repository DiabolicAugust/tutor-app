/**
 * Who has run out of paid lessons — and who is about to.
 *
 * Nothing is stored here. The balance is spent by the register, so this is a
 * question asked of data the app already keeps rather than a second ledger to
 * hold in step with the first.
 */
export { debtorKind, type Debtor } from './debtor';
export { httpDebtorsClient, type DebtorsClient } from './debtors-client';
export { DebtorList } from './components/debtor-list';
export { useDebtors, type DebtorsState } from './use-debtors';
