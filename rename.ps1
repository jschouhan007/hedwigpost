$files = Get-ChildItem -Path 'C:\Users\hp\.gemini\antigravity\scratch\BitSpark\public' -Include '*.html' -Recurse -File
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'data-theme="light"') {
        $content = $content -replace 'data-theme="light"', 'data-theme="dark"'
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Dark-default: $($file.Name)"
    }
}
Write-Host "Done!"
