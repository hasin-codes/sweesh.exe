# 🚀 Quick Start: macOS Release Checklist

## ⚡ TL;DR - Get macOS Support in 5 Steps

```bash
# 1. Commit changes
git add .
git commit -m "feat: Add macOS and Linux support"
git push origin main

# 2. Create version tag
npm version patch  # Creates v1.4.3

# 3. Push tag (triggers automated build)
git push origin --tags

# 4. Wait 15-20 minutes for GitHub Actions

# 5. Check Releases tab for .dmg files
```

That's it! GitHub Actions will:
- ✅ Auto-generate macOS icon (.icns)
- ✅ Build for Windows, macOS (Intel + Apple Silicon), Linux
- ✅ Create GitHub Release with all files
- ✅ No Mac computer needed!

---

## 📋 Pre-Flight Checklist

### Before You Push

- [ ] All changes committed?
  ```bash
  git status  # Should show clean working tree
  ```

- [ ] Version number ready?
  ```bash
  # Current: 1.4.2
  # Next: 1.4.3 (patch)
  npm version patch
  ```

- [ ] GitHub Actions enabled?
  - Go to repo Settings → Actions → "Allow all actions"

### Files Created
- [ ] `entitlements.mac.plist` ✅
- [ ] `.github/workflows/release.yml` ✅
- [ ] `.github/workflows/test-build.yml` ✅
- [ ] `scripts/generate-macos-icon.sh` ✅
- [ ] `MACOS_SUPPORT.md` ✅
- [ ] `RELEASE_NOTES_v1.4.3.md` ✅

### Files Updated
- [ ] `package.json` - macOS config ✅
- [ ] `README.md` - macOS instructions ✅

---

## 🎯 The Commands You Need

### To Release
```bash
# Option 1: Automatic version bump
npm version patch
git push origin --tags

# Option 2: Manual tag
git tag v1.4.3
git push origin v1.4.3
```

### To Monitor
1. GitHub repo → **Actions** tab
2. Watch "Build & Release" workflow
3. (~15-20 minutes)

### To Verify
1. GitHub repo → **Releases** tab
2. Should see `v1.4.3` with:
   - `Sweesh-Setup-1.4.3.exe` (Windows)
   - `Sweesh-1.4.3.dmg` (macOS Universal)
   - `Sweesh-1.4.3-arm64.dmg` (Apple Silicon)
   - `Sweesh-1.4.3-x64.dmg` (Intel Mac)
   - `Sweesh-1.4.3.AppImage` (Linux)

---

## 🔧 Optional: Generate Icon Manually

### If You Want to Generate .icns Before Pushing

**Option A: Online (Easiest)**
1. https://cloudconvert.com/png-to-icns
2. Upload `public/icons/logo.png`
3. Download → Save as `public/icons/logo.icns`

**Option B: Script (macOS/Linux)**
```bash
chmod +x scripts/generate-macos-icon.sh
./scripts/generate-macos-icon.sh
```

**Option C: Skip It**
- GitHub Actions will generate it automatically
- No action needed!

---

## ⚠️ Common Issues

### "GitHub Actions not running"
**Fix:**
- Settings → Actions → "Allow all actions"
- Push tag again

### "Build failed"
**Check:**
- Actions tab → Click failed workflow
- Read error message
- Usually auto-fixes on retry

### "No .dmg files"
**Wait:**
- Build takes 15-20 minutes
- Check Actions tab for progress

---

## ✅ Success Indicators

You'll know it worked when you see:

1. **Actions Tab:**
   - ✅ Green checkmark on "Build & Release"
   - ✅ All 3 jobs complete (macOS, Windows, Linux)

2. **Releases Tab:**
   - ✅ New release `v1.4.3`
   - ✅ 8+ files attached (exe, dmg, AppImage, etc.)
   - ✅ Release notes auto-generated

3. **Downloads:**
   - ✅ Can download .dmg files
   - ✅ Files are ~40-80 MB each
   - ✅ Windows .exe still works

---

## 🎉 After Release

### Announce to Users
```markdown
🎉 Sweesh v1.4.3 is out with macOS support!

Windows: Sweesh-Setup-1.4.3.exe
macOS (Apple Silicon): Sweesh-1.4.3-arm64.dmg
macOS (Intel): Sweesh-1.4.3-x64.dmg
Linux: Sweesh-1.4.3.AppImage

Full release notes: [link to release]
```

### Get Feedback
- Ask macOS users to test
- Monitor GitHub Issues
- Iterate based on feedback

---

## 📚 Need More Info?

- **Quick overview:** This file
- **Implementation details:** [MACOS_IMPLEMENTATION_SUMMARY.md](MACOS_IMPLEMENTATION_SUMMARY.md)
- **macOS troubleshooting:** [MACOS_SUPPORT.md](MACOS_SUPPORT.md)
- **Full documentation:** [README.md](README.md)

---

## 🚀 Ready? Let's Go!

```bash
# The magic commands:
git add .
git commit -m "feat: Add macOS and Linux support"
git push origin main
npm version patch
git push origin --tags

# Then sit back and watch GitHub Actions do the work! ✨
```

---

**Time required:** 5 minutes (you) + 20 minutes (GitHub Actions)  
**Mac required:** No!  
**Cost:** $0 (GitHub Actions is free)  
**Result:** Cross-platform app supporting Windows, macOS, and Linux! 🎉

