export default {
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: '丝绸之路国际文化交流中心官网',
    meta: [{
        charset: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        hid: 'description',
        name: 'description',
        content: ''
      }
    ],
    link: [{
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico'
      },
      // { rel: 'stylesheet', href: '//at.alicdn.com/t/font_2251844_aghefa3tk5d.css' }
    ],
    script:
    [
      {
        src: "https://cdn.bootcdn.net/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    // 'iview/dist/styles/iview.css',
    '@/assets/css/font/iconfont.css',
    '@/assets/css/font/iconfont1.css',
    '@/assets/css/main.less',
    'swiper/dist/css/swiper.css'
  ],

  loading: {
    color: '#06aee7' // 设置顶部进度条颜色
  },

  // router配置
  router: {
    extendRoutes(routes, resolve) {
      routes.push({
        path: '/index',
        component: resolve(__dirname, 'pages/index.vue'),
        children: [{
          path: "",
          component: resolve(__dirname, 'pages/index/index.vue'),
          name: "index"
        }]
      })
    },
    middleware: ['to-index']
  },

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [{
      src: '@/plugins/ui',
      ssr: true
    },
    {
      src: "@/plugins/vue-awesome-swiper",
      ssr: false
    },
    '@/plugins/interceptor',
    '@/plugins/api-inject',
    {src: '@/plugins/router', ssr: false},
    {
      src: "@/plugins/burypoint",
      ssr: false
    },
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    '@nuxtjs/axios',
    "cookie-universal-nuxt"
  ],

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    loaders: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  axios: {
    proxy: true,
    // prefix: '/api', // baseURL
    // credentials: true,
  },
  proxy: {
    '/api/': {
      target: 'http://tour-gateway.ipaas.enncloud.cn',
      // target: 'http://10.2.134.70:9999',
      // target: 'http://10.2.132.168:9999',
      changeOrigin: true,
      pathRewrite: {
        '^/api': ''
      },
    },
    '/admin/': {
      // target:'http://tour-pc.ipaas.enncloud.cn',
      target: 'http://tour-gateway.ipaas.enncloud.cn',
      // target: 'http://10.2.132.168:9999',
      // target: 'http://10.2.134.70:9999',
      changeOrigin: true,
      pathRewrite: {
        '^/admin': '/admin'
      },
    }
  }
}
