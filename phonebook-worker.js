/**
 * Cloudflare Worker — Fanvil Phonebook Proxy
 * 
 * Fetches phonebook.xml from GitHub and serves it fresh every time.
 * No caching — phone always gets the latest contacts.
 * 
 * Deploy URL (after setup):
 *   https://phonebook-proxy.devices887-prog.workers.dev
 * 
 * Paste this URL into Fanvil phone:
 *   Phonebook → Cloud Phonebook → URL
 */

const GITHUB_USER = 'devices887-prog';
const GITHUB_REPO = 'Config';
const GITHUB_FILE = 'phonebook.xml';
const BRANCH      = 'main';

export default {
  async fetch(request) {

    const githubUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/${GITHUB_FILE}`;

    const response = await fetch(githubUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma':        'no-cache',
        'User-Agent':    'Cloudflare-Worker-Phonebook-Proxy'
      }
    });

    if (!response.ok) {
      return new Response(
        `Error fetching phonebook: HTTP ${response.status} from GitHub`,
        { status: response.status, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const xml = await response.text();

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type':                'application/xml; charset=utf-8',
        'Cache-Control':               'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma':                      'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
