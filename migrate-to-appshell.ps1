# migrate-to-appshell.ps1
# Replaces the inline Sidebar/Topbar/MouseTracker wrapper in every page with <AppShell>

$pages = @(
  "src\app\datasets\page.tsx",
  "src\app\analytics\page.tsx",
  "src\app\users\page.tsx",
  "src\app\projects\page.tsx",
  "src\app\settings\page.tsx",
  "src\app\superadmin\page.tsx",
  "src\app\upload\page.tsx"
)

foreach ($file in $pages) {
  Write-Host "Processing $file ..."
  $content = Get-Content $file -Raw

  # 1. Remove old imports
  $content = $content -replace 'import Sidebar from "@/components/layout/sidebar";\r?\n', ''
  $content = $content -replace 'import Topbar from "@/components/layout/topbar";\r?\n', ''
  $content = $content -replace 'import MouseTracker from "@/components/ui/mouse-tracker";\r?\n', ''

  # 2. Add AppShell import after the first "use client" line
  $content = $content -replace '("use client";)', "`$1`nimport AppShell from `"@/components/layout/app-shell`";"

  # 3. Replace the outer JSX wrapper opening (handles slight whitespace variations)
  # Pattern: <div className="relative flex h-screen ..."> <MouseTracker /> <div ...flex w-full...> <Sidebar /> <main ...overflow-hidden"> <Topbar />
  $openPattern = '(\s*)<div className="relative flex h-screen overflow-hidden bg-zinc-950">\r?\n\s*<MouseTracker />\r?\n\s*\r?\n?\s*<div className="relative z-10 flex w-full">\r?\n\s*<Sidebar />\r?\n\s*\r?\n?\s*<main className="flex flex-1 flex-col overflow-hidden">\r?\n\s*<Topbar />\r?\n'
  $openReplacement = '$1<AppShell>`n'
  $content = $content -replace $openPattern, $openReplacement

  # 4. Replace the JSX wrapper closing: </div>\n</main>\n</div>\n</div>
  # We match the closing sequence and replace with </AppShell>
  $closePattern = '\r?\n(\s*)</div>\r?\n\s*</main>\r?\n\s*</div>\r?\n\s*</div>\r?\n(\s*\);)'
  $closeReplacement = "`n`$1</AppShell>`n`$2"
  $content = $content -replace $closePattern, $closeReplacement

  Set-Content $file $content -NoNewline
  Write-Host "  Done."
}

Write-Host ""
Write-Host "All pages migrated to AppShell."
