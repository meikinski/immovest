#!/usr/bin/env node

/**
 * SEO Metadata Verification Script
 *
 * This script verifies that all important pages have proper SEO metadata
 * configured for Google indexing.
 *
 * Usage: node verify-seo-metadata.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying SEO Metadata Configuration...\n');

const requiredMetadataFields = ['title', 'description', 'robots', 'openGraph', 'alternates'];

const pagesToCheck = [
  {
    name: 'Root Layout (affects all pages)',
    path: 'src/app/layout.tsx',
    required: ['title', 'description', 'robots', 'metadataBase']
  },
  {
    name: 'Pricing Page',
    path: 'src/app/pricing/layout.tsx',
    required: ['title', 'description', 'robots', 'alternates']
  },
  {
    name: 'Input Method Page',
    path: 'src/app/input-method/layout.tsx',
    required: ['title', 'description', 'robots', 'alternates']
  }
];

let allPassed = true;

pagesToCheck.forEach(({ name, path: filePath, required }) => {
  console.log(`\n📄 Checking: ${name}`);
  console.log(`   File: ${filePath}`);

  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log('   ❌ File does not exist!');
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  const missingFields = [];

  required.forEach(field => {
    // Check if the field exists in the metadata export
    const hasField = content.includes(`${field}:`) || content.includes(`${field}=`);

    if (!hasField) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    console.log('   ❌ Missing required fields:', missingFields.join(', '));
    allPassed = false;
  } else {
    console.log('   ✅ All required metadata fields present');
  }

  // Check for robots metadata specifically
  if (content.includes('robots:') || content.includes('robots =')) {
    if (content.includes('index: true')) {
      console.log('   ✅ Robots: index enabled');
    } else if (content.includes('index: false')) {
      console.log('   ⚠️  WARNING: Robots index is set to FALSE!');
      allPassed = false;
    }

    if (content.includes('follow: true')) {
      console.log('   ✅ Robots: follow enabled');
    } else if (content.includes('follow: false')) {
      console.log('   ⚠️  WARNING: Robots follow is set to FALSE!');
      allPassed = false;
    }
  } else if (required.includes('robots')) {
    console.log('   ❌ No robots metadata found');
    allPassed = false;
  }
});

// Check robots.txt
console.log('\n\n📄 Checking: robots.txt');
const robotsTxtPath = path.join(process.cwd(), 'public/robots.txt');

if (fs.existsSync(robotsTxtPath)) {
  const robotsTxt = fs.readFileSync(robotsTxtPath, 'utf8');

  // Check for a general disallow (must be exact match "Disallow: /" not "Disallow: /path")
  const lines = robotsTxt.split('\n');
  const hasGeneralDisallow = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === 'Disallow: /' || trimmed === 'Disallow:/';
  });

  if (hasGeneralDisallow) {
    console.log('   ⚠️  WARNING: robots.txt contains "Disallow: /" which blocks all crawlers!');
    allPassed = false;
  } else if (robotsTxt.includes('Allow: /')) {
    console.log('   ✅ robots.txt allows crawling (Allow: /)');
  }

  if (robotsTxt.includes('Sitemap:')) {
    const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/);
    if (sitemapMatch) {
      console.log(`   ✅ Sitemap URL declared: ${sitemapMatch[1].trim()}`);
    }
  } else {
    console.log('   ⚠️  No sitemap URL declared in robots.txt');
  }
} else {
  console.log('   ❌ robots.txt not found!');
  allPassed = false;
}

// Check sitemap
console.log('\n\n📄 Checking: Sitemap Configuration');
const sitemapPath = path.join(process.cwd(), 'src/app/sitemap.ts');

if (fs.existsSync(sitemapPath)) {
  console.log('   ✅ Dynamic sitemap.ts exists');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  // Check if important pages are included
  const importantPages = ['/', '/pricing', '/input-method'];
  const missingPages = [];

  importantPages.forEach(page => {
    const pagePattern = page === '/' ? 'url: baseUrl' : `url: \`\${baseUrl}${page}\``;
    if (!sitemapContent.includes(pagePattern) && !sitemapContent.includes(`'${page}'`) && !sitemapContent.includes(`"${page}"`)) {
      missingPages.push(page);
    }
  });

  if (missingPages.length > 0) {
    console.log('   ⚠️  Missing pages in sitemap:', missingPages.join(', '));
  } else {
    console.log('   ✅ All important pages included in sitemap');
  }
} else {
  console.log('   ❌ sitemap.ts not found!');
  allPassed = false;
}

// Final result
console.log('\n\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED! SEO metadata is properly configured.');
  console.log('\nNext Steps:');
  console.log('1. Build and deploy your changes: npm run build && git push');
  console.log('2. Wait 24-48 hours for Google to re-crawl');
  console.log('3. Request indexing in Google Search Console for each page');
  console.log('4. Monitor indexing status in Google Search Console');
} else {
  console.log('❌ SOME CHECKS FAILED! Please fix the issues above.');
  process.exit(1);
}
console.log('='.repeat(60));
