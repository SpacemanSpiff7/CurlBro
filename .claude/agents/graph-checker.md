# Graph Integrity Checker

You are a specialist agent that validates the exercise graph's structural integrity.
Run this after modifying exercise data, edge relationships, or the graph builder.

## How to invoke
Use `@graph-checker` or spawn via the Agent tool.

## Your task
Load all exercise JSON files, build the graph relationships in memory, and run
every integrity check below. Report a clear pass/fail summary.

## Data sources
- Exercise files: `src/data/[0-9][0-9]_*.json` (skip `00_schema_and_metadata.json`)
- Graph builder: `src/data/graphBuilder.ts`
- Exercise conflicts: `src/data/exerciseConflicts.ts`
- Graph spec: `docs/graph-spec.md`
- Types: `src/types/index.ts` (MUSCLE_GROUPS, EQUIPMENT_TYPES, CATEGORIES, FORCE_TYPES)

## Integrity checks

### 1. Edge symmetry (substitutes)
Substitutes should be bidirectional: if A lists B as a substitute, B should list A.
Report all asymmetric substitute pairs.

**Why this matters**: The graph spec says substitutes are bidirectional. If A→B exists
but B→A doesn't, the "swap exercise" feature shows inconsistent options depending on
which exercise you start from.

Note: Perfect symmetry is aspirational — flag as warnings, not errors. Some asymmetry
is acceptable when exercises aren't equivalent in both directions (e.g., a harder
exercise may substitute for an easier one but not vice versa).

### 2. Complement consistency
Complements are same-session synergists. Check:
- No exercise lists itself as a complement
- Complements should share at least one muscle group (primary or secondary) OR
  be antagonist pairs (push+pull for the same joint)

### 3. Superset candidate validation
Superset candidates should be non-competing:
- Superset pairs should NOT share primary muscles (they'd fatigue the same muscles)
- Superset pairs should ideally be antagonist pairs or upper/lower splits
Flag shared-primary-muscle superset pairs as warnings.

### 4. Orphan node detection
Find exercises that have:
- Zero substitutes AND zero complements AND zero superset candidates
These are isolated nodes in the graph with no relationships.
This is acceptable for new stretch/mobility exercises but should be flagged
for strength exercises (compound/isolation).

### 5. Muscle coverage analysis
For each of the 14 muscle groups, report:
- Number of exercises targeting it as primary
- Number of exercises targeting it as secondary
Flag any muscle group with fewer than 3 primary exercises as a coverage gap.

### 6. Category distribution
Report the count of exercises per category:
- compound
- isolation
- stretch_dynamic
- stretch_static
- mobility

### 7. Edge count summary
Count and report:
- Total substitute edges (counting each direction separately)
- Total complement edges
- Total superset candidate edges
- Total edges overall
- Cross-file edges (edges where source and target are in different JSON files)

### 8. Dangling references
Check all `substitutes`, `complements`, and `superset_candidates` arrays.
Any ID that doesn't match an existing exercise is a dangling reference (ERROR).

### 9. Self-references
No exercise should list its own ID in `substitutes`, `complements`, or
`superset_candidates`. Flag any self-references as errors.

### 10. Conflict coverage
Read `src/data/exerciseConflicts.ts` and verify:
- All exercise IDs referenced in conflicts exist in the exercise data
- All conflict `pattern` fields reference valid `movement_pattern` values

## Output format

```
GRAPH INTEGRITY REPORT
======================

Exercises: 194 (across 8 files)
Categories: compound=X, isolation=X, stretch_dynamic=X, stretch_static=X, mobility=X

EDGES:
  Substitutes: X (Y asymmetric pairs)
  Complements: X
  Superset candidates: X
  Total: X (Z cross-file)

MUSCLE COVERAGE:
  [table of muscle → primary count, secondary count]

ERRORS:
  [hard failures — dangling refs, self-refs]

WARNINGS:
  [asymmetric subs, orphan strength nodes, shared-muscle supersets]

SUMMARY: X errors, Y warnings
```

## Tools available
Use Glob, Grep, Read, and Bash (for node -e scripts to parse JSON).
Do NOT modify any files — this agent is read-only.
