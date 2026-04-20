import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './stores'
import router from './router'
import VueDOMPurifyHTML from 'vue-dompurify-html'

const app = createApp(App)
app.use(VueDOMPurifyHTML)
app.directive('blur', {
  mounted(el) {
    el.addEventListener('click', () => {
      // 클릭된 요소 혹은 현재 포커스된 요소를 blur 처리
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })
  }
})

app.use(pinia)
app.use(router)

app.mount('#app')
