import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';
export default defineConfig({ plugins:[react(),viteStaticCopy({targets:['Workers','ThirdParty','Assets','Widgets'].map(x=>({src:resolve('../../node_modules/cesium/Build/Cesium',x),dest:'cesium'}))})], define:{CESIUM_BASE_URL:JSON.stringify('/cesium')}, server:{host:'0.0.0.0',allowedHosts:['terminal.local'],proxy:{'/api':'http://127.0.0.1:8000'}}, test:{include:['src/**/*.test.ts']}});
