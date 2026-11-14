# Fact verification log

Prepared on **14 November 2026**. Some official sites could be read directly; others could only be seen through search results or secondary sources. Anything not confirmed on an official source is either left out of the site or labelled "Reported, not yet verified" / "Check official source".

## Summary

| App | Version shown | Windows support shown as verified | Status |
|---|---|---|---|
| 7-Zip | 26.06 (2026-11-06) | 11, 10, 8, 7 | Verified on 7-zip.org |
| KeePassXC | 2.8.0 (no date) | 11, 10 (7/8/8.1 legacy 2.7.12 only) | Verified on keepassxc.org/download |
| OBS Studio | none | none | Needs checking |
| ShareX | none | none | Needs checking |
| Notepad++ | none | none | Needs checking |

## What was checked

### 7-Zip — verified
- 7-zip.org: "7-Zip works in Windows 11 / 10 / 8 / 7 / Vista / XP / …"; most code under GNU LGPL; latest **26.06 (2026-11-06)**.
- 7-zip.org/download.html: EXE for x64, x86, ARM64; MSI for x64 and x86; 7-Zip Extra (.7z); source code. The project recommends the EXE over the MSI.
- **To confirm:** `https://github.com/ip7z/7zip` is still the repository linked from 7-zip.org; `https://www.7-zip.org/license.txt` and `history.txt` resolve. Windows 8.1 is not named separately, so it is shown as "Not confirmed".

### KeePassXC — verified
- keepassxc.org/download: current **2.8.0**; Installer and Portable ZIP for **x64 and ARM64, Windows 10 / 11**, each with PGP signature and SHA-256 digest; "Legacy Installer (x64, Windows 7 / 8 / 8.1)" linking to **2.7.12**, with a note that the legacy installer is no longer supported after 2.7.12; x64 packages list the MSVC Redistributable as a requirement.
- Getting Started guide: Windows installer is an MSI signed by DroidMonkey Apps, LLC.
- **To confirm:** release date of 2.8.0; license wording (GPL-2.0 or GPL-3.0) in the repository; that the ARM64 "Installer" is also an MSI.

### OBS Studio — needs checking
- obsproject.com and GitHub could not be opened. Secondary sources reported Windows 10/11 (64-bit) only and a stable release in the 32.2.x series (August 2026). Nothing version-specific is shown on the site.
- **To do:** on obsproject.com/download and the GitHub releases page, confirm the stable version and date, Windows support statement, x64 installer, x64/ARM64 ZIP, license (GPL-2.0-or-later). Then set `status: supported, verified: true` and the version fields.

### ShareX — needs checking
- The GitHub releases page showed conflicting information (a cached "Latest" 21.0.0 alongside 22.0–22.4 releases dated October–November 2026, some marked pre-release). Secondary sources say Windows 10 64-bit or later. No version is shown.
- **To do:** confirm on getsharex.com / GitHub the latest **stable** version, Windows requirement, asset names (setup and portable, x64), and license (GPL-3.0).

### Notepad++ — needs checking
- Official pages could not be opened. News sources reported several 8.9.x releases in 2026 (security fixes). A copy of `SUPPORTED_SYSTEM.md` listed Windows 8.1/10/11 as supported and Windows 7/8 as "runs, not supported".
- **To do:** confirm the current version on notepad-plus-plus.org/downloads, `SUPPORTED_SYSTEM.md` in the official repository, available packages (installer, MSI, portable ZIP/7z, architectures) and license (GPL-3.0).

## Never shown without verification

File names, file sizes, checksums, download counts, ratings and prices are not shown for any app. Add file-level details only from the official release page, and only if you are prepared to keep them current.

## Other items needing a human

- Application icons are letter placeholders. If you want official logos, check each project's trademark/logo policy first.
- No screenshots are included. Add your own screenshots (or ones the project licenses for reuse) to `screenshots` with `src`, `alt`, `width`, `height`.
- Category descriptions and feature lists are editorial summaries; review them for accuracy and tone.
