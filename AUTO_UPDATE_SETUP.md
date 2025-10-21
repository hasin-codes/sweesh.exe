# Auto-Update Setup Guide 🚀

This guide will help you set up auto-updates for Sweesh using GitHub Releases and electron-updater.

## ✅ What's Already Configured

The following has been implemented in your app:

### 1. Dependencies Installed
- ✅ `electron-updater` (v6.6.2)
- ✅ `electron-log` (v5.4.3)

### 2. Package.json Configuration
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "hasin-codes",
        "repo": "sweesh.exe"
      }
    ]
  }
}
```

### 3. Auto-Updater Implementation
- ✅ Auto-update checks on app start (3 second delay)
- ✅ Automatic download when update is available
- ✅ Auto-install on app quit
- ✅ Detailed logging with electron-log
- ✅ Update status notifications to UI
- ✅ Disabled in development mode for safety

### 4. Available Scripts
```bash
npm run dist        # Build for current platform
npm run dist:win    # Build for Windows
npm run dist:mac    # Build for macOS
npm run dist:linux  # Build for Linux
npm run release     # Build and publish to GitHub
```

## 🔧 GitHub Token Setup (Required)

To publish releases to GitHub, you need to create a Personal Access Token (PAT).

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Set the following:
   - **Note**: `Sweesh Auto-Updater`
   - **Expiration**: Choose your preference (recommended: 90 days)
   - **Scopes**: Check `repo` (this gives full control of private repositories)

3. Click **Generate token**
4. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### Step 2: Set the Token as Environment Variable

#### On Windows (PowerShell - Recommended):

```powershell
# Set for current user (permanent)
[Environment]::SetEnvironmentVariable("GH_TOKEN", "your_token_here", "User")

# Verify it's set
$env:GH_TOKEN

# Restart your terminal/IDE for changes to take effect
```

#### On Windows (Command Prompt):

```cmd
setx GH_TOKEN "your_token_here"
```

#### On macOS/Linux:

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export GH_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc

# Or for zsh
echo 'export GH_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Verify Token is Set

**Restart your terminal/IDE**, then run:

```bash
# Windows (PowerShell)
echo $env:GH_TOKEN

# macOS/Linux
echo $GH_TOKEN
```

You should see your token printed.

## 📦 Building and Publishing a Release

### First Release (v1.0.0)

1. **Update version in package.json**:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Build and publish**:
   ```bash
   npm run release
   ```

   This will:
   - Build the app for your current platform
   - Generate update metadata files (`latest.yml`, `latest-mac.yml`, etc.)
   - Upload the installers and metadata to GitHub Releases
   - Create a draft release on GitHub

3. **Publish the release on GitHub**:
   - Go to: https://github.com/hasin-codes/sweesh.exe/releases
   - Find the draft release
   - Edit the release notes if needed
   - Click **Publish release**

### Subsequent Releases

1. **Update the version**:
   ```json
   {
     "version": "1.0.1"  // or 1.1.0, 2.0.0, etc.
   }
   ```

2. **Build and publish**:
   ```bash
   npm run release
   ```

3. **Publish on GitHub** (same as above)

## 🔄 How Auto-Updates Work

### On App Start:
```
1. App checks GitHub releases (after 3 seconds)
2. If new version available → Download automatically
3. Show notification to user
4. When user quits app → Update is installed
```

### Update Flow:
```
App Start
    ↓
Check for Updates (3s delay)
    ↓
Update Available?
    ├─ Yes → Download in background
    │        ↓
    │    Download Complete
    │        ↓
    │    Install on Quit
    │
    └─ No → Continue normally
```

### Logs Location:
Updates are logged to:
- **Windows**: `%USERPROFILE%\AppData\Roaming\sweesh\logs\main.log`
- **macOS**: `~/Library/Logs/sweesh/main.log`
- **Linux**: `~/.config/sweesh/logs/main.log`

## 🎯 Testing Auto-Updates

### Local Testing (Recommended):

1. **Build version 1.0.0** and publish to GitHub
2. **Install the app** from the release
3. **Update to version 1.0.1** in package.json
4. **Build and publish** version 1.0.1
5. **Run the installed 1.0.0 app**
6. **Watch the logs** - it should detect and download 1.0.1
7. **Quit the app** - it should update to 1.0.1 on next launch

### Manual Update Check:

You can also add a "Check for Updates" button in your UI:

```typescript
const handleCheckUpdates = async () => {
  const result = await window.electronAPI.checkForUpdates();
  if (result.success) {
    console.log('Update check completed', result.updateInfo);
  }
};
```

## 📋 Update Metadata Files

electron-builder generates these files:

- **Windows**: `latest.yml`
- **macOS**: `latest-mac.yml`
- **Linux**: `latest-linux.yml`

These files contain:
- Latest version number
- Download URLs
- File checksums (SHA-512)
- Release date

**IMPORTANT**: These files MUST be uploaded to GitHub along with your installers!

## 🔒 Code Signing (Important for macOS)

According to [electron-builder documentation](https://www.electron.build/auto-update.html):

> Code signing is required on macOS
> 
> macOS application must be signed in order for auto updating to work.

For Windows, code signing is recommended but not required.

## 🚨 Common Issues

### Issue: "Cannot publish - GH_TOKEN not set"
**Solution**: Set the `GH_TOKEN` environment variable and restart your terminal/IDE

### Issue: "Update check fails silently"
**Solution**: Check the logs in `%APPDATA%/sweesh/logs/main.log`

### Issue: "Draft release created but not published"
**Solution**: Go to GitHub releases and manually publish the draft

### Issue: "Update downloaded but not installing"
**Solution**: Make sure `autoInstallOnAppQuit` is enabled (it is by default)

## 📊 Update Status Events

Your app sends these events to the renderer:

| Status | Description |
|--------|-------------|
| `checking` | Checking for updates |
| `available` | Update is available and downloading |
| `downloading` | Download in progress (with progress data) |
| `downloaded` | Update downloaded, will install on quit |
| `not-available` | No updates available |
| `error` | Error occurred during update check |

## 🎨 UI Integration (Optional)

Listen for update events in your React app:

```typescript
useEffect(() => {
  const handleUpdateStatus = (data: any) => {
    switch (data.status) {
      case 'available':
        console.log(`Update v${data.version} available!`);
        break;
      case 'downloading':
        console.log(`Downloading: ${data.progress.percent}%`);
        break;
      case 'downloaded':
        console.log('Update ready! Will install on quit.');
        break;
    }
  };

  window.electronAPI.onUpdateStatus(handleUpdateStatus);
  
  return () => window.electronAPI.removeUpdateListener();
}, []);
```

## 🎯 Next Steps

1. **Set up GitHub token** (see above)
2. **Build your first release**: `npm run release`
3. **Publish on GitHub releases**
4. **Install and test** the auto-update flow
5. **Monitor logs** to ensure updates work correctly

## 📚 Resources

- [electron-updater Documentation](https://www.electron.build/auto-update.html)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Your GitHub Releases](https://github.com/hasin-codes/sweesh.exe/releases)
- [electron-builder Publishing](https://www.electron.build/configuration/publish)

## ✅ Checklist

Before your first release:

- [ ] Created GitHub Personal Access Token
- [ ] Set `GH_TOKEN` environment variable
- [ ] Restarted terminal/IDE
- [ ] Verified token with `echo $env:GH_TOKEN` (Windows) or `echo $GH_TOKEN` (Mac/Linux)
- [ ] Updated version in package.json to 1.0.0
- [ ] Run `npm run release`
- [ ] Published the draft release on GitHub
- [ ] Installed the app from the release
- [ ] Tested update by releasing 1.0.1

---

**Your app is now configured for auto-updates!** 🎉

The auto-updater will:
- ✅ Check for updates every time the app starts
- ✅ Download updates automatically
- ✅ Install updates when the app quits
- ✅ Log everything for debugging

Just make sure to publish new releases on GitHub and bump your version number!

