<?php
/*
 * VELZA GLOBAL - LOCAL DEVELOPMENT ROUTER
 * ---------------------------------------
 * Place this file in the SAME folder as REGIONAL-ROUTING.md
 * (i.e. at the document root of this package), then run:
 *
 *     php -S localhost:8000 deployment/local-dev-server.php
 *
 * Then open http://localhost:8000/
 *
 * It reproduces, on your laptop, what the real server has to do:
 *   1. pick a region (?_r= override  ->  country  ->  hk fallback)
 *   2. internally serve regions/<code>/...  WITHOUT changing the URL
 *   3. resolve extensionless URLs (/aboutus -> aboutus.html)
 *   4. serve /region/*.js from the shared root folder
 *
 * Because you have no real IP geolocation locally, force a region with:
 *   http://localhost:8000/?_r=in
 *   http://localhost:8000/?_r=ph
 *   http://localhost:8000/?_r=hk
 * ...or fake the edge with a header:
 *   curl -H 'CF-IPCountry: IN' http://localhost:8000/
 *
 * The override is NOT remembered - exactly like production. The
 * switcher strips ?_r= from the URL on load, so a reload falls back to
 * the country header. Nothing is stored in a cookie any more.
 */

const REGIONS         = ['hk', 'ph', 'in'];
const DEFAULT_REGION  = 'hk';
const REGION_PARAM    = '_r';

// ---------------------------------------------------------------- region pick
function pick_region(): string {
    // 1. one-page-view override from the switcher (.htaccess section 9a)
    $override = $_GET[REGION_PARAM] ?? null;
    if (is_string($override) && in_array($override, REGIONS, true)) {
        return $override;
    }
    // 2. country header - in production this is CF-IPCountry / GEOIP_COUNTRY_CODE
    $cc = strtoupper($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_COUNTRY'] ?? '');
    if ($cc === 'IN') return 'in';
    if ($cc === 'PH') return 'ph';
    // 3. everything else, including HK
    return DEFAULT_REGION;
}

// ---------------------------------------------------------------- path lookup
$region = pick_region();
$uri    = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$uri    = '/' . ltrim($uri, '/');

// shared, non-regional folder: /region/region-config.js etc.
if (preg_match('#^/(shared|routing|events|server)/#', $uri) || $uri === '/robots.txt' || $uri === '/sitemap.xml' || $uri === '/site.webmanifest' || $uri === '/favicon.ico' || $uri === '/apple-touch-icon.png' || $uri === '/velza-global-logo-2.svg') {
    $shared = __DIR__ . $uri;
    if (is_file($shared)) { serve($shared); exit; }
    http_response_code(404); echo 'Not found'; exit;
}

$base = __DIR__ . '/regions/' . $region;

$candidates = [
    $base . $uri,
    $base . rtrim($uri, '/') . '.html',
    $base . rtrim($uri, '/') . '.htm',
    $base . rtrim($uri, '/') . '.php',
    $base . rtrim($uri, '/') . '/index.html',
];

foreach ($candidates as $file) {
    if (is_file($file)) {
        header('X-Velza-Region: ' . $region);   // handy for debugging in devtools
        serve($file);
        exit;
    }
}

// custom 404, same file the server would use
http_response_code(404);
$notfound = $base . '/404.html';
if (is_file($notfound)) { readfile($notfound); } else { echo 'Not found'; }
exit;

// ---------------------------------------------------------------- static serve
function serve(string $file): void {
    if (str_ends_with($file, '.php')) {
        // let the built-in server execute it (needs PHP, obviously)
        require $file;
        return;
    }
    $types = [
        'html' => 'text/html; charset=utf-8', 'htm' => 'text/html; charset=utf-8',
        'css'  => 'text/css',                 'js'   => 'application/javascript',
        'json' => 'application/json',         'webmanifest' => 'application/manifest+json',
        'xml'  => 'application/xml',          'txt'  => 'text/plain',
        'png'  => 'image/png',   'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',   'webp' => 'image/webp', 'avif' => 'image/avif',
        'svg'  => 'image/svg+xml', 'ico' => 'image/x-icon',
        'mp4'  => 'video/mp4',   'webm' => 'video/webm',
        'woff' => 'font/woff',   'woff2' => 'font/woff2',
        'ttf'  => 'font/ttf',    'otf'  => 'font/otf',   'eot' => 'application/vnd.ms-fontobject',
    ];
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($file));
    readfile($file);
}
