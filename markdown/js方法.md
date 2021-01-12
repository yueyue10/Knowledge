# 网上资源参考：
https://www.cnblogs.com/zyfeng/p/10541133.html

https://www.cnblogs.com/wfc139/p/10383509.html

>阮一峰es6教程
https://es6.ruanyifeng.com/

## 一、export方法
### 1.导出单个方法 
* 方式一：`export function`
    ```
    //common.js 导出
    export function getRandomId() {}
    //index.js 引用
    import { getRandomId } from '@/utils/common.js'
    import * as common from '@/utils/common.js'
    ```
* 方式二：`exports.xxx`
    ```
    // number.js 导出
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function strip(num, precision) {
        return 。。。;
    }
    exports.strip = strip;
    // seat.vue 引入
    import NumberPlus from "@/utils/number";
    NumberPlus.strip(x,x)
    ```
  
### 2.导出对象
* 方式一：`module.exports`
    ```
    //router.js 导出
    const router = {
      colorui: '/devTools/colorui/colorui',
      imgfilter: '/devTools/imgfilter/imgfilter'
    }
    module.exports = router
    
    //index.js 引用
    import {
      colorui
    } from '../../router'
    ```
* 方式二：`module.exports`
    ```
    //picture.js 导出
    async function getAccessToken(str64) {}
    module.exports = {
      getAccessToken
    }
    
    //index.js 引用
    const pictureModel = require('./picture.js');
    pictureModel.getAccessToken(event.str64)
    ```
* 方式三：`export default`
    ```
    //request.js 导出
    const service = axios.create({})
    export default service
    //index.js 引用
    import request from '@/utils/request'
    ```
* 方式四：`export default`
    ```
    //utils.js 导出
    const objToUrl = obj => {
      return ...;
    }
    const validatePhone = (rule, value, callback) => {
      ...
      callback();
    };
    export default {
      objToUrl,
      validatePhone
    }
    //common.js 引入
    import utils from "../utils/utils"
    utils.objToUrl(params)
    ```
* 方式五：`export default`
    ```
    //nfc.js 导出
    export default {
        listenNFCStatus: function () { ... },
        writeData: function () { ... },
        write(intent) { toast('请将NFC标签靠近！'); ... }
    }
    function toast(content){
        uni.showToast({
            title: content,
            icon: 'none'
        })
    }
    //index.vue 导入
    import nfc from '../../utils/hexiii-nfc.js'
    nfc.listenNFCStatus();
    nfc.writeData();
    ```






## 二、数组、字符串常用方法
### 1. map()方法
> map() 方法`创建一个新数组`，其结果是该数组中的每个元素都调用一个提供的函数后返回的结果。

区别于`forEach`方法，forEach并不会新建数组

```
var array1 = [1,2,3,4];
const map1 = array1.map(x => x *2);
console.log(map1);
打印结果为:
> Array [2,4,5,8]
```

```
// map和async组合使用，返回操作结果的数组
let res = await collection.get()
res.data.map(async(document) => {
  return await collection.doc(document.id).remove();
});
```

### 2. join()方法
> 用于把数组中的所有元素放入一个字符串。
```
var arr = [ "a", "b", "c", "d", "e" ];
arr.join();  得到 a,b,c,d,e
arr.join("-"); 得到 a-b-c-d-e
```

### 3. substring()方法
> 用于提取字符串中介于两个指定下标之间的字符
```
var yearMonth="202012"
yearMonth.substring(0, 4); 得到："2020"
yearMonth.substring(4);  得到："12"
```

### 4. concat()方法
将两个字符串或数组连接在一起；

* 1、String.concat(str)
	```
	var s1 = 'abc';
	var s2 = 'def';
	s1.concat(s2) // "abcdef"
	```
* 2、Array.concat(arr)
	```
	var s1=[1,2,3]
	var s2=[4,5,6]
	s1.concat(s2) //[1,2,3,4,5,6]
	```
* 3、字符串和数组混用
	```
	var s1=[1,2,3]
	var s2='444'
	s1.concat(s2) // [1, 2, 3, "444"]
	s2.concat(s1) // "4441,2,3"
	```

### 5. slice()方法
* 1、String.slice(start,end)

	返回一个子片段，对原先的string没有影响,与subString的区别是，还可以用负数当参数
	```
	var s = "1234567";
	s.slice(0,4)  得到："1234"
	s.slice(2,4)  得到："34"
	s.slice(4)  得到："567"
	s.slice(3,-1)  得到："456"
	```
* 2.Array.slice(start,end)
	
	返回从start开始到end的子数组
	```
	var a = [1,2,3,4,5];
	a.slice(0,3);    // Returns [1,2,3]
	a.slice(3);      // Returns [4,5]
	a.slice(1,-1);   // Returns [2,3,4]
	```


### 6.其他
> [`reduce方法`][reduce]

[reduce]:https://www.jianshu.com/p/e375ba1cfc47

#### 集合筛选

> 两个集合数据筛选
```
let arr=[100,2,300,400]
let users=[{id:1},{id:2},{id:3},{id:4}]
let userFil = users.filter(item => {
	return arr.indexOf(item.id) > -1
})
console.log(userFil)
```

## 三、项目中的js方法记录

* 方法简写
```
//参数：根目录下的dir文件夹名称
//返回：dir对应的全路径值
const resolve = dir => path.join(__dirname, dir)
resolve('src')  //返回src目录的全路径
```

* 标签、状态集合数据使用对象存储(类似java里面的Map或者枚举)<其实就是一种对应关系的数据集合>，这样写的目的是很清晰
```
// 这里的对象的属性值同上面，是使用了方法的值。
const filter = {
    all: todos => todos,
    active: todos => todos.filter(item => !item.done),
    complete: todos => todos.filter(item => item.done)
}
// 使用：filter['active'](this.todoList) 得到的就是筛选出来的数据
statusMap: {
  12: "正在拼团",
  40: "待评价",
  60: "退款中",
  70: "已退款"
}
// 使用：statusMap[status] status是接口返回的值，就可以得到对应的状态名称
```
