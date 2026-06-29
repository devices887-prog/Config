/**
 * Cloudflare Worker — Fanvil Phonebook Proxy
 *
 * Fetches phonebook.xml from GitHub fresh on every request.
 * Uses GitHub API (authenticated) to bypass all caching layers.
 *
 * Deploy URL:
 *   https://phonebook-proxy.devices887-prog.workers.dev
 *
 * Paste this URL into Fanvil phone:
 *   Phonebook → Cloud Phonebook → URL
 */

const GITHUB_USER  = 'devices887-prog';
const GITHUB_REPO  = 'Config';
const GITHUB_FILE  = 'phonebook.xml';
const BRANCH       = 'main';

export default {
  async fetch(request, env) {

    // Build the GitHub API URL — this always returns the latest committed file
    // and is not subject to CDN caching
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${BRANCH}`;

    // Add a timestamp-based cache buster so Cloudflare never serves
    // a cached response from its own edge network
    const bust = Date.now();

    const apiRes = await fetch(`${apiUrl}&bust=${bust}`, {
      cf: {
        // Tell Cloudflare's edge cache to NEVER cache this request
        cacheEverything: false,
        cacheTtl: 0,
        cacheKey: `phonebook-${bust}`
      },
      headers: {
        'Accept':               'application/vnd.github+json',
        'User-Agent':           'Cloudflare-Worker-Phonebook-Proxy',
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control':        'no-cache, no-store',
        'Pragma':               'no-cache'
      }
    });

    if (!apiRes.ok) {
      return new Response(
        `GitHub API error: HTTP ${apiRes.status}`,
        { status: apiRes.status, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // GitHub API returns the file content as base64 encoded JSON
    // Decode it to get the raw XML
    const data       = await apiRes.json();
    const base64     = data.content.replace(/\n/g, '');
    const xmlDecoded = atob(base64);

    return new Response(xmlDecoded, {
      status: 200,
      headers: {
        'Content-Type':                'application/xml; charset=utf-8',
        'Cache-Control':               'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma':                      'no-cache',
        'Access-Control-Allow-Origin': '*',
        'X-Commit-SHA':                data.sha || 'unknown'
      }
    });
  }
};
