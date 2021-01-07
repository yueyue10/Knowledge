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
