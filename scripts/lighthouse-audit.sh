#!/bin/bash
# ===========================================
# THE UNSAID - Lighthouse Audit Script
# ===========================================
# Runs Lighthouse audits on key pages and generates reports
# Prerequisites: Chrome installed, dev server running on port 5173

set -e

# Configuration
OUTPUT_DIR="lighthouse-reports"
BASE_URL="http://localhost:5173"
DATE_SUFFIX=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🔍 The Unsaid - Lighthouse Audit${NC}"
echo "================================================"
echo ""

# Check if Lighthouse is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Check if the dev server is running
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Dev server not detected at $BASE_URL${NC}"
    echo "Starting dev server in background..."
    echo "(Run 'pnpm dev' in another terminal if this fails)"
    echo ""
fi

# Pages to audit (public pages only - authenticated pages require special handling)
declare -a PAGES=(
    "/|home"
    "/login|login"
    "/signup|signup"
)

# Function to run Lighthouse on a page
run_lighthouse() {
    local path=$1
    local name=$2
    local url="$BASE_URL$path"

    echo -e "${BLUE}📊 Auditing: $name ($url)${NC}"

    # Run Lighthouse with CI-friendly settings
    npx lighthouse "$url" \
        --output=html,json \
        --output-path="$OUTPUT_DIR/${name}_${DATE_SUFFIX}" \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --only-categories=performance,accessibility,best-practices,seo \
        --quiet \
        2>/dev/null || {
            echo -e "${YELLOW}  ⚠️  Lighthouse audit failed for $name${NC}"
            return 1
        }

    echo -e "${GREEN}  ✓ Report saved${NC}"
}

# Run audits
echo "Running Lighthouse audits..."
echo ""

for page_entry in "${PAGES[@]}"; do
    IFS='|' read -r path name <<< "$page_entry"
    run_lighthouse "$path" "$name"
    echo ""
done

# Generate summary
echo "================================================"
echo -e "${GREEN}✅ Audits complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo ""

# Parse and display results from JSON files
for json_file in "$OUTPUT_DIR"/*_${DATE_SUFFIX}.report.json; do
    if [ -f "$json_file" ]; then
        name=$(basename "$json_file" | sed "s/_${DATE_SUFFIX}.report.json//")

        # Extract scores using node (more reliable than jq which may not be installed)
        scores=$(node -e "
            const fs = require('fs');
            const data = JSON.parse(fs.readFileSync('$json_file', 'utf8'));
            const perf = Math.round((data.categories.performance?.score || 0) * 100);
            const a11y = Math.round((data.categories.accessibility?.score || 0) * 100);
            const bp = Math.round((data.categories['best-practices']?.score || 0) * 100);
            const seo = Math.round((data.categories.seo?.score || 0) * 100);
            console.log(perf + '|' + a11y + '|' + bp + '|' + seo);
        " 2>/dev/null) || continue

        IFS='|' read -r perf a11y bp seo <<< "$scores"

        # Color-code scores
        score_color() {
            local score=$1
            if [ "$score" -ge 90 ]; then
                echo -e "${GREEN}$score${NC}"
            elif [ "$score" -ge 50 ]; then
                echo -e "${YELLOW}$score${NC}"
            else
                echo -e "${RED}$score${NC}"
            fi
        }

        printf "  %-12s Perf: %s  A11y: %s  BP: %s  SEO: %s\n" \
            "$name" \
            "$(score_color $perf)" \
            "$(score_color $a11y)" \
            "$(score_color $bp)" \
            "$(score_color $seo)"
    fi
done

echo ""
echo "Reports saved to: $OUTPUT_DIR/"
echo ""
echo "To view HTML reports:"
echo "  open $OUTPUT_DIR/*_${DATE_SUFFIX}.report.html"
echo ""
echo "Score guide:"
echo -e "  ${GREEN}90-100${NC} = Good"
echo -e "  ${YELLOW}50-89${NC}  = Needs Improvement"
echo -e "  ${RED}0-49${NC}   = Poor"
