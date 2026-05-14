# Packaging & Distribution Guide

This guide covers building and packaging **Markdown Workspace** for Windows, macOS, and Linux.

## Prerequisites

- Node.js 16+ and npm
- Familiarity with command line
- Platform-specific requirements (see below)

## Quick Build

### Development Build
```bash
npm install
npm run dev
```

### Production Build (All Platforms)
```bash
npm run build
npm run package:all
```

This will create installers/binaries for Windows, macOS, and Linux in the `dist/` folder.

---

## Platform-Specific Instructions

### Windows

**Requirements:**
- Windows 7 or later
- For code signing: Windows code signing certificate (optional)

**Build Steps:**

```bash
# Install dependencies (if not done)
npm install

# Build production binaries
npm run package:win
```

**Output Files:**
- `dist/Markdown Workspace Setup 0.1.0.exe` — NSIS installer
- `dist/Markdown Workspace 0.1.0 portable.exe` — Portable executable (no installation needed)
- `dist/markdown-workspace-0.1.0.zip` — Zip archive

**NSIS Installer Features:**
- Installs to `Program Files\Markdown Workspace`
- Creates Start Menu shortcuts
- Creates Desktop shortcut
- Supports uninstall via Control Panel
- Multi-language support available (customize in `package.json` nsis section)

**Code Signing (Optional):**
To sign the executable, update `package.json`:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "your-password",
  "signingHashAlgorithms": ["sha256"]
}
```

---

### macOS

**Requirements:**
- macOS 10.12 (Sierra) or later
- For distribution: Apple Developer account
- For code signing: macOS code signing certificate (optional)

**Build Steps:**

```bash
# Build for macOS
npm run package:mac
```

**Output Files:**
- `dist/Markdown Workspace-0.1.0.dmg` — DMG installer (double-click to install)
- `dist/Markdown Workspace-0.1.0.zip` — Zip archive

**Installation:**
Users can:
1. Double-click the `.dmg` file
2. Drag the app icon to Applications folder
3. Or unzip and run directly

**Notarization (Required for App Store Distribution):**

If you plan to distribute via App Store or need notarization:

1. Create an Apple Developer account at https://developer.apple.com
2. Generate app-specific password in your Apple ID security settings
3. Update `package.json`:
   ```json
   "mac": {
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "assets/entitlements.mac.plist",
     "entitlementsInherit": "assets/entitlements.mac.plist",
     "identity": "Your Apple Developer Identity"
   }
   ```
4. Create `assets/entitlements.mac.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
     <true/>
     <key>com.apple.security.files.user-selected.read-write</key>
     <true/>
   </dict>
   </plist>
   ```

---

### Linux

**Requirements:**
- Linux (Ubuntu, Fedora, Debian, etc.)
- Can build on any Linux, but test on your target distribution

**Build Steps:**

```bash
# Build for Linux
npm run package:linux
```

**Output Files:**
- `dist/Markdown Workspace-0.1.0.AppImage` — Single executable (works on most distributions)
- `dist/markdown-workspace-0.1.0.deb` — Debian/Ubuntu package

**AppImage:**
- Universal format, works on most Linux distros
- No install needed; just mark executable and run
- Users can double-click to run

**DEB Package (Debian/Ubuntu):**
```bash
# Install .deb
sudo dpkg -i dist/markdown-workspace-0.1.0.deb

# Or via app store integration
sudo apt install ./dist/markdown-workspace-0.1.0.deb
```

Creates menu entry and integrates with system package manager.

---

## Advanced Configuration

### Custom App Icons

Creating proper app icons is essential for distribution. File requirements:

**macOS:**
- `assets/icon.icns` (1024×1024 or larger)

**Windows:**
- `assets/icon.ico` (256×256 or larger)

**Linux:**
- `assets/icon.png` (512×512 or larger)

**Create Icons:**

Option 1: Use online tools
- https://www.icoconvert.com/ (PNG → ICO)
- https://convertio.co/icns-converter/ (PNG → ICNS)

Option 2: Use imagemagick:
```bash
# PNG → ICO
convert assets/icon.png -define icon:auto-resize=256,128,96,64,48,32,16 assets/icon.ico

# PNG → ICNS (macOS)
sips -s format icns assets/icon.png --out assets/icon.icns
```

### Environment Variables for Building

```bash
# Custom app ID
npm run build -- --appId=com.yourorganization.appname

# Sign code (macOS)
APPLE_ID=your@apple.com APPLE_ID_PASSWORD=your-app-password npm run package:mac

# Proxy settings (if behind corporate firewall)
npm config set https-proxy http://proxy.example.com:8080
npm run build
```

### CI/CD Integration

**GitHub Actions Example:**

Create `.github/workflows/build.yml`:

```yaml
name: Build & Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm run package
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Distribution Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Add app icons to `assets/`
- [ ] Test app on target platform(s)
- [ ] Run `npm run build && npm run package:all`
- [ ] Test installers on fresh machines
- [ ] Code-sign if required by platform
- [ ] Create GitHub release with binaries
- [ ] Update readme with download links
- [ ] Test auto-update mechanism (if implemented)

---

## Troubleshooting

### Build fails on Windows
- Ensure Visual Studio Build Tools or full Visual Studio is installed
- Check `node-gyp` dependencies for native modules
- Try: `npm install --global --production windows-build-tools`

### macOS signing issues
- Verify certificate in Keychain
- Check entitlements file format (XML plist)
- Try: `security find-identity -v -p codesigning`

### Linux AppImage compatibility
- Test on multiple distributions (Ubuntu, Fedora, Arch)
- Some systems may require GLIBC updates
- Fallback to portable zip for maximum compatibility

### Code signing certificate problems
- Ensure certificate validity (check expiration)
- Verify certificate is in correct system store
- For Windows: use PowerShell as admin
- For macOS: check Keychain certificate details

---

## Auto-Updates (Future Enhancement)

To enable auto-updates, integrate `electron-updater`:

```bash
npm install electron-updater
```

Then in main.ts:
```typescript
import { autoUpdater } from 'electron-updater'
autoUpdater.checkForUpdatesAndNotify()
```

Host releases on GitHub or S3 for distribution.

---

## Support & Resources

- **Electron Builder Docs:** https://www.electron.build/
- **Electron Security:** https://www.electronjs.org/docs/tutorial/security
- **Apple Developer:** https://developer.apple.com/
- **Windows Code Signing:** https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography
