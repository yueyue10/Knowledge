import {
    initUtil
} from './util.js'
import {
    initPermission
} from './permission.js'
import {
    initInterceptor
} from './interceptor.js'
export default {
    install(Vue) {
        initUtil(Vue)
        initPermission(Vue)
        initInterceptor()
    }
}
