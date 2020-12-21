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