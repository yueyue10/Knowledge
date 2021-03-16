import axios from 'axios'
import qs from 'qs'
const service = axios.create({
  // baseURL node环境的不同，对应不同的baseURL   withCredentials  是否允许携带cookie   timeout请求的超时时间
  baseURL: process.env.VUE_APP_BASE_API_V1,
  withCredentials: false,
  timeout: 10000 * 60 * 3
})
service.interceptors.request.use(
  config => {
    //document.getElementById('loading_panel').style.display = 'block'
    const roles = localStorage.getItem('roles')
    const userName = localStorage.getItem('userName')
    config.headers.userName = userName
    config.headers.roles = roles
    config.responseType = 'json'

    return config
  },
  error => {
    //document.getElementById('loading_panel').style.display = 'none'
    return Promise.reject(error)
  }
)
service.interceptors.response.use(
  response => {
    //document.getElementById('loading_panel').style.display = 'none'
    if (response.status === 200) {
      return Promise.resolve(response)
    } else if (response.status === 404) {

    } else if (response.status > 500 || response.status == 500) {

    } else {
      return Promise.reject(response)
    }
  },
  error => {
    //document.getElementById('loading_panel').style.display = 'none'

    return Promise.reject(error)
  }
)

// export default service
/**
 *
 * @param method 请求的方法
 * @param url 请求的url
 * @param data 请求的数据
 * @param isJson 请求的数据是否是json
 * @returns {AxiosPromise}
 */
function httpsomething(method, url, data, isJson) {
  let formdata = data
  if (method.toLowerCase() === 'post') {
    if (!isJson) {
      formdata = qs.stringify(data)
    } else {
      formdata = JSON.stringify(data)
    }
  } else {
    if (!isJson) {
      formdata = qs.stringify(data)
      if (formdata) {
        url = url + '?' + formdata
      }
    } else {
      formdata = JSON.stringify(data)
    }
  }

  return service({
    method: method,
    url: url,
    data: formdata,
    headers: {
      'Content-Type': isJson ? 'application/json;charset=UTF-8' : 'application/x-www-form-urlencoded;charset=UTF-8'

    }
  })
}

export default {
  http: async function (method, url, data, isJson) {
    try {
      let res = await httpsomething(method, url, data, isJson)
      // console.info("info1")
      res = res.data
      return new Promise((resolve, reject) => {
        //document.getElementById('loading_panel').style.display = 'none'
        if (res.code === 0||res.code === 1) {
          resolve(res)
        } else {
          reject()
        }
      })
    } catch (errror) {
      console.info("info1123123"+errror)
      //document.getElementById('loading_panel').style.display = 'none'
    }
  }
}
