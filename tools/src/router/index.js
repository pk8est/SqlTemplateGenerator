import Vue from 'vue'
import iView from 'iview'
import Router from 'vue-router'
import VueClipboard from 'vue-clipboard2'
import TemplateGenerator from '@/components/TemplateGenerator'

import 'iview/dist/styles/iview.css'  

Vue.use(Router)
Vue.use(iView)
Vue.use(VueClipboard)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'TemplateGenerator',
      component: TemplateGenerator
    }
  ]
})
