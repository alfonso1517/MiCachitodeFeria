import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const geojsonPlugin = {
  name: 'geojson',
  transform(src, id) {
    if (id.endsWith('.geojson')) {
      return { code: `export default ${src}`, map: null }
    }
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geojsonPlugin],
})
