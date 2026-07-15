# Simultaneous multi-target ping logger for fault isolation
# Edit the IPs below, then run: powershell -File ping_watch.ps1
# Stop with Ctrl+C. Open ping_log.csv in Excel to spot correlated drops.

$targets = [ordered]@{
    "Router"  = "192.168.1.1"
    "Switch"  = "192.168.1.2"
    "Camera1" = "192.168.1.10"
    "Camera2" = "192.168.1.11"
}

$logFile = "ping_log.csv"
"Timestamp," + ($targets.Keys -join ",") | Out-File $logFile -Encoding UTF8

while ($true) {
    $row = (Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff")
    foreach ($name in $targets.Keys) {
        $ok = Test-Connection -ComputerName $targets[$name] -Count 1 -Quiet -ErrorAction SilentlyContinue
        $row += "," + $(if ($ok) { "OK" } else { "DROP" })
    }
    Add-Content -Path $logFile -Value $row
    Start-Sleep -Milliseconds 500
}
