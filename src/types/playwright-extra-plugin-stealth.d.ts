declare module 'playwright-extra-plugin-stealth' {
  interface StealthPlugin {
    name: string;
  }

  export default function stealth(): StealthPlugin;
}
