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
* store(vuex)使用
* mixin使用
* 1.Vue.prototype全局变量挂载[main.js][main.js]

    1.main.js代码：`Vue.use(plugin)`
    
    2.plugin.js代码：
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
  
    3.util.js代码：
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

