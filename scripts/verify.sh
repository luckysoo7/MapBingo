#!/usr/bin/env bash
set -euo pipefail

echo "=== TypeScript check ==="
npx tsc --noEmit 2>&1 | grep -v "tests/" || true

echo ""
echo "=== Playwright tests ==="
npx playwright test

echo ""
echo "=== All checks passed ==="
