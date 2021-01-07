import {
  Notice
} from "iview"
import storage from "@/utils/localstorage"
import {
  debounce
} from 'throttle-debounce';
const whiteList = ['/api/cms/official/home/category-all', '/api/cms/official/news/in-category', '/api/cms/official/news/detail', '/api/cms/official/home/center-top-banner', '/api/shop/pc-goods/home/suggests', '/api/cms/official/home/latest-news',
  '/api/cms/official/home/top-banner', '/api/cms/official/home/middle-banner', '/api/cms/official/home/venue-suggest', '/api/shop/pc-goods/home/check-has-show', '/api/shop/pc-goods/home/get-in-category',
  '/api/shop/pc-goods/home/show-in-day', '/api/cms/official/art/top-banner', '/api/cms/official/home/coop-top-banner', '/api/shop/pc-goods/home/goods-detail', '/api/shop/pc-goods/home/suggest-side-bar', '/api/shop/pc-goods/home/show-categories-1',
  '/api/admin/mobile/'
]

const logout = debounce(1000, (redirect, app) => {
  console.log("storage==", storage)
  app.$cookies.remove(storage.keys.TOKEN)
  app.$cookies.remove(storage.keys.LOGIN_RESULT)
  app.$cookies.remove(storage.keys.USER_INFO)
  app.$cookies.remove(storage.keys.SHOW_STALLS)
  app.$cookies.remove(storage.keys.SELECT_SEATS)
  app.$cookies.remove(storage.keys.PATH)
  Notice.warning({
    title: '提示',
    desc: "您已登出，请重新登录"
  });
  redirect('/login')
});

export default function ({
  $axios,
  redirect,
  store,
  app
}) {
  $axios.onRequest(config => {
    // 附加令牌
    let flag = whiteList.every(item => config.url.indexOf(item) === -1);

    if (flag) {
      let token = store.state.user.token || storage.token.get() || app.$cookies.get(storage.keys.TOKEN)
      if (token) {
        config.headers.Authorization = "Bearer " + token;
      }
      if (config.url.indexOf('/api/auth/mobile/token/sms') !== -1) {
        config.headers.Authorization = "Basic cGlnOnBpZw==";
      }
    }
    return config;
  })


  $axios.onResponse(response => {
    // console.error(response)
    //response.data.errCode是接口返回的值，如果值为401，登录过期，然后跳转到登录页，
    // if (response.data.code == 401) {
    //   console.info('又是401了')
    // }
    return response
  })



  $axios.onError(error => {
    if (error.response.status == 401) {
      // 登出
      logout(redirect, app)
    } else {
      Notice.warning({
        title: '提示',
        desc: error.response.data.msg
      });
    }

    // const code = parseInt(error.response && error.response.status)
    // if (code === 400) {
    //   redirect('/400')
    // }
  })
}
