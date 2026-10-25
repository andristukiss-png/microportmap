# 2,000 cross-view handoff regression cases

Run `node checks/cross-view-2000.cjs` at repository root. This new batch executes 50 original research identities × 10 distinct filter/search URL scenarios × 4 page workflows = **2,000 recorded tests**.

Four workflows cover directory filtered results and history restoration, atlas deep-link/filter/dialog recovery, comparison-to-passport URLs and exact JSON export, and passport-to-comparison return/canonical share/exact export. Search scenarios span country, infrastructure type, region, report year, name/Unicode casing, operator/equipment terms, multi-key intersections, sorting and a known-empty query. A failed initial passport data fetch also exercises retry before export.

The suite uses actual static JS application code with controlled DOM/VM harnesses, not a real browser, online tile server, or independent research audit. It never writes to `src/`, changes a research record, modifies the palette or deploys to Vercel.

Outputs: `checks/cross-view-2000-results.json`, `checks/cross-view-2000-ledger.json` and `checks/cross-view-2000-status.json`. CI uploads generated files as artifacts; successful CI status is execution evidence.
