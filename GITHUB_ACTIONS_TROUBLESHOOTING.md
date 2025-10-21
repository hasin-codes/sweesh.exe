# GitHub Actions Troubleshooting Guide

## Common Error: "The operation was canceled"

### What This Error Means
This error typically occurs when:
1. **Timeout**: The job or a specific step exceeded its time limit
2. **Manual Cancellation**: Someone manually canceled the workflow run
3. **Concurrent Workflow Limits**: GitHub canceled the job due to concurrent run limits
4. **Runner Issues**: The GitHub-hosted runner encountered a problem

### Recent Fixes Applied

We've updated the workflow (`.github/workflows/release.yml`) with these improvements:

#### ✅ Added Timeouts
- **Job-level timeout**: 60 minutes (prevents indefinite running)
- **Step-level timeouts**: Each step has appropriate timeouts
  - Node setup: 5 minutes
  - System dependencies: 5 minutes
  - npm install: 10 minutes
  - Build: 15 minutes
  - Package & publish: 20 minutes per platform

#### ✅ Better Error Handling
- `fail-fast: false` - Other platforms continue building if one fails
- Upload build artifacts on failure for debugging
- Debug steps to show environment information

#### ✅ Platform-Specific Fixes
- Separate debug commands for Windows vs Unix
- Explicit shell configurations
- Linux-specific system dependencies (libsecret)

## How to Diagnose the Issue

### Step 1: Check the Workflow Run
1. Go to: `https://github.com/hasin-codes/sweesh.exe/actions`
2. Click on the failed workflow run
3. Look at which step failed

### Step 2: Review the Logs
Look for these indicators:

**Timeout Error:**
```
Error: The operation was canceled.
```
- **Solution**: The timeout was too short. Increase timeout in workflow file.

**GH_TOKEN Error:**
```
Error: GitHub Personal Access Token is not set
```
- **Solution**: Verify secret is named `GH_TOKEN` in repository settings

**Build Error:**
```
Error: Command failed: ...
```
- **Solution**: Check build logs for specific errors (TypeScript, Webpack, etc.)

### Step 3: Download Artifacts (If Available)
If the build failed, artifacts may be available:
1. Go to the failed workflow run
2. Scroll to "Artifacts" section
3. Download `build-logs-{platform}` to see detailed logs

## Common Solutions

### Solution 1: Increase Timeouts
If builds are taking longer than expected:

```yaml
# In .github/workflows/release.yml
- name: Package and publish (Windows)
  timeout-minutes: 30  # Increase from 20 to 30
  # ... rest of configuration
```

### Solution 2: Verify GH_TOKEN Secret

1. Go to repository settings:
   ```
   https://github.com/hasin-codes/sweesh.exe/settings/secrets/actions
   ```

2. Verify you have a secret named **exactly** `GH_TOKEN` (case-sensitive)

3. If missing or expired, create a new token:
   - Go to: https://github.com/settings/tokens/new
   - Scope: `repo` (full control)
   - Copy the token
   - Add/update the `GH_TOKEN` secret

### Solution 3: Run Workflow Manually
Test the workflow with manual trigger:

1. Go to: `https://github.com/hasin-codes/sweesh.exe/actions`
2. Click "Release" workflow
3. Click "Run workflow" dropdown
4. Select branch (usually `main`)
5. Click "Run workflow"

### Solution 4: Build Only One Platform
If all platforms fail, test with just one:

```yaml
# Temporarily change matrix to test Windows only
matrix:
  os: [windows-latest]  # Comment out: ubuntu-latest, macos-latest
```

### Solution 5: Skip Publishing During Debug
Build without publishing to isolate build issues:

```yaml
# Change --publish always to --publish never
run: npx electron-builder -w --publish never
```

### Solution 6: Check Concurrent Limits
GitHub has limits on concurrent jobs:
- Free tier: 20 concurrent jobs
- Pro: 40 concurrent jobs

If you have many workflows running:
1. Cancel other running workflows
2. Wait for them to complete
3. Re-run the release workflow

## Debug Checklist

