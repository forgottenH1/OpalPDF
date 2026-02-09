import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                guides: 'guides.html',
                contact: 'contact.html',
                advertise: 'advertise.html',
                advertiseInquiry: 'advertise-inquiry.html'

            }
        }
    }
})
