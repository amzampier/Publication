import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition

    // A página do Escopo rola dentro do <main> do shell público; o hash da
    // chamada é tratado pela própria página depois que os cards renderizam.
    if (to.path.startsWith('/escopos/') && to.hash.startsWith('#chamada-')) {
      return false
    }

    return { top: 0 }
  }
}