Before re-running the workflow:

- [ ] `GH_TOKEN` secret is set correctly
- [ ] Token has `repo` scope
- [ ] Token hasn't expired
- [ ] `package.json` version is updated
- [ ] All code is committed and pushed
- [ ] Tag is pushed (`git push origin v1.0.0`)
- [ ] No other conflicting workflows are running

## Platform-Specific Issues

### Windows Build Issues

**Problem**: PowerShell execution policy errors
```yaml
# Ensure shell is set correctly
shell: powershell
```

**Problem**: Path issues with backslashes
- Use forward slashes in paths
- Use `${{ github.workspace }}` for workspace path

### macOS Build Issues

**Problem**: Code signing required
- For testing, skip code signing (not production-ready)
- For production, add signing certificates to secrets

**Problem**: Notarization fails
- macOS apps must be notarized for distribution
- Add Apple credentials to secrets if needed

### Linux Build Issues

**Problem**: Missing system dependencies
```bash
# Already added to workflow:
sudo apt-get install -y libsecret-1-dev
```

**Problem**: AppImage build fails
- Ensure `AppImage` is listed in targets in `package.json`

## Testing Locally Before GitHub Actions

Prevent CI failures by testing locally:

```bash
# 1. Clean everything
npm run clean
rm -rf node_modules
npm install

# 2. Test build
npm run rebuild

# 3. Test packaging (without publishing)
# Windows
npx electron-builder -w --publish never

# Linux
npx electron-builder -l --publish never

# macOS
npx electron-builder -m --publish never
```

## Workflow Debug Mode

Enable debug logging in GitHub Actions:

1. Go to repository settings
2. Secrets and variables → Actions
3. Add new repository secret:
   - Name: `ACTIONS_STEP_DEBUG`
   - Value: `true`

This provides more detailed logs for troubleshooting.

## Alternative: Build and Upload Manually

If GitHub Actions continues to fail, build locally and upload manually:

```bash
# 1. Set environment variable locally
# Windows PowerShell:
$env:GH_TOKEN = "your_token_here"

# Linux/macOS:
export GH_TOKEN="your_token_here"

# 2. Build and publish
npm run release
```

## Checking Workflow Status

View real-time status with the workflow badge:

```markdown
[![Release](https://github.com/hasin-codes/sweesh.exe/actions/workflows/release.yml/badge.svg)](https://github.com/hasin-codes/sweesh.exe/actions/workflows/release.yml)
```

## Getting Help

If issues persist:

1. **Check GitHub Status**: https://www.githubstatus.com/
   - GitHub Actions may be experiencing outages

2. **Review Logs**: Download and review the build artifacts

3. **Simplify**: Try building with minimal configuration first

4. **Community**: Check GitHub Actions community forums

## Updated Workflow Features

The updated workflow now includes:

✅ **Timeouts** - Prevents indefinite hanging  
✅ **Debug Steps** - Shows environment information  
✅ **Artifact Upload** - Saves logs on failure  
✅ **Better Error Messages** - Platform-specific error handling  
✅ **Manual Trigger** - Test without pushing tags  
✅ **Fail-Safe** - Other platforms continue if one fails  

## Quick Fix Summary

**If you're seeing "operation was canceled":**

1. ✅ We've added timeouts to prevent hanging
2. ✅ We've added debug steps to show what's happening
3. ✅ We've ensured `GH_TOKEN` is passed to each step
4. ✅ We've added artifact uploads to capture logs on failure

**Next steps:**
1. Verify `GH_TOKEN` is in repository secrets
2. Push a new tag to trigger the updated workflow
3. Monitor the debug output in the workflow logs
4. Check the uploaded artifacts if it fails again

## Contact & Resources

- **Workflow File**: `.github/workflows/release.yml`
- **Documentation**: `GITHUB_ACTIONS_RELEASE.md`
- **electron-builder Docs**: https://www.electron.build/
- **GitHub Actions Docs**: https://docs.github.com/en/actions

---

**Last Updated**: After fixing timeout and token passing issues

