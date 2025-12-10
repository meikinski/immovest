#!/usr/bin/env node

/**
 * Check Live HTML Output - What does Google actually see?
 *
 * This script fetches the live pages and checks if the robots meta tags
 * are actually present in the HTML that Google would crawl.
 */

const https = require('https');

const urlsToCheck = [
  'https://imvestr.de/',
  'https://imvestr.de/pricing',
  'https://imvestr.de/input-method',
];

console.log('🔍 Checking LIVE HTML output from production...\n');
console.log('This shows what Google actually sees when crawling.\n');
console.log('='.repeat(70));

async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          html: data,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function checkMetaTags(html, url) {
  console.log(`\n📄 ${url}`);
  console.log('-'.repeat(70));

  // Check for robots meta tag
  const robotsMetaRegex = /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i;
  const robotsMatch = html.match(robotsMetaRegex);

  if (robotsMatch) {
    const content = robotsMatch[1];
    console.log('✅ Robots meta tag found:');
    console.log(`   <meta name="robots" content="${content}">`);

    if (content.includes('index')) {
      console.log('   ✅ Contains "index" - Page can be indexed');
    } else if (content.includes('noindex')) {
      console.log('   ❌ Contains "noindex" - Page CANNOT be indexed!');
    }

    if (content.includes('follow')) {
      console.log('   ✅ Contains "follow" - Links can be followed');
    } else if (content.includes('nofollow')) {
      console.log('   ⚠️  Contains "nofollow" - Links will not be followed');
    }
  } else {
    console.log('❌ NO robots meta tag found in HTML!');
    console.log('   This is the problem - Google has no indexing instructions!');
  }

  // Check for googlebot meta tag
  const googlebotMetaRegex = /<meta\s+name=["']googlebot["']\s+content=["']([^"']+)["']/i;
  const googlebotMatch = html.match(googlebotMetaRegex);

  if (googlebotMatch) {
    console.log(`✅ Googlebot meta tag found:`);
    console.log(`   <meta name="googlebot" content="${googlebotMatch[1]}">`);
  } else {
    console.log('⚠️  No specific googlebot meta tag (not critical if robots tag exists)');
  }

  // Check for canonical URL
  const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
  const canonicalMatch = html.match(canonicalRegex);

  if (canonicalMatch) {
    console.log(`✅ Canonical URL found: ${canonicalMatch[1]}`);
  } else {
    console.log('⚠️  No canonical URL found');
  }

  // Check for title
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const titleMatch = html.match(titleRegex);

  if (titleMatch) {
    console.log(`✅ Title: ${titleMatch[1]}`);
  } else {
    console.log('❌ No title found!');
  }

  // Check for X-Robots-Tag in HTTP headers
  console.log('\n📋 HTTP Headers:');
}

async function main() {
  for (const url of urlsToCheck) {
    try {
      const { statusCode, headers, html } = await fetchHTML(url);

      console.log(`\n🌐 Status Code: ${statusCode}`);

      if (statusCode !== 200) {
        console.log(`❌ ERROR: Expected 200, got ${statusCode}`);
        console.log('   Google cannot index pages that don\'t return 200 OK!');
        continue;
      }

      // Check X-Robots-Tag header
      const xRobotsTag = headers['x-robots-tag'];
      if (xRobotsTag) {
        console.log(`📋 X-Robots-Tag header: ${xRobotsTag}`);
        if (xRobotsTag.includes('noindex')) {
          console.log('   ❌ Header blocks indexing!');
        }
      } else {
        console.log('📋 No X-Robots-Tag header (good - relies on meta tags)');
      }

      checkMetaTags(html, url);

    } catch (error) {
      console.log(`\n❌ Error fetching ${url}:`);
      console.log(`   ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📌 INTERPRETATION:');
  console.log('   ✅ If robots meta tags are found with "index, follow" → Fix worked!');
  console.log('   ❌ If NO robots meta tags found → Fix didn\'t deploy yet or issue persists');
  console.log('   ❌ If "noindex" found → Something is blocking indexing');
  console.log('\n💡 If tags are NOT found yet:');
  console.log('   1. Wait 5-10 more minutes for CDN cache to update');
  console.log('   2. Check Vercel deployment status');
  console.log('   3. Try adding ?nocache=1 to URLs and check again');
  console.log('='.repeat(70));
}

main().catch(console.error);
