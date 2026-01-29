/**
 * Test script for version management API
 * Run with: tsx server/test-version-api.ts
 */

import { createVersion, getLatestVersion, getAllVersions } from "./versionDb";

async function testVersionAPI() {
  console.log("🧪 Testing Version Management API\n");
  
  try {
    // 1. Create initial version
    console.log("1️⃣ Creating initial version 1.0.0...");
    const v1 = await createVersion({
      version: "1.0.0",
      minRequiredVersion: "1.0.0",
      forceUpdate: 0,
      enabled: 1,
      downloadUrlWindows: "https://example.com/app-1.0.0-win.exe",
      downloadUrlMac: "https://example.com/app-1.0.0-mac.dmg",
      downloadUrlLinux: null,
      releaseNotes: "Initial release",
      releaseDate: new Date(),
    });
    console.log("✅ Created:", v1);
    console.log();
    
    // 2. Create version 1.1.0 (optional update)
    console.log("2️⃣ Creating version 1.1.0 (optional update)...");
    const v2 = await createVersion({
      version: "1.1.0",
      minRequiredVersion: "1.0.0", // Still allows 1.0.0
      forceUpdate: 0,
      enabled: 1,
      downloadUrlWindows: "https://example.com/app-1.1.0-win.exe",
      downloadUrlMac: "https://example.com/app-1.1.0-mac.dmg",
      downloadUrlLinux: null,
      releaseNotes: "Bug fixes and performance improvements",
      releaseDate: new Date(),
    });
    console.log("✅ Created:", v2);
    console.log();
    
    // 3. Create version 2.0.0 (force update)
    console.log("3️⃣ Creating version 2.0.0 (force update)...");
    const v3 = await createVersion({
      version: "2.0.0",
      minRequiredVersion: "2.0.0", // Force all users to update
      forceUpdate: 1,
      enabled: 1,
      downloadUrlWindows: "https://example.com/app-2.0.0-win.exe",
      downloadUrlMac: "https://example.com/app-2.0.0-mac.dmg",
      downloadUrlLinux: null,
      releaseNotes: "Major update with breaking changes. All users must update.",
      releaseDate: new Date(),
    });
    console.log("✅ Created:", v3);
    console.log();
    
    // 4. Get latest version
    console.log("4️⃣ Getting latest version...");
    const latest = await getLatestVersion();
    console.log("✅ Latest version:", latest);
    console.log();
    
    // 5. Get all versions
    console.log("5️⃣ Getting all versions...");
    const all = await getAllVersions();
    console.log("✅ All versions:", all.length);
    all.forEach(v => {
      console.log(`   - ${v.version} (min: ${v.minRequiredVersion}, force: ${v.forceUpdate === 1})`);
    });
    console.log();
    
    console.log("🎉 All tests passed!");
    
  } catch (error: any) {
    if (error.message?.includes("Duplicate entry")) {
      console.log("ℹ️  Versions already exist in database. Skipping creation.");
      console.log("   Run this to reset: DELETE FROM app_versions;");
    } else {
      console.error("❌ Test failed:", error);
    }
  }
  
  process.exit(0);
}

testVersionAPI();
