# 2,000 visible-field and source-link regression cases

Run `node checks/visible-fields-2000.cjs` from repository root (Node.js, no dependencies). This executes **50 research identities × 10 synthetic field/source variants × 4 UI workflows = 2,000 independently logged cases**.

The four workflows are directory card, atlas result/fallback, atlas drawer and comparison table/JSON export. Checks use actual application scripts in existing controlled DOM/VM harnesses. Each checks relevant data safety/identity, HTML escaping, safe source action handling and navigation; atlas drawer cases also cover focus, inert background and closing.

The ten temporary field variants include unsafe-looking image/script/SVG/iframe strings, ampersands, quotes, Unicode and multiline text, JavaScript-scheme sources and credential-bearing HTTPS URLs. Actual research files and application source code are **not modified**. This is not 2,000 new website features or real browser tests.

The runner writes `checks/visible-fields-2000-results.json`, `checks/visible-fields-2000-ledger.json` and `checks/visible-fields-2000-status.json`. CI retains these as run artifacts; passing CI is the evidence for their execution. The audit doesn't fetch external sources or establish mobile visuals, online tiles, publication accuracy or message delivery.
