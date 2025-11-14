param()
$ErrorActionPreference = "Stop"

# Resolve repo root
$scriptPath = $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $repo

# Footer HTML for pages under src/view/pages (../../index.html etc.)
$pageFooter = @'
<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3><span class="material-icons">contact_support</span> Contact Us</h3>
      <p><span class="material-icons">email</span> Email: info@navigate.com</p>
      <p><span class="material-icons">call</span> Phone: (555) 123-4567</p>
    </div>

    <div class="footer-section">
      <h3><span class="material-icons">link</span> Quick Links</h3>
      <ul>
        <li><a href="../../index.html"><span class="material-icons">home</span> Home</a></li>
        <li><a href="services.html"><span class="material-icons">miscellaneous_services</span> Services</a></li>
        <li><a href="schedule.html"><span class="material-icons">calendar_today</span> Schedule</a></li>
        <li><a href="dashboard.html"><span class="material-icons">dashboard</span> Dashboard</a></li>
        <li><a href="resources.html"><span class="material-icons">library_books</span> Resources</a></li>
        <li><a href="about.html"><span class="material-icons">info</span> About</a></li>
        <li><a href="signin.html"><span class="material-icons">person_outline</span> Sign In</a></li>
        <li><a href="signup.html"><span class="material-icons">person_add</span> Sign Up</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3><span class="material-icons">share</span> Follow Us</h3>
      <div class="social-links">
        <a href="#" class="social-link"><span class="material-icons">public</span> Website</a>
        <a href="#" class="social-link"><span class="material-icons">forum</span> Blog</a>
        <a href="#" class="social-link"><span class="material-icons">mail</span> Newsletter</a>
        <a href="https://facebook.com/Navigate" class="social-link" target="_blank" rel="noopener">
          <svg class="icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.99 3.66 9.13 8.44 9.94v-7.03H7.9v-2.91h2.4V9.41c0-2.37 1.41-3.69 3.57-3.69 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.47v1.77h2.6l-.42 2.91h-2.18v7.03c4.78-.81 8.44-4.95 8.44-9.94z"/>
          </svg>
          <span>Facebook</span>
        </a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>Built with  by the Navigate team for accessible history education</p>
    <p><span class="material-icons" style="vertical-align:middle;font-size:18px">copyright</span> 2025 Navigate. All rights reserved.</p>
  </div>
</footer>
'@

# Footer HTML for src/index.html (root-level paths)
$rootFooter = @'
<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3><span class="material-icons">contact_support</span> Contact Us</h3>
      <p><span class="material-icons">email</span> Email: info@navigate.com</p>
      <p><span class="material-icons">call</span> Phone: (555) 123-4567</p>
    </div>

    <div class="footer-section">
      <h3><span class="material-icons">link</span> Quick Links</h3>
      <ul>
        <li><a href="index.html"><span class="material-icons">home</span> Home</a></li>
        <li><a href="view/pages/services.html"><span class="material-icons">miscellaneous_services</span> Services</a></li>
        <li><a href="view/pages/schedule.html"><span class="material-icons">calendar_today</span> Schedule</a></li>
        <li><a href="view/pages/dashboard.html"><span class="material-icons">dashboard</span> Dashboard</a></li>
        <li><a href="view/pages/resources.html"><span class="material-icons">library_books</span> Resources</a></li>
        <li><a href="view/pages/about.html"><span class="material-icons">info</span> About</a></li>
        <li><a href="view/pages/signin.html"><span class="material-icons">person_outline</span> Sign In</a></li>
        <li><a href="view/pages/signup.html"><span class="material-icons">person_add</span> Sign Up</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3><span class="material-icons">share</span> Follow Us</h3>
      <div class="social-links">
        <a href="#" class="social-link"><span class="material-icons">public</span> Website</a>
        <a href="#" class="social-link"><span class="material-icons">forum</span> Blog</a>
        <a href="#" class="social-link"><span class="material-icons">mail</span> Newsletter</a>
        <a href="https://facebook.com/Navigate" class="social-link" target="_blank" rel="noopener">
          <svg class="icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.99 3.66 9.13 8.44 9.94v-7.03H7.9v-2.91h2.4V9.41c0-2.37 1.41-3.69 3.57-3.69 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.47v1.77h2.6l-.42 2.91h-2.18v7.03c4.78-.81 8.44-4.95 8.44-9.94z"/>
          </svg>
          <span>Facebook</span>
        </a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>Built with  by the Navigate team for accessible history education</p>
    <p><span class="material-icons" style="vertical-align:middle;font-size:18px">copyright</span> 2025 Navigate. All rights reserved.</p>
  </div>
</footer>
'@

function Ensure-MaterialIconsTag {
  param([string]$content)
  if ($content -notmatch 'fonts\.googleapis\.com/icon\?family=Material\+Icons') {
    return ($content -replace '(?is)</head>', "  <link href=`"https://fonts.googleapis.com/icon?family=Material+Icons`" rel=`"stylesheet`">`r`n</head>")
  }
  return $content
}

function Replace-Footer {
  param([string]$path, [string]$footerHtml)

  $text = Get-Content -LiteralPath $path -Raw
  $text = Ensure-MaterialIconsTag -content $text

  if ($text -match '(?is)<footer[^>]*>.*?</footer>') {
    $text = [regex]::Replace($text, '(?is)<footer[^>]*>.*?</footer>', $footerHtml)
  } elseif ($text -match '(?is)</body>') {
    $text = $text -replace '(?is)</body>', "$footerHtml`r`n</body>"
  } else {
    $text += "`r`n$footerHtml`r`n"
  }

  Set-Content -LiteralPath $path -Value $text -Encoding UTF8
}

# Ensure footer icon CSS exists
$cssPath = Join-Path $repo 'src\css\styles.css'
$cssSnippet = @'
/* Footer icon alignment */
.footer .material-icons { font-size: 18px; vertical-align: middle; margin-right: 6px; }
.footer .footer-section h3 .material-icons { font-size: 20px; margin-right: 8px; }
.footer .social-links .social-link { display: inline-flex; align-items: center; gap: 6px; color: inherit; text-decoration: none; }
.footer .social-links .social-link:hover { text-decoration: underline; }
.footer .icon-svg { width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px; fill: currentColor; }
'@
if (Test-Path $cssPath) {
  if (-not (Select-String -Path $cssPath -Pattern 'Footer icon alignment' -Quiet)) {
    Add-Content -Path $cssPath -Value "`r`n$cssSnippet`r`n"
  }
}

# Update all pages (replace or insert)
$pages = Get-ChildItem -LiteralPath "$repo\src\view\pages" -Filter *.html -File -Recurse
$rootIndex = Join-Path $repo 'src\index.html'
$updated = @()

foreach ($file in $pages) {
  Replace-Footer -path $file.FullName -footerHtml $pageFooter
  $updated += $file.FullName
}
if (Test-Path $rootIndex) {
  Replace-Footer -path $rootIndex -footerHtml $rootFooter
  $updated += $rootIndex
}

"Updated footers in:"
$updated | ForEach-Object { " - $_" }