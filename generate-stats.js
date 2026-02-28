const https = require('https');
const fs = require('fs');

const USERNAME = process.env.USERNAME || 'jillravaliya';
const TOKEN = process.env.GITHUB_TOKEN;

function gql(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'github-stats-svg'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchStats() {
  try {
    const res = await gql(`{
      user(login: "${USERNAME}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }`);

    const total = res.data.user.contributionsCollection.contributionCalendar.totalContributions;
    return { totalCommits: total, username: USERNAME };
  } catch (e) {
    console.error('API error, fallback:', e.message);
    return { totalCommits: 513, username: USERNAME };
  }
}

function generateSVG({ totalCommits, username }) {
  const W = 320, H = 148;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">

  <rect width="${W}" height="${H}" rx="10" fill="#000"/>
  <rect width="${W}" height="${H}" rx="10" fill="none" stroke="#222" stroke-width="1"/>

  <rect width="${W}" height="30" rx="10" fill="#0d0d0d"/>
  <rect y="20" width="${W}" height="10" fill="#0d0d0d"/>
  <rect y="29" width="${W}" height="1" fill="#1c1c1c"/>

  <circle cx="18" cy="15" r="5" fill="#FF5F57"/>
  <circle cx="34" cy="15" r="5" fill="#FEBC2E"/>
  <circle cx="50" cy="15" r="5" fill="#28C840"/>

  <text x="${W - 18}" y="20" font-family="'Courier New',Courier,monospace" font-size="10" fill="#2e2e2e" text-anchor="end">gh-stats</text>

  <text font-family="'Courier New',Courier,monospace" font-size="12.5" opacity="0">
    <tspan x="18" y="60" fill="#555">$ </tspan><tspan fill="#7EC8E3">git log --count</tspan>
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="0.4s" fill="freeze"/>
  </text>

  <text x="14" y="103" font-family="'Arial Black','Arial Bold',Arial,sans-serif" font-size="44" font-weight="900" letter-spacing="3" fill="#7FD97F" opacity="0">
    ${totalCommits}
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.0s" fill="freeze"/>
  </text>

  <text x="18" y="122" font-family="'Courier New',Courier,monospace" font-size="11" fill="#3a5a3a" opacity="0">
    total commits
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.3s" fill="freeze"/>
  </text>

  <rect x="111" y="123" width="7" height="2" fill="#5bc8d0" opacity="0">
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.5s" fill="freeze"/>
    <animate attributeName="opacity" values="1;0;1" dur="1s" begin="2s" repeatCount="indefinite"/>
  </rect>
</svg>`;
}

async function main() {
  console.log(`Fetching stats for ${USERNAME}...`);
  const stats = await fetchStats();
  console.log('Total:', stats.totalCommits);
  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/stats.svg', generateSVG(stats));
  console.log('✅ assets/stats.svg generated!');
}

main();
