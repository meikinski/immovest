#!/usr/bin/env node

/**
 * Analytics Configuration Verification Script
 *
 * Prüft, ob alle notwendigen Umgebungsvariablen für Google Analytics gesetzt sind
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Überprüfe Google Analytics Konfiguration...\n');

// Pfad zur .env.local Datei
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.local.example');

// Prüfe ob .env.local existiert
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local Datei nicht gefunden!');
  console.log('📝 Erstelle die Datei mit:');
  console.log('   cp .env.local.example .env.local\n');

  if (fs.existsSync(envExamplePath)) {
    console.log('✅ .env.local.example gefunden');
  }
  process.exit(1);
}

// Lese .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

// Extrahiere Umgebungsvariablen
const envVars = {};
lines.forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

// Prüfe notwendige Variablen
const requiredVars = {
  'NEXT_PUBLIC_GTM_ID': 'Google Tag Manager ID (Format: GTM-XXXXXXX)',
  'NEXT_PUBLIC_GA4_MEASUREMENT_ID': 'GA4 Measurement ID (Format: G-XXXXXXXXXX)'
};

let allSet = true;
let warnings = [];

console.log('📊 Google Analytics Konfiguration:\n');

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = envVars[key];

  if (!value || value.includes('...') || value.includes('XXXXXXX')) {
    console.log(`❌ ${key}`);
    console.log(`   → ${description}`);
    console.log(`   → Aktuell: ${value || 'nicht gesetzt'}\n`);
    allSet = false;
  } else {
    console.log(`✅ ${key}`);
    console.log(`   → ${value}\n`);

    // Validiere Format
    if (key === 'NEXT_PUBLIC_GTM_ID' && !value.startsWith('GTM-')) {
      warnings.push(`⚠️  ${key} sollte mit "GTM-" beginnen`);
    }
    if (key === 'NEXT_PUBLIC_GA4_MEASUREMENT_ID' && !value.startsWith('G-')) {
      warnings.push(`⚠️  ${key} sollte mit "G-" beginnen`);
    }
  }
});

if (warnings.length > 0) {
  console.log('\n⚠️  Warnungen:');
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (allSet && warnings.length === 0) {
  console.log('✅ Alle Analytics-Umgebungsvariablen sind korrekt gesetzt!\n');
  console.log('🚀 Nächste Schritte:');
  console.log('   1. Starte die Entwicklungsumgebung: npm run dev');
  console.log('   2. Öffne GTM Preview-Modus');
  console.log('   3. Führe einen Test-Kauf durch');
  console.log('   4. Prüfe Events in GTM und GA4 Echtzeit-Berichten\n');
  console.log('📖 Siehe GOOGLE_ANALYTICS_SETUP.md für Details\n');
  process.exit(0);
} else {
  console.log('❌ Bitte setze die fehlenden Variablen in .env.local\n');
  console.log('📖 Anleitung: GOOGLE_ANALYTICS_SETUP.md\n');
  process.exit(1);
}
