# Download unique race-related banners for every event slug
$out = "d:\SEP\SEP_FrontEnd_User\Com.FPTU.GFA26SE77.RaceDay.UserWeb\public\events"
New-Item -ItemType Directory -Force -Path $out | Out-Null

# Distinct Unsplash running / trail / city / beach photos (w=1600)
$map = [ordered]@{
  "vietnam-mountain-marathon-2026.jpg" = "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80"
  "hcmc-marathon-2026.jpg"             = "https://images.unsplash.com/photo-1452626038306-9bfadddc9190?w=1600&q=80"
  "danang-international-marathon-2026.jpg" = "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80"
  "hanoi-heritage-run-2026.jpg"        = "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1600&q=80"
  "phu-quoc-island-run-2026.jpg"       = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"
  "dalat-ultra-trail-2026.jpg"         = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600&q=80"
  "hue-night-run-2026.jpg"             = "https://images.unsplash.com/photo-1530143311259-f90047b5c1c3?w=1600&q=80"
  "nha-trang-bay-marathon-2027.jpg"    = "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1600&q=80"
  "mekong-delta-challenge-2027.jpg"    = "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1600&q=80"
  "hai-van-pass-trail-2026.jpg"        = "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=1600&q=80"
  "saigon-color-run-2026.jpg"          = "https://images.unsplash.com/photo-1513593771513-7b58b6a4dc8c?w=1600&q=80"
  "quy-nhon-beach-run-2027.jpg"        = "https://images.unsplash.com/photo-1502680390469-be75caf25b1e?w=1600&q=80"
  "cat-ba-trail-challenge-2026.jpg"    = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80"
  "mui-ne-sand-dunes-run-2027.jpg"     = "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80"
  "ba-vi-mountain-race-2026.jpg"       = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80"
  "vung-tau-half-marathon-2027.jpg"    = "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80"
  "can-tho-midnight-marathon-2027.jpg" = "https://images.unsplash.com/photo-1492681290082-e982959f4033?w=1600&q=80"
  "phong-nha-explorer-run-2026.jpg"    = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80"
  "ninh-binh-heritage-marathon-2026.jpg" = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
  "sapa-winter-trail-2027.jpg"         = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&q=80"
  "hoi-an-lantern-run-2026.jpg"        = "https://images.unsplash.com/photo-1517649763962-0c623066027b?w=1600&q=80"
  "con-dao-island-ultra-2027.jpg"      = "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?w=1600&q=80"
  "lang-biang-sky-race-2026.jpg"       = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80"
  "saigon-riverside-half-2027.jpg"     = "https://images.unsplash.com/photo-1526676037777-05aadb369f7b?w=1600&q=80"
}

foreach ($k in $map.Keys) {
  $dest = Join-Path $out $k
  try {
    Invoke-WebRequest -Uri $map[$k] -OutFile $dest -UseBasicParsing -TimeoutSec 90
    $len = (Get-Item $dest).Length
    Write-Host "OK $k $len"
  } catch {
    Write-Host "FAIL $k : $_"
  }
}

Write-Host "--- unique sizes ---"
Get-ChildItem $out -Filter *.jpg | Group-Object Length | Where-Object { $_.Count -gt 1 } | ForEach-Object {
  Write-Host "DUP size $($_.Name): $($_.Group.Name -join ', ')"
}
Get-ChildItem $out | Format-Table Name, Length -AutoSize
