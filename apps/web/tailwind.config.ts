import type { Config } from 'tailwindcss'
import sharedConfig from '../../tailwind.config'

const config: Config = {
  presets: [sharedConfig],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
}

export default config
