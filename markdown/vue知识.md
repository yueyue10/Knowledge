# vue知识

## 一、vue常见的`style`和`class`动态绑定问题

### 1.style 动态绑定

> 三元判断
```
:style="{ color: monthData.grow ? '#EE4E4E' : '#38B289' }"
```

> 值引用
```
:style="{ width: completeData.completionRateMonth }"
```

> 多属性动态配置
```
:style="{ width: item.width, color: index == selIndex ? '#1989fa' : '#404144' }"
```

> 多条件判断
```
:style="{ color: canGetYzm && canGetYzmClick ? '#4575ee' : '#999999' }"
```

> 使用返回的返回值
```
:style="{ background: computeLineColor(dataIdx, tableList.length) }"
```

> 值拼接
```
:style="{ width: yearData.ratio + '%' }"
```

> 多值拼接
```
:style="{ top: 'calc(75px + ' + marginTop + 'px)' }"
```

### 2.class 动态绑定

> 条件判断
```
:class="{ 'tag-divider': index != 0 }"
```

> 三元判断
```
:class="activeTab1 == item.name ? 'active-tab' : 'tab-link'"
```

> 多类名绑定
```
:class="[{ 'tab-below': tabBelow }, { 'tab-below-route_detail': showRouteDetail }]"
```

## 二、vue项目配置
* mixin使用


* store(vuex)使用 [参考mpx-store官方文档][mpx-store官方文档]及[视频][mpx-store视频地址]

    [store.js写法示例][store-todo.js]
    ```
    import { createStore } from '@mpxjs/core'
    const store = createStore({
      state: {
        count: 1
      },
      mutations: { //修改state里面的属性值
        add(state, payload) {
          state.count+=payload
        }
      },
      actions:{ //1.第一个参数是 context 对象；可以写成{ commit, state ,dispatch }；2.可以执行异步方法
        addAsync({commit},payload){
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              commit('add',payload);
              resolve()
            }, 1000)
          })
        },
        actionB ({ dispatch, commit }) {
          return dispatch('addAsync',2).then(() => {
            commit('someOtherMutation')
          })
        }
      },
      getters: { //不修改state里面的属性值直接返回逻辑数据
        isBiggerThan10:state=>{
          return state.count>10; 
        }
      },
    })
    export default store
    ```
    [vue界面使用示例][store-todo.mpx]
    ```
    import store from '../../store/index'
    computed:{
      ...store.mapState({zCount:'count'}), //1.mapState辅助函数获取多个状态；全局可以直接使用 zCount 属性
      ...store.mapGetters(['isBiggerThan10']),
      mCount(){ //2.原始写法：
        return store.state.count;
      }
    },
    methods: {
      ...store.mapMutations(['add']),//1.全局可以直接使用 add 方法
      ...store.mapActions(['addAsync']),
      addTen(){ //2.原始写法：
        store.commit('add',10)
        store.dispatch('addAsync',10)
      },
      addProcess(){
        this.add(10)
        this.addAsync(10).then(...)
      }
    }
    ```

* 3.Vue.prototype全局变量挂载[main.js][main.js]

    1.1 main.js代码：`Vue.use(plugin)`
    
    1.2 plugin.js代码：
    ```
    import {
        initUtil
    } from './util.js'
    export default {
        install(Vue) {
            initUtil(Vue)
            initPermission(Vue)
            initInterceptor()
        }
    }
    ```
  
    1.3 util.js代码：
    ```
    function formatDate(date, format = 'yyyy/MM/dd hh:mm:ss'){
        return ...
    }
    export function initUtil(Vue) {
        Vue.prototype.$formatDate = formatDate
        Vue.prototype.$formatBytes = formatBytes
    }
    ```


[main.js]:code/admin_unicloud/main.js
[store-todo.js]:code/mpx-demo/store/todo.js
[store-todo.mpx]:code/mpx-demo/pages/todo.mpx
[mpx-store视频地址]:https://www.imooc.com/video/20829
[mpx-store官方文档]:https://didi.github.io/mpx/store/#开始

