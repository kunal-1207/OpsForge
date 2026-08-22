<#
.SYNOPSIS
    Collects logs from OpsForge services across Docker Compose or Kubernetes.

.DESCRIPTION
    A cross-platform utility to gather container logs from either a local Docker Compose
    environment or a Kubernetes cluster, package them with diagnostic metadata, and
    create a compressed archive.

.PARAMETER Mode
    Specifies the target environment. Must be 'Docker' or 'Kubernetes'.

.PARAMETER Services
    Array of service names to collect logs for.

.PARAMETER OutputDirectory
    The destination directory for the generated ZIP archive.

.PARAMETER Since
    Time duration for logs (e.g., '30m', '1h').

.EXAMPLE
    .\Collect-Logs.ps1 -Mode Docker -Services api-service,worker-service -OutputDirectory .\artifacts\logs -Since 30m
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet('Docker', 'Kubernetes')]
    [string]$Mode,

    [Parameter(Mandatory=$false)]
    [string[]]$Services = @('api-service', 'worker-service', 'opsforge-api'),

    [Parameter(Mandatory=$false)]
    [string]$OutputDirectory = '.\artifacts\logs',

    [Parameter(Mandatory=$false)]
    [string]$Since = '30m',
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = 'default'
)

$ErrorActionPreference = 'Stop'

function Get-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Verify-Docker {
    if (-not (Get-CommandExists 'docker')) {
        throw "Docker is not installed or not in PATH."
    }
    
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    
    # Check if docker daemon is running
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        $ErrorActionPreference = $oldEap
        throw "Docker daemon is not running or accessible."
    }

    # Check for docker compose
    $composeVersion = docker compose version 2>$null
    if ($LASTEXITCODE -ne 0) {
        $ErrorActionPreference = $oldEap
        throw "'docker compose' command is not available."
    }
    
    $ErrorActionPreference = $oldEap
    return $composeVersion -join "`n"
}

function Verify-Kubernetes {
    if (-not (Get-CommandExists 'kubectl')) {
        throw "kubectl is not installed or not in PATH."
    }
    
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    
    # Check if cluster is accessible
    $clusterInfo = kubectl cluster-info 2>$null
    if ($LASTEXITCODE -ne 0) {
        $ErrorActionPreference = $oldEap
        throw "Kubernetes cluster is not accessible."
    }

    $kubectlVersion = kubectl version --client -o yaml 2>$null
    $ErrorActionPreference = $oldEap
    return $kubectlVersion -join "`n"
}

function Get-KubernetesContext {
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $context = kubectl config current-context 2>$null
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldEap
    if ($exitCode -eq 0) {
        return $context
    }
    return "Unknown"
}

# Setup output directories
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$archiveName = "opsforge-logs-$timestamp"

$absoluteOutputDir = $OutputDirectory
if (-not [System.IO.Path]::IsPathRooted($absoluteOutputDir)) {
    $absoluteOutputDir = Join-Path $PWD $OutputDirectory
}

$tempDir = Join-Path $absoluteOutputDir "opsforge-logs-temp-$timestamp"
$innerDir = Join-Path $tempDir "opsforge-logs"
$zipPath = Join-Path $absoluteOutputDir "$archiveName.zip"

if (-not (Test-Path $absoluteOutputDir)) {
    New-Item -ItemType Directory -Path $absoluteOutputDir -Force | Out-Null
}
if (-not (Test-Path $innerDir)) {
    New-Item -ItemType Directory -Path $innerDir -Force | Out-Null
}

$metadataPath = Join-Path $innerDir "metadata.txt"
$errorsPath = Join-Path $innerDir "collection-errors.log"

$metadata = @(
    "Collection Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "Collection Mode: $Mode",
    "Hostname: $env:COMPUTERNAME",
    "PowerShell Version: $($PSVersionTable.PSVersion)",
    "Requested Services: $($Services -join ', ')",
    "Since: $Since"
)

# Validate prerequisites and gather env metadata
try {
    Write-Host "Validating $Mode prerequisites..."
    if ($Mode -eq 'Docker') {
        $dockerVer = Verify-Docker
        $metadata += "Docker Version: $dockerVer"
    } else {
        $kubeVer = Verify-Kubernetes
        $context = Get-KubernetesContext
        $metadata += "Kubectl Version: $kubeVer"
        $metadata += "Kubernetes Context: $context"
        $metadata += "Namespace: $Namespace"
    }
} catch {
    Write-Host "Prerequisite validation failed: $_" -ForegroundColor Red
    exit 1
}

# Collect Logs
$collectedCount = 0
$failedCount = 0
$errors = @()

Write-Host "Starting log collection..."

foreach ($service in $Services) {
    Write-Host "Collecting logs for $service..." -NoNewline
    $logFile = Join-Path $innerDir "$service.log"
    
    try {
        if ($Mode -eq 'Docker') {
            # Check if service exists in docker compose
            $oldEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            
            $psOutput = docker compose config --services 2>$null
            if ($psOutput -notcontains $service) {
                $ErrorActionPreference = $oldEap
                throw "Service '$service' not found in docker compose environment."
            }
            
            docker compose logs --no-color --since $Since $service > $logFile 2>&1
            $exitCode = $LASTEXITCODE
            $ErrorActionPreference = $oldEap
            
            if ($exitCode -ne 0) {
                throw "docker compose logs failed with exit code $exitCode"
            }
        } else {
            # Kubernetes
            $oldEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            
            $pods = kubectl get pods -n $Namespace -l "app=$service" -o jsonpath="{.items[*].metadata.name}" 2>$null
            if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pods)) {
                $ErrorActionPreference = $oldEap
                throw "No pods found for label app=$service in namespace $Namespace."
            }
            
            $metadata += "Pods for $($service): $pods"
            
            kubectl logs -n $Namespace -l "app=$service" --since=$Since --all-containers > $logFile 2>&1
            $exitCode = $LASTEXITCODE
            $ErrorActionPreference = $oldEap
            
            if ($exitCode -ne 0) {
                throw "kubectl logs failed with exit code $exitCode"
            }
        }
        
        Write-Host " [OK] collected" -ForegroundColor Green
        $collectedCount++
    } catch {
        Write-Host " [FAIL] failed" -ForegroundColor Red
        $failedCount++
        $errorMsg = "[$service] $_"
        $errors += $errorMsg
        # Delete empty log file if it was created
        if (Test-Path $logFile) {
            Remove-Item $logFile -Force
        }
    }
}

# Write metadata and errors
$metadata | Out-File -FilePath $metadataPath -Encoding utf8
if ($errors.Count -gt 0) {
    $errors | Out-File -FilePath $errorsPath -Encoding utf8
}

# Compress to ZIP
Write-Host "Creating archive $zipPath..."
Compress-Archive -Path $innerDir -DestinationPath $zipPath -Force

# Cleanup temp dir
Remove-Item -Path $tempDir -Recurse -Force

# Print summary
Write-Host ""
Write-Host "Collection Summary:"
if ($failedCount -gt 0) {
    Write-Host "Collection completed with warnings." -ForegroundColor Yellow
} else {
    Write-Host "Collection completed successfully." -ForegroundColor Green
}
Write-Host "Collected: $collectedCount"
Write-Host "Failed:    $failedCount"
Write-Host "Archive:   $zipPath"

if ($failedCount -eq $Services.Count) {
    exit 2 # All failed
} elseif ($failedCount -gt 0) {
    exit 3 # Partial failure
}

exit 0 # Success
