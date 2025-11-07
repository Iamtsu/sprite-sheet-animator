#!/bin/bash

# Release script for sprite-sheet-animator
# Automatically determines version bump based on conventional commits
# Usage: ./release.sh [--dry-run]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}Running in DRY RUN mode - no changes will be made${NC}"
fi

echo -e "${GREEN}Starting release process...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: Working directory is not clean. Commit or stash changes first.${NC}"
    git status --short
    exit 1
fi

# Make sure we're on develop branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${YELLOW}Warning: Not on develop branch (currently on $CURRENT_BRANCH)${NC}"
    read -p "Switch to develop branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout develop
    else
        echo -e "${RED}Aborted${NC}"
        exit 1
    fi
fi

# Pull latest changes
echo -e "${GREEN}Pulling latest changes from develop...${NC}"
if [ "$DRY_RUN" = false ]; then
    git pull origin develop
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}Current version: ${CURRENT_VERSION}${NC}"

# Find the last release tag
LAST_TAG=$(git describe --tags --match "v[0-9]*" --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
    echo -e "${YELLOW}No previous release tag found. Analyzing all commits...${NC}"
    COMMIT_RANGE="HEAD"
else
    echo -e "${GREEN}Last release: ${LAST_TAG}${NC}"
    COMMIT_RANGE="${LAST_TAG}..HEAD"
fi

# Get commits since last release
echo -e "${BLUE}Analyzing commits since last release...${NC}"
COMMITS=$(git log $COMMIT_RANGE --pretty=format:"%s" --no-merges)

if [ -z "$COMMITS" ]; then
    echo -e "${YELLOW}No new commits since last release${NC}"
    echo -e "${YELLOW}Nothing to release${NC}"
    exit 0
fi

echo -e "${BLUE}Commits to be released:${NC}"
echo "$COMMITS" | while IFS= read -r commit; do
    echo -e "  ${BLUE}•${NC} $commit"
done
echo ""

# Determine version bump based on conventional commits
HAS_BREAKING=false
HAS_FEAT=false
HAS_FIX=false

while IFS= read -r commit; do
    # Check for breaking changes
    if [[ $commit =~ ^[a-z]+(\([a-z]+\))?!: ]] || [[ $commit =~ BREAKING[[:space:]]CHANGE ]]; then
        HAS_BREAKING=true
    fi
    # Check for features
    if [[ $commit =~ ^feat(\([a-z]+\))?: ]]; then
        HAS_FEAT=true
    fi
    # Check for fixes
    if [[ $commit =~ ^fix(\([a-z]+\))?: ]]; then
        HAS_FIX=true
    fi
done <<< "$COMMITS"

# Determine bump type
if [ "$HAS_BREAKING" = true ]; then
    BUMP_TYPE="major"
    echo -e "${RED}🔥 Breaking changes detected → MAJOR version bump${NC}"
elif [ "$HAS_FEAT" = true ]; then
    BUMP_TYPE="minor"
    echo -e "${GREEN}✨ New features detected → MINOR version bump${NC}"
elif [ "$HAS_FIX" = true ]; then
    BUMP_TYPE="patch"
    echo -e "${YELLOW}🐛 Bug fixes detected → PATCH version bump${NC}"
else
    BUMP_TYPE="patch"
    echo -e "${YELLOW}📦 Changes detected → PATCH version bump (default)${NC}"
fi

# Use npm version to bump version (it updates package.json and package-lock.json)
echo -e "${GREEN}Bumping ${BUMP_TYPE} version...${NC}"
if [ "$DRY_RUN" = true ]; then
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version --dry-run | tail -n 1)
else
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
fi
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix

echo -e "${GREEN}New version: ${CURRENT_VERSION} → ${NEW_VERSION}${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN: Would bump version to ${NEW_VERSION}${NC}"
    echo -e "${YELLOW}DRY RUN: Stopping here. Run without --dry-run to perform release.${NC}"
    exit 0
fi

# Commit version bump to develop
echo -e "${GREEN}Committing version bump to develop...${NC}"
git add package.json package-lock.json
git commit -m "$(cat <<EOF
chore: Bump version to ${NEW_VERSION}

Release ${BUMP_TYPE} version ${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push develop
echo -e "${GREEN}Pushing develop branch...${NC}"
git push origin develop

# Checkout main and merge develop
echo -e "${GREEN}Checking out main branch...${NC}"
git checkout main

echo -e "${GREEN}Pulling latest changes from main...${NC}"
git pull origin main

echo -e "${GREEN}Merging develop into main...${NC}"
git merge develop --no-edit

# Push main
echo -e "${GREEN}Pushing main branch...${NC}"
git push origin main

# Create a git tag for the version
echo -e "${GREEN}Creating git tag v${NEW_VERSION}...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release version ${NEW_VERSION}"
git push origin "v${NEW_VERSION}"

# Go back to develop
echo -e "${GREEN}Switching back to develop branch...${NC}"
git checkout develop

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Release complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Version: ${CURRENT_VERSION} → ${NEW_VERSION} (${BUMP_TYPE})${NC}"
echo -e "${GREEN}Tag: v${NEW_VERSION}${NC}"
echo -e "${GREEN}GitHub Actions will now build the release${NC}"
echo -e "${GREEN}View releases: https://github.com/Iamtsu/sprite-sheet-animator/releases${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
