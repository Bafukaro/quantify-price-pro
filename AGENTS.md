# Architecture rules
- Build manual, model and study budgets through `buildBoQSource`; consumers share the resulting sections so source changes cannot diverge between costs and exports.
- Save each manual-line action and its audit entry atomically through `save_manual_line`; audit hashes remain server-generated.
- Keep archived projects in the project store and filter only the active listing; an audit-to-project restrictive foreign key prevents deleting the evidence's parent.
- Keep IFC parsing, merged geometry and 3D interaction unchanged for manual quantity entry.
- Share audit display projections and the audit table across screens and PDF exports; readable values and derived quantity percentages must never mutate persisted evidence or server hashes.
- Review daily reports only through the transactional review RPC; terminal reports and attached receipts are immutable, and only confirmed quantities contribute to reported progress.
- Share purchase article keys, comparisons and summary projections between daily reports, the project report and PDF; preserve confirmation-time prices and flags so weighted averages cannot hide individual discrepancies.