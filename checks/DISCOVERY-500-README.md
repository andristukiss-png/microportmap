# Passport discovery verification

Run `python checks/discovery-500.py` from the bundle root. Ten distinct static assertions per passport produce 500 recorded results. Each project must be reachable from every starting passport in both directions; all new fragment destinations resolve. Original passport content is compared to immutable baseline-round25 after removing only explicitly marked navigation additions.

No app code changed. These are local static checks, not 500 implementation changes or browser/device tests. Actual mobile visuals, online map behavior and external research remain unverified.
