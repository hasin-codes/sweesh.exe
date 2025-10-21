# Quick Start: Auto-Updates 🚀

## Step 1: Create GitHub Token (5 minutes)

1. **Go to**: https://github.com/settings/tokens/new
2. **Settings**:
   - Note: `Sweesh Auto-Updater`
   - Expiration: 90 days (or your choice)
   - Scope: ✅ `repo` (check this box)
3. **Click**: Generate token
4. **Copy the token** (you won't see it again!)

## Step 2: Set Environment Variable (2 minutes)

**Windows (PowerShell) - RECOMMENDED:**
```powershell
[Environment]::SetEnvironmentVariable("GH_TOKEN", "your_token_here", "User")
```

**Important**: Replace `your_token_here` with your actual token!

**Then RESTART your terminal/IDE** (VS Code, etc.)

## Step 3: Verify Token (1 minute)

After restarting your terminal:

```powershell
# Should display your token
echo $env:GH_TOKEN
```

If you see your token, you're good to go! ✅

## Step 4: Build & Publish First Release (5 minutes)

```bash
# Make sure version is set in package.json
# "version": "1.0.0"

# Build and publish to GitHub
npm run release
```

This will:
- Build the app
- Upload to GitHub releases
- Create a draft release

## Step 5: Publish on GitHub (2 minutes)

1. Go to: https://github.com/hasin-codes/sweesh.exe/releases
2. Find the draft release
3. Add release notes (optional)
4. Click **Publish release**

## ✅ Done!

Your app now:
- ✅ Checks for updates on every app start
- ✅ Downloads updates automatically
- ✅ Installs updates when you quit the app

## Testing Updates

1. **Install v1.0.0** from GitHub releases
2. **Update package.json** to `"version": "1.0.1"`
3. **Run** `npm run release`
4. **Publish** the new release on GitHub
5. **Open the installed v1.0.0 app**
6. **Check logs** - it should download v1.0.1
7. **Quit and reopen** - you're now on v1.0.1!

## Need Help?

See `AUTO_UPDATE_SETUP.md` for the complete guide with troubleshooting.

## Logs Location

**Windows**: `%APPDATA%\sweesh\logs\main.log`

Check this file if updates aren't working.

---

**Total Setup Time**: ~15 minutes ⏱️

