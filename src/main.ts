import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import '@/lib/amplify'
import '@/style.css'
import 'text-security/text-security-disc.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
