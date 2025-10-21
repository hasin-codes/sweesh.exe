# GitHub Actions Release Guide

## Overview
This project uses GitHub Actions to automatically build and publish releases for Windows, macOS, and Linux when you push a version tag.

## Prerequisites

### 1. GitHub Personal Access Token (PAT)
You need to add a GitHub Personal Access Token to your repository secrets.

**Creating the Token:**
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure the token:
   - **Name**: `Sweesh Release Token`
   - **Expiration**: 90 days or No expiration (your choice)
   - **Scopes**: Check `repo` (all sub-scopes)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again!)

### 2. Add Token to Repository Secrets
1. Go to your repository: `https://github.com/hasin-codes/sweesh.exe`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `GH_TOKEN`
   - **Secret**: Paste your Personal Access Token
5. Click **Add secret**

## How to Trigger a Release

### Method 1: Push a Version Tag (Recommended)

```bash
# 1. Update version in package.json
# Example: "version": "0.0.1" → "version": "1.0.0"

# 2. Commit the version change
git add package.json
git commit -m "Bump version to 1.0.0"

# 3. Create and push a tag
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

The workflow will automatically trigger when you push a tag matching `v*.*.*` (e.g., `v1.0.0`, `v1.2.3`).

### Method 2: Manual Trigger

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Release** workflow in the left sidebar
4. Click **Run workflow** button
5. Select the branch (usually `main`)
6. Click **Run workflow**

**Note**: Manual trigger will build but may not publish properly without a version tag.

## What Happens During Release

### Build Matrix
The workflow builds on three platforms simultaneously:
- **Ubuntu (Linux)**: Creates `.AppImage` and `.deb` files
- **Windows**: Creates `.exe` installer and `.zip` portable
- **macOS**: Creates `.dmg` installer and `.zip` package

### Build Steps
1. **Checkout code** from the repository
2. **Setup Node.js** (v20) with npm caching
3. **Install system dependencies** (Linux only - libsecret for encryption)
4. **Install npm dependencies** with `npm ci`
5. **Build the app** with `npm run rebuild`
6. **Package and publish** platform-specific installers

### Publishing
- All artifacts are automatically uploaded to GitHub Releases
- The release is created as a draft (you need to publish it manually)
- Update metadata files (`.yml`) are included for auto-updater

## Monitoring the Release

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Monitor each platform's build progress
4. Check for any errors in the logs

### Common Issues

**Issue**: `GH_TOKEN is not set`
- **Solution**: Verify the secret is named exactly `GH_TOKEN` in repository secrets

**Issue**: Build fails on a specific platform
- **Solution**: Check the logs for that platform. The workflow is set to `fail-fast: false`, so other platforms will continue building

**Issue**: Permission denied when publishing
- **Solution**: Ensure your PAT has `repo` scope and hasn't expired

## After the Build Completes

1. Go to your repository's **Releases** page
2. Find the draft release with your version tag
3. Review the uploaded files:
   - Windows: `Sweesh Setup X.X.X.exe`, `Sweesh-X.X.X-win.zip`, `latest.yml`
   - macOS: `Sweesh-X.X.X.dmg`, `Sweesh-X.X.X-mac.zip`, `latest-mac.yml`
   - Linux: `Sweesh-X.X.X.AppImage`, `sweesh_X.X.X_amd64.deb`, `latest-linux.yml`
4. Edit the release notes (describe what's new)
5. Click **Publish release**

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., `1.0.0`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Examples:
- `v0.0.1` → `v0.0.2` (bug fix)
- `v0.0.1` → `v0.1.0` (new feature)
- `v0.0.1` → `v1.0.0` (first stable release or breaking changes)

## Workflow File Location

The workflow configuration is in: `.github/workflows/release.yml`

## Workflow Configuration

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'        # Triggers on version tags
  workflow_dispatch:     # Allows manual trigger

jobs:
  build:
    name: Build and Release on ${{ matrix.os }}
    permissions:
      contents: write    # Required to create releases
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false   # Continue other builds if one fails
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
```

## Environment Variables

The workflow uses these environment variables:
- `GH_TOKEN`: GitHub Personal Access Token (from repository secrets)
- Platform-specific variables are automatically set by GitHub Actions

## Security Notes

- ✅ The `GH_TOKEN` is stored securely in GitHub Secrets
- ✅ The token is only accessible during workflow execution
- ✅ The token is not exposed in logs
- ✅ Each platform builds in an isolated environment

## Troubleshooting

### View Build Logs
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the failed job (e.g., "Build and Release on windows-latest")
4. Expand the failed step to see detailed logs

### Common Fixes

**npm ci fails:**
```bash
# Ensure package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

**Electron builder fails:**
- Check that `package.json` has correct build configuration
- Verify all files referenced in `package.json` exist
- Check platform-specific requirements (e.g., icons)

**macOS code signing issues:**
- macOS builds may require code signing certificates
- For testing, you can skip code signing (not recommended for production)

## Manual Local Testing

Before pushing a tag, test the build locally:

```bash
# Clean build
npm run clean
npm install

# Test build
npm run rebuild

# Test packaging (without publishing)
npx electron-builder -w --publish never  # Windows
npx electron-builder -l --publish never  # Linux
npx electron-builder -m --publish never  # macOS
```

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## Quick Checklist

Before releasing:
- [ ] Update version in `package.json`
- [ ] Test the app locally (`npm run dev`)
- [ ] Commit all changes
- [ ] Create and push version tag (e.g., `v1.0.0`)
- [ ] Monitor GitHub Actions build
- [ ] Verify all platforms built successfully
- [ ] Publish the draft release on GitHub
- [ ] Test the auto-updater with the new release

---

**Last Updated**: Based on current workflow configuration
**Workflow Status**: [![Release](https://github.com/hasin-codes/sweesh.exe/actions/workflows/release.yml/badge.svg)](https://github.com/hasin-codes/sweesh.exe/actions/workflows/release.yml)

