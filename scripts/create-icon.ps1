Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\public\note.jpg"
$pngPath = Join-Path $PSScriptRoot "..\public\icon.png"
$icoPath = Join-Path $PSScriptRoot "..\public\icon.ico"

if (Test-Path $srcPath) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    Write-Host "Source image dimensions: $($img.Width) x $($img.Height)"
    
    # Save as 256x256 PNG if needed, or direct PNG
    $destBitmap = New-Object System.Drawing.Bitmap 256, 256
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, 256, 256)
    $destBitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $pngPath"

    # Save as ICO using Hicon
    $hIcon = $destBitmap.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    $fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    $destBitmap.Dispose()
    $graphics.Dispose()
    $img.Dispose()
    Write-Host "Created $icoPath"
} else {
    Write-Error "Source image not found: $srcPath"
}
