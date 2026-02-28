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

async function fetchTotalCommits() {
  try {
    const res = await gql(`{
      user(login: "${USERNAME}") {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            defaultBranchRef {
              target {
                ... on Commit {
                  history { totalCount }
                }
              }
            }
          }
        }
      }
    }`);

    let totalCommits = 0;
    res.data.user.repositories.nodes.forEach(repo => {
      totalCommits += repo?.defaultBranchRef?.target?.history?.totalCount || 0;
    });

    return { totalCommits, username: USERNAME };
  } catch (e) {
    console.error('API error, fallback:', e.message);
    return { totalCommits: 0, username: USERNAME };
  }
}

function generateSVG({ totalCommits, username }) {
  return `<svg width="260" height="130" viewBox="0 0 260 130" xmlns="http://www.w3.org/2000/svg">

  <rect width="260" height="130" rx="10" fill="#000000"/>
  <rect width="260" height="130" rx="10" fill="none" stroke="#2a2a2a" stroke-width="1"/>
  <rect width="260" height="28" rx="10" fill="#111111"/>
  <rect y="18" width="260" height="10" fill="#111111"/>
  <rect y="27" width="260" height="1" fill="#222"/>

  <circle cx="16" cy="14" r="4.5" fill="#FF5F57"/>
  <circle cx="30" cy="14" r="4.5" fill="#FEBC2E"/>
  <circle cx="44" cy="14" r="4.5" fill="#28C840"/>

  <text x="248" y="19" font-family="'Courier New',Courier,monospace" font-size="9" fill="#333" text-anchor="end">gh-stats</text>

  <text font-family="'Courier New',Courier,monospace" font-size="11.5" opacity="0">
    <tspan x="16" y="48" fill="#555">$ </tspan><tspan fill="#7EC8E3">git log --count</tspan>
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="0.4s" fill="freeze"/>
  </text>

  <g transform="translate(16, 0) scale(1.45, 1) translate(-16, 0)">
    <text x="14" y="88"
      font-family="'Arial Black','Arial Bold',Arial,sans-serif"
      font-size="32"
      font-weight="900"
      letter-spacing="1"
      fill="#7FD97F"
      opacity="0">
      ${totalCommits}
      <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.0s" fill="freeze"/>
    </text>
  </g>

  <text x="16" y="108" font-family="'Courier New',Courier,monospace" font-size="10.5" fill="#3a5a3a" opacity="0">
    total commits
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.3s" fill="freeze"/>
  </text>

  <rect x="104" y="109" width="7" height="2" fill="#5bc8d0" opacity="0">
    <animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.5s" fill="freeze"/>
    <animate attributeName="opacity" values="1;0;1" dur="1s" begin="2s" repeatCount="indefinite"/>
  </rect>

</svg>`;
}

async function main() {
  console.log(`Fetching commits for ${USERNAME}...`);
  const stats = await fetchTotalCommits();
  console.log('Total commits:', stats.totalCommits);
  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/stats.svg', generateSVG(stats));
  console.log('✅ assets/stats.svg generated!');
}

main();
