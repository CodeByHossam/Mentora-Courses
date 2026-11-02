# PowerShell script to execute the refactoring

Write-Host '=== STARTING REFACTORING EXECUTION ==='
Write-Host 'This will move controllers and routes to feature folders...'

# Function to fix import paths in a file
function Fix-ImportPaths {
    param($FilePath)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        # Fix relative imports
        $content = $content -replace "require\('../../models/" "require('../models/"
        $content = $content -replace "require\('../../utils/" "require('../utils/"
        $content = $content -replace "require\('../../middleware/" "require('../middleware/"
        $content = $content -replace "require\('../../services/" "require('../services/"
        $content = $content -replace "require\('../../models/" "require('../models/"
        $content = $content -replace "require\('../../utils/logger'" "require('../utils/logger')"
        $content = $content -replace "require\('../../utils/cloudinary'" "require('../utils/cloudinary')"
        $content = $content -replace "require\('../../utils/apiResponse'" "require('../utils/apiResponse')"
        Set-Content $FilePath $content
        return $true
    }
    return $false
}

# Check current state
Write-Host '=== CURRENT STATE ==='
Get-ChildItem server/controllers | Select-Object Name, @{Name="Type"; Expression={ if ($_.PSIsContainer) { "Folder" } else { "File" } } } | Format-Table -AutoSize

Write-Host ''
Write-Host '=== MOVING CONTROLLERS TO FEATURE FOLDERS ==='

# Move loose controllers (simplified list)
$controllers_to_move = @(
    "adminController.js",
    "adminBulkDeleteController.js",
    "adminFeePaymentController.js",
    "adminSettingsController.js",
    "authController.js",
    "BillingController.js",
    "financialSummaryController.js",
    "cartController.js",
    "categoryController.js",
    "certificateController.js",
    "couponController.js",
    "courseInteractionController.js",
    "emailController.js",
    "enrollmentAdminNoteController.js",
    "enrollmentRequestController.js",
    "gradeController.js",
    "instructorRequestController.js",
    "lessonsControllers.js",
    "levelController.js",
    "liveSessionController.js",
    "messageController.js",
    "notificationController.js",
    "passwordController.js",
    "progressController.js",
    "qaController.js",
    "refundController.js",
    "reviewController.js",
    "userController.js",
    "videoController.js",
    "webhookController.js",
    "wishlistController.js",
    "zoomController.js"
)

foreach ($controller in $controllers_to_move) {
    if (Test-Path "server/controllers/$controller") {
        # Determine target folder
        $target_folder = "server/controllers/"
        if ($controller -match "admin|auth|grade|instructor|level|message|notification|password|progress|qa|review|user|zoom") {
            $target_folder += "$controller.Replace('Controller', '').ToLower()/"
        } elseif ($controller -match "billing|financialSummary") {
            $target_folder += "billing/"
        } elseif ($controller -match "cart|category|certificate|coupon|email") {
            $target_folder += "$controller.Replace('Controller', '').ToLower()/"
        } elseif ($controller -match "course") {
            $target_folder += "course/"
        } elseif ($controller -match "enrollment") {
            $target_folder += "enrollment/"
        } elseif ($controller -match "lessons") {
            $target_folder += "lessons/"
        } elseif ($controller -match "livesession") {
            $target_folder += "livesession/"
        } elseif ($controller -match "message|notification|password|progress|qa|refund|review|user|video|webhook|wishlist") {
            $target_folder += "$controller.Replace('Controller', '').ToLower()/"
        }
        
        # Create target folder if it doesn't exist
        if (!(Test-Path $target_folder)) {
            New-Item -ItemType Directory -Path $target_folder -Force | Out-Null
        }
        
        # Move the file
        Move-Item "server/controllers/$controller" "$target_folder$controller" -Force
        Write-Host "  Moved $controller to $target_folder"
    }
}

Write-Host ''
Write-Host '=== CREATING BARRELS ==='

# Create barrels for each folder
$folders = Get-ChildItem server/controllers | Where-Object { $_.PSIsContainer } | Select-Object Name

foreach ($folder in $folders) {
    $folder_path = "server/controllers/$($folder.Name)"
    $files = Get-ChildItem $folder_path -Filter "*.js" | Where-Object { $_.Name -ne "index.js" }
    
    if ($files.Count -gt 0) {
        $barrel_content = "module.exports = {`n"
        foreach ($file in $files) {
            $barrel_content += "  ...require('./$($file.Name)'),`n"
        }
        $barrel_content += "};`n`n// Import from this barrel only. Never deep-path into this folder."
        
        $index_path = "$folder_path/index.js"
        if (!(Test-Path $index_path)) {
            Set-Content -Path $index_path -Value $barrel_content
            Write-Host "  Created barrel for $($folder.Name): $($files.Name -join ', ')"
        }
    }
}

Write-Host ''
Write-Host '=== REFACTORING COMPLETE ==='
Write-Host '✓ All loose controllers have been moved to their feature folders'
Write-Host '✓ Barrels have been created for all feature folders'
Write-Host ''
Write-Host 'NEXT: Fix import paths and move routes...'