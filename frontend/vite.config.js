import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const isMockAuth = env.VITE_MOCK_AUTH === 'true' || !env.VITE_CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY.includes('xxxxxx');

  const alias = {};
  if (isMockAuth) {
    alias['@clerk/clerk-react'] = path.resolve(__dirname, 'src/mockClerk.jsx');
    console.log('🔌 [Vite Config] Mock Authentication Mode Enabled: @clerk/clerk-react aliased to src/mockClerk.jsx');
  }

  return {
    plugins: [react()],
    resolve: {
      alias
    }
  };
});
