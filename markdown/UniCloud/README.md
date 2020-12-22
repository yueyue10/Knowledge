# UniCloud数据库操作文档

* 一、对集合`Collection`的操作

    通过 `db.collection(name)` 可以获取指定集合的引用，在集合上可以进行以下操作
     
|类型	|接口		|说明											|
|------|------------|------------|
|写	|[add	|新增记录（触发请求）							|
|计数	|count		|获取符合条件的记录条数							|
|读	|get		|获取集合中的记录，如果有使用 where 语句定义查询条件，则会返回匹配结果集 (触发请求)|
|引用	|doc		|获取对该集合中指定 id 的记录的引用				|
|查询条件 | where		|通过指定条件筛选出匹配的记录，可搭配查询指令（eq, gt, in, ...）使用|
| |skip		| 跳过指定数量的文档，常用于分页，传入 offset	|
| |orderBy	| 排序方式										|
| |limit	| 返回的结果集(文档数量)的限制，有默认值和上限值	|
| |field	| 指定需要返回的字段								|
    
    > 查询及更新指令用于在 `where` 中指定字段需满足的条件，指令可通过 `db.command` 对象取得。

* 二、 记录 Record / Document

    > 通过 `db.collection(collectionName).doc(docId)` 可以获取指定集合上指定 id 的记录的引用，在记录上可以进行以下操作
    
|接口	|说明					|					|
|------|------------|------------|
|写		|set					|覆写记录			|
| | update					|局部更新记录(触发请求)|
| | remove					|删除记录(触发请求)	|
| 读	|get					|获取记录(触发请求)	|

* 三、查询筛选指令 Query Command

    >以下指令挂载在 `db.command` 下
    
|类型	|接口		|说明						|
|------|------------|------------|
|比较运算	|eq			|字段等于 ==				|
| |neq		|字段不等于 !=						|
| |gt		|字段大于 >							|
| |gte		|字段大于等于 >=					    |
| |lt		|字段小于 <							|
| |lte		|字段小于等于 <=					    |
| |in		|字段值在数组里						|
| |nin		|字段值不在数组里					    |
| 逻辑运算	|and		|表示需同时满足指定的所有条件|
| |or		|表示需同时满足指定条件中的至少一个	    |

* 四、字段更新指令 Update Command

    > 以下指令挂载在 `db.command` 下
    
|类型	|接口	|说明								|
|------|------------|------------|
|字段	|set	|设置字段值							|
||remove	|删除字段							|
||inc	|加一个数值，原子自增				|
||mul	|乘一个数值，原子自乘				|
||push	|数组类型字段追加尾元素，支持数组	|
||pop	|数组类型字段删除尾元素，支持数组	|
||shift	|数组类型字段删除头元素，支持数组	|
||unshift|数组类型字段追加头元素，支持数组	|

## 新增文档

###  方法1： collection.add(data)
参数说明

|参数	|类型	|必填	|说明										|
|------|------------|------------|------------|
|data	|object	| array	|是		|{_id: '10001', 'name': 'Ben'} _id 非必填	|

响应参数

1.单条插入时

|参数	|类型	|说明			|
|------|------|------|
|id		|String	|插入记录的id	|

2.批量插入时

|参数		|类型	|说明					|
|------|------|------|
|inserted	|Number	|插入成功条数			|
|ids		|Array	|批量插入所有记录的id	|

## 删除文档

### 方式1 通过指定文档ID删除
collection.doc(_id).remove()

```
// 清理全部数据
let res = await collection.get()
res.data.map(async(document) => {
  return await collection.doc(document.id).remove();
});
```

### 方式2 条件查找文档然后直接批量删除
collection.where().remove()

```
// 删除字段a的值大于2的文档
const dbCmd = db.command
let res = await collection.where({
  a: dbCmd.gt(2)
}).remove()

// 清理全部数据
const dbCmd = db.command
let res = await collection.where({
  _id: dbCmd.exists(true)
}).remove()
```

## 更新文档

### 一、更新指定文档
collection.doc().update(Object data)

参数说明

|参数	|类型	|必填	|说明											|
|------|------|------|------|
|data	|object	|是		|更新字段的Object，{'name': 'Ben'} _id 非必填	|

响应参数

|参数	|类型	|说明										|
|------|------|------|
|updated|Number	|更新成功条数，数据更新前后没变化时会返回0	|

更新数组时，已数组下标作为key即可
```
比如以下示例将数组arr内下标为1的值修改为 uniCloud
let res = await collection.doc('doc-id').update({
  arr: {
    1: "uniCloud"
  }
})
```

### 二、更新文档，如果不存在则创建
collection.doc().set()

**注意：** 此方法会覆写已有字段，
```
let res = await collection.doc('doc-id').set({
  name: "Hey"
})
// 更新前
{
  "_id": "doc-id",
  "name": "Hello",
  "value": "World"
}
// 更新后
{
  "_id": "doc-id",
  "name": "Hey"
}
```

### 三、批量更新文档
collection.update()

```
const dbCmd = db.command
let res = await collection.where({name: dbCmd.eq('hey')}).update({
  age: 18,
})
```

### 四、更新数组对象内指定下标的元素

```
const res = await db.collection('query').doc('1').update({
  // 更新students[1]
  ['students.' + 1]: {
    name: 'wang'
  }
})

// 更新前
{
  "_id": "1",
  "students": [
    {
      "name": "zhang"
    },
    {
      "name": "li"
    }
  ]
}

// 更新后
{
  "_id": "1",
  "students": [
    {
      "name": "zhang"
    },
    {
      "name": "wang"
    }
  ]
}
```

### 五、更新数组对象内匹配条件的元素
注意：只可确定数组内只会被匹配到一个的时候使用

```
const res = await db.collection('query').where({
    'students.id': '001'
}).update({
  // 将students内id为001的name改为li
    'students.$.name': 'li'
})

// 更新前
{
  "_id": "1",
  "students": [
    {
      "id": "001",
      "name": "zhang"
    },
    {
      "id": "002",
      "name": "wang"
    }
  ]
}

// 更新后
{
  "_id": "1",
  "students": [
    {
      "id": "001",
      "name": "li"
    },
    {
      "id": "002",
      "name": "wang"
    }
  ]
}
```

### 六、更新操作符

* **set**

	更新指令。用于设定字段等于指定值。这种方法相比传入纯 JS 对象的好处是能够指定字段等于一个对象：
	```
	const dbCmd = db.command
	let res = await db.collection('photo').doc('doc-id').update({
	  count: dbCmd.set({
	    fav: 1,
	    follow: 1
	  })
	})
	
	// 更新前
	{
	  "_id": "doc-id",
	  "name": "Hello",
	  "count": {
	    "fav": 0,
	    "follow": 0
	  }
	}
	
	// 更新后
	{
	  "_id": "doc-id",
	  "name": "Hello",
	  "count": {
	    "fav": 1,
	    "follow": 1
	  }
	}
	```
	
* **inc**

	更新指令。用于指示字段自增某个值，这是个原子操作，使用这个操作指令而不是先读数据、再加、再写回的好处是：
	1. 原子性：多个用户同时写，对数据库来说都是将字段加一，不会有后来者覆写前者的情况
	2. 减少一次请求：不需先读再写
	
	在文章阅读数+1、收藏+1等很多场景会用到它。如给收藏的商品数量加一：
	```
	let res = await db.collection('user').where({
	  _id: 'my-doc-id'
	}).update({
	  count: {
	    fav: dbCmd.inc(1)
	  }
	})
	
	// 更新前
	{
	  "_id": "my-doc-id",
	  "name": "Hello",
	  "count": {
	    "fav": 0,
	    "follow": 0
	  }
	}
	
	// 更新后
	{
	  "_id": "my-doc-id",
	  "name": "Hello",
	  "count": {
	    "fav": 1,
	    "follow": 0
	  }
	}
	```
* **mul**

	更新指令。用于指示字段自乘某个值。
	
	以下示例将count内的fav字段乘10
	```
	let res = await db.collection('user').where({
	  _id: 'my-doc-id'
	}).update({
	  count: {
	    fav: dbCmd.mul(10)
	  }
	})
	更新前：fav:2 
	更新后：fav:20 
	```
* **remove**

	更新指令。用于表示删除某个字段。
	
	如某人删除了自己一条商品评价中的评分：
	```
	const dbCmd = db.command
	let res = await db.collection('comments').doc('comment-id').update({
	  rating: dbCmd.remove()
	})
	
	// 更新前
	{
	  "_id": "comment-id",
	  "rating": 5,
	  "comment": "xxx"
	}
	
	// 更新后
	{
	  "_id": "comment-id",
	  "comment": "xxx"
	}
	```
	
* **push**

	向数组尾部追加元素，支持传入单个元素或数组
	```
	let res = await db.collection('comments').doc('comment-id').update({
	  // users: dbCmd.push('aaa')
	  users: dbCmd.push(['c', 'd'])
	})
	
	// 更新前
	{
	  "_id": "comment-id",
	  "users": ["a","b"]
	}
	
	// 更新后
	{
	  "_id": "comment-id",
	  "users": ["a","b","c","d"]
	}
	```
* **pop**

	删除数组尾部元素
	```
	let res = await db.collection('comments').doc('comment-id').update({
	  users: dbCmd.pop()
	})
	
	// 更新前
	{
	  "_id": "comment-id",
	  "users": ["a","b"]
	}
	
	// 更新后
	{
	  "_id": "comment-id",
	  "users": ["a"]
	}
	```
* **unshift**
 	
 	向数组头部添加元素，支持传入单个元素或数组。使用同push
	```
	let res = await db.collection('comments').doc('comment-id').update({
	  // users: dbCmd.push('aaa')
	  users: dbCmd.unshift(['c', 'd'])
	})
	
	// 更新前
	{
	  "_id": "comment-id",
	  "users": ["a","b"]
	}
	
	// 更新后
	{
	  "_id": "comment-id",
	  "users": ["c","d","a","b"]
	}
	```
* **shift**

	删除数组头部元素。使用同pop
	```
	let res = await db.collection('comments').doc('comment-id').update({
	  users: dbCmd.shift()
	})
	// 更新前
	{
	  "_id": "comment-id",
	  "users": ["a","b"]
	}
	
	// 更新后
	{
	  "_id": "comment-id",
	  "users": ["b"]
	}
	```

## 查询文档

支持 `where()`、`limit()`、`skip()`、`orderBy()`、`get()`、`field()`、`count()` 等操作。

只有当调用`get()`时才会真正发送查询请求。

注：默认取前100条数据，最大取前100条数据。

**get响应参数**

|参数	|类型	|说明			|
|------|------|------|
|data	|Array	|查询结果数组	|

### 一、添加查询条件
collection.where()

**在聚合操作中请使用match**

```
筛选出所有内存大于 8g 的计算机商品：
const dbCmd = db.command // 取指令
db.collection('goods').where({
  category: 'computer',
  type: {
    memory: dbCmd.gt(8), // 表示大于 8
  }
})
```

```
查询所有 name 字段以 ABC 开头的用户
db.collection('user').where({
  name: new RegExp('^ABC')
})
```

### 二、获取查询数量
collection.count()

```
let res = await db.collection('goods').where({
  category: 'computer'
}).count()
```
响应参数

|字段	|类型	|必填	|说明		|
|------|------|------|------|
|total	|Number	|否		|计数结果	|

### 三、设置记录数量
collection.limit()

```
let res = await collection.limit(1).get() // 只返回第一条记录
```

### 四、设置起始位置
collection.skip(value)

```
let res = await collection.skip(4).get()
```

### 五、对结果排序
collection.orderBy(field, orderType)

参数说明

|参数		|类型	|必填	|说明								|
|------|------|------|------|
|field		|string	|是		|排序的字段							|
|orderType	|string	|是		|排序的顺序，升序(asc) 或 降序(desc)|

```
let res = await collection.orderBy("name", "asc").get()
```

### 六、指定返回字段
collection.field()

从查询结果中，过滤掉不需要的字段，或者指定要返回的字段。

|参数	|类型	|必填	|说明													|
|------|------|------|------|
|-		|object	|是		|过滤字段对象，包含字段名和策略，不返回传false，返回传true	|

备注：只能指定要返回的字段或者不要返回的字段。即{'a': true, 'b': false}是一种错误的参数格式

### 七、查询指令
查询指令以dbCmd.开头，包括等于、不等于、大于、大于等于、小于、小于等于、in、nin、and、or。

* eq 等于
	```
	写法1：使用:来比较
	let res = await db.collection('articles').where({
	  quarter: '2020 Q2'
	}).get()
	```
	```
	写法2：使用指令dbcmd.eq()
	let res = await db.collection('articles').where({
	  quarter: dbCmd.eq('2020 Q2')
	}).get()
	```
	**eq 特殊用法**

	用于表示字段等于某个对象的情况
	```
	// 这种写法表示 stat 对象等于 { brand: 'S', name: 'S-01' }
	// 对象中还有其他字段时无法匹配，例如：{ brand: 'S', name: 'S-01', author: 'S-01-A' }
	// 对象中字段顺序不一致也不能匹配，例如：{ name: 'S-01', brand: 'S' }
	const dbCmd = db.command
	let res = await db.collection('articles').where({
	  stat: dbCmd.eq({
	    brand: 'S',
	    name: 'S-01'
	  })
	}).get()
	```
* neq 不等于
	```
	let res = await db.collection('goods').where({
	  category: dbCmd.neq('computer')
	}).get()
	```
* gt 大于
	```
	let res = await db.collection('goods').where({
	  price: dbCmd.gt(3000)
	}).get()
	```
* gte 大于等于
* lt 小于
* lte 小于等于
* in 在数组中

	字段值在给定的数组中。
	```
	筛选出内存为 8g 或 16g 的计算机商品：
	let res = await db.collection('goods').where({
	  category: 'computer',
	  type: {
	    memory: dbCmd.in([8, 16])
	  }
	}).get()
	```
* nin 不在数组中
	
	字段值不在给定的数组中。
* and 且
	
	表示需同时满足指定的两个或以上的条件。
	
	**流式写法：**
	```
	如筛选出内存大于 4g 小于 32g 的计算机商品：
	db.collection('goods').where({
	  category: 'computer',
	  type: {
	    memory: dbCmd.gt(4).and(dbCmd.lt(32))
	  }
	})
	```
	**前置写法：**
	```
	db.collection('goods').where({
	  category: 'computer',
	  type: {
	    memory: dbCmd.and(dbCmd.gt(4), dbCmd.lt(32))
	  }
	})
	```
* or 或
	
	**表示需满足所有指定条件中的至少一个**
	
	**流式写法：**
	```
	筛选出价格小于 4000 或在 6000-8000 之间的计算机：
	db.collection('goods').where({
	  category: 'computer',
	  type: {
	    price:dbCmd.lt(4000).or(dbCmd.gt(6000).and(dbCmd.lt(8000)))
	  }
	})
	```
	**前置写法：**
	```
	db.collection('goods').where({
	  category: 'computer',
	  type: {
	    price: dbCmd.or(dbCmd.lt(4000), dbCmd.and(dbCmd.gt(6000), dbCmd.lt(8000)))
	  }
	})
	```
	**跨字段 “或” 操作**
	```
	如筛选出内存 8g 或 cpu 3.2 ghz 的计算机
	db.collection('goods').where(dbCmd.or(
	  {
	    type: {
	      memory: dbCmd.gt(8)
	    }
	  },
	  {
	    type: {
	      cpu: 3.2
	    }
	  }
	))
	```
	
### 八、正则表达式查询
	
db.RegExp
	
根据正则表达式进行筛选

筛选出 version 字段开头是 "数字+s" 的记录，并且忽略大小写
```
// 可以直接使用正则表达式
db.collection('articles').where({
  version: /^\ds/i
})

// 也可以使用new RegExp
db.collection('user').where({
  name: new RegExp('^\\ds', 'i')
})
```

## 数据库操作符

### 一、查询·逻辑操作符
|   名称	|    说明		|
|------|------|
|  and	| 	查询操作符，用于表示逻辑 "与" 的关系，表示需同时满足多个查询筛选条件   |
|  or	| 	查询操作符，用于表示逻辑 "或" 的关系，表示需同时满足多个查询筛选条件。或指令有两种用法，一是可以进行字段值的 “或” 操作，二是也可以进行跨字段的 “或” 操作。  |
|  not	| 	查询操作符，用于表示逻辑 "非" 的关系，表示需不满足指定的条件。  |
|  nor	| 	查询操作符，用于表示逻辑 "都不" 的关系，表示需不满足指定的所有条件。如果记录中没有对应的字段，则默认满足条件。  |

#### 1.and
查询操作符，用于表示逻辑 "与" 的关系，表示需同时满足多个查询筛选条件

使用说明
`and` 有两种使用情况：

* 1. 用在根查询条件

	此时需传入多个查询条件，表示需同时满足提供的多个完整查询条件
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todo').where(dbCmd.and([
	  {
	    progress: dbCmd.gt(50)
	  },
	  {
	    tags: 'cloud'
	  }
	])).get()
	但以上用 and 组成的查询条件是不必要的，因为传入的对象的各字段隐式组成了 “与” 的关系，上述条件等价于下方更简洁的写法：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.gt(50),
	  tags: 'cloud'
	}).get()
	通常需要显示使用 `and` 是用在有跨字段或操作的时候
	</code>
	</pre>
</details>

* 2. 用在字段查询条件

	需传入多个查询操作符或常量，表示字段需满足或匹配给定的条件。
<details>
<summary style="font-weight:bold">示例 2</summary>
<pre>
	<code>
	//如以下用前置写法的方式表示 "progress 字段值大于 50 且小于 100"
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.and(dbCmd.gt(50), dbCmd.lt(100))
	}).get()
	//还可以用后置写法的方式表示同样的条件：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.gt(50).and(dbCmd.lt(100))
	}).get()
	注意 Command 默认也可以直接链式调用其他 Command，默认表示多个 Command 的与操作，因此上述代码还可以精简为：
	//
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.gt(50).lt(100)
	}).get()
	</code>
	</pre>
</details>

调用风格
方法接收两种传参方式，一是传入一个数组参数，二是传入多个参数，效果一样。
```
// 传入数组
function and(expressions: Expression[]): Command
// 传入多参数
function and(...expressions: Expression[]): Command
```

#### 2.or
查询操作符，用于表示逻辑 "或" 的关系，表示需同时满足多个查询筛选条件。或指令有两种用法，一是可以进行字段值的 “或” 操作，二是也可以进行跨字段的 “或” 操作。

* 字段值的或操作

	字段值的 “或” 操作指的是指定一个字段值为多个值之一即可。
<details>
<summary style="font-weight:bold">示例 1:如筛选出进度大于 80 或小于 20 的 todo</summary>
<pre>
	<code>
	流式写法：
	let res = await const dbCmd = db.command
	db.collection('todo').where({
	  progress: dbCmd.gt(80).or(dbCmd.lt(20))
	}).get()
	前置写法：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.or(dbCmd.gt(80), dbCmd.lt(20))
	}).get()
	前置写法也可接收一个数组：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.or([dbCmd.gt(80), dbCmd.lt(20)])
	}).get()
	</code>
	</pre>
</details>

* 跨字段的或操作

	跨字段的 “或” 操作指条件 “或”，相当于可以传入多个 where 语句，满足其中一个即可。
<details>
<summary style="font-weight:bold">示例 1:如筛选出进度大于 80 或已标为已完成的 todo：</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todo').where(dbCmd.or([
	  {
	    progress: dbCmd.gt(80)
	  },
	  {
	    done: true
	  }
	])).get()
	</code>
	</pre>
</details>

调用风格
方法接收两种传参方式，一是传入一个数组参数，二是传入多个参数，效果一样。
```
// 传入数组
function or(expressions: Expression[]): Command
// 传入多参数
function or(...expressions: Expression[]): Command
```

#### 3.not
查询操作符，用于表示逻辑 "非" 的关系，表示需不满足指定的条件。

>示例
<details>
<summary style="font-weight:bold">示例 1:如筛选出进度不等于100的 todo：</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.not(dbCmd.eq(100))
	}).get()
	//not 也可搭配其他逻辑指令使用，包括 and, or, nor, not，如 or：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.not(dbCmd.or([dbCmd.lt(50), dbCmd.eq(100)]))
	}).get()
	</code>
	</pre>
</details>


#### 4.nor
查询操作符，用于表示逻辑 "都不" 的关系，表示需不满足指定的所有条件。如果记录中没有对应的字段，则默认满足条件。

>示例
<details>
<summary style="font-weight:bold">示例 1:筛选出进度既不小于20又不大于80的 todo ：</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.nor([dbCmd.lt(20), dbCmd.gt(80)])
	}).get()
	//以上同时会筛选出不存在 progress 字段的记录，如果要要求 progress 字段存在，可以用 exists 指令：
	const dbCmd = db.command
	let res = await db.collection('todo').where({
	  progress: dbCmd.exists().nor([dbCmd.lt(20), dbCmd.gt(80)])
	  // 等价于以下非链式调用的写法：
	  // progress: dbCmd.exists().and(dbCmd.nor([dbCmd.lt(20), dbCmd.gt(80)]))
	}).get()
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2:筛选出 progress 不小于 20 且 tags 数组不包含 miniprogram 字符串的记录：</summary>
<pre>
	<code>
	const dbCmd = db.command
	db.collection('todo').where(dbCmd.nor([{
	  progress: dbCmd.lt(20),
	}, {
	  tags: 'miniprogram',
	}])).get()
	//以上会筛选出满足以下条件之一的记录：
	progress 不小于 20 且 tags 数组不包含 miniprogram 字符串 3. progress 不小于 20 且 tags 字段不存在 5. progress 字段不存在 且 tags 数组不包含 miniprogram 字符串 7. progress 不小于 20 且 tags 字段不存在 如果要求 progress 和 tags 字段存在，可以用 exists 指令：
	const dbCmd = db.command
	let res = await db.collection('todo').where(
	  dbCmd.nor([{
	    progress: dbCmd.lt(20),
	  }, {
	    tags: 'miniprogram',
	  }])
	  .and({
	    progress: dbCmd.exists(true),
	    tags: dbCmd.exists(true),
	  })
	).get()
	</code>
	</pre>
</details>

调用风格...

### 二、查询·比较操作符
|   名称	|    说明		|
|------|------|
|  eq	| 	查询筛选条件，表示字段等于某个值。`eq` 指令接受一个字面量 (literal)，可以是 `number`, `boolean`,` string,` `object`, `array`, `Date`。   |
|  neq	| 	查询筛选条件，表示字段不等于某个值。eq 指令接受一个字面量 (literal)，可以是 number, boolean, string, object, array, Date。  |
|  lt	| 	查询筛选操作符，表示需小于指定值。可以传入 Date 对象用于进行日期比较  |
|  lte	| 	查询筛选操作符，表示需小于或等于指定值。可以传入 Date 对象用于进行日期比较。  |
|  gt	| 	查询筛选操作符，表示需大于指定值。可以传入 Date 对象用于进行日期比较。  |
|  gte	| 	查询筛选操作符，表示需大于或等于指定值。可以传入 Date 对象用于进行日期比较。 |
|  in	| 	查询筛选操作符，表示要求值在给定的数组内。 |
|  nin	| 	查询筛选操作符，表示要求值不在给定的数组内。 |

#### 1.eq
查询筛选条件，表示字段等于某个值。`eq` 指令接受一个字面量 (literal)，可以是 `number`, `boolean`,` string,` `object`, `array`, `Date`。

比如筛选出所有自己发表的文章，除了用传对象的方式：
```
const openID = 'xxx'
let res = await db.collection('articles').where({
  _openid: openID
}).get()
```
还可以用指令：
```
const dbCmd = db.command
const openID = 'xxx'
let res = await db.collection('articles').where({
  _openid: dbCmd.eq(openid)
}).get()
```
注意 `eq` 指令比对象的方式有更大的灵活性，可以用于表示字段等于某个对象的情况，比如：
<details>
<summary style="font-weight:bold">示例 1:</summary>
<pre>
	<code>
	// 这种写法表示匹配 stat.publishYear == 2018 且 stat.language == 'zh-CN'
	let res = await db.collection('articles').where({
	  stat: {
	    publishYear: 2018,
	    language: 'zh-CN'
	  }
	}).get()
	// 这种写法表示 stat 对象等于 { publishYear: 2018, language: 'zh-CN' }
	const dbCmd = db.command
	let res = await db.collection('articles').where({
	  stat: dbCmd.eq({
	    publishYear: 2018,
	    language: 'zh-CN'
	  })
	}).get()
	</code>
	</pre>
</details>

#### 2.neq
查询筛选条件，表示字段不等于某个值。`eq` 指令接受一个字面量 (literal)，可以是 `number`, `boolean`, `string`, `object`, `array`, `Date`。

表示字段不等于某个值，和 eq 相反

#### 3.lt
查询筛选操作符，表示需小于指定值。可以传入 `Date` 对象用于进行日期比较。

找出进度小于 50 的 todo:
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.lt(50)
})
.get({
  success: console.log,
  fail: console.error
})
```

#### 4.lte
查询筛选操作符，表示需小于或等于指定值。可以传入 `Date` 对象用于进行日期比较。

找出进度小于或等于 50 的 todo
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.lte(50)
})
.get({
  success: console.log,
  fail: console.error
})
```

#### 5.gt
查询筛选操作符，表示需大于指定值。可以传入 Date 对象用于进行日期比较。

找出进度大于 50 的 todo
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.gt(50)
})
.get({
  success: console.log,
  fail: console.error
})
```

#### 6.gte
查询筛选操作符，表示需大于或等于指定值。可以传入 Date 对象用于进行日期比较。

找出进度大于或等于 50 的 todo
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.gte(50)
})
.get({
  success: console.log,
  fail: console.error
})
```

#### 7.in
查询筛选操作符，表示要求值在给定的数组内。

找出进度为 0 或 100 的 todo
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.in([0, 100])
})
.get({
  success: console.log,
  fail: console.error
})
```

#### 8.nin
查询筛选操作符，表示要求值不在给定的数组内。

找出进度不是 0 或 100 的 todo
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.nin([0, 100])
})
.get({
  success: console.log,
  fail: console.error
})
```

### 三、查询·字段操作符
#### 1.exists
判断字段是否存在

找出存在 tags 字段的记录
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  tags: dbCmd.exists(true)
})
.get()
```
#### 2.mod
查询筛选操作符，给定除数 divisor 和余数 remainder，要求字段作为被除数时 value % divisor = remainder。

找出进度为 10 的倍数的字段的记录
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  progress: dbCmd.mod(10, 0)
})
.get()
```

### 四、查询·数组操作符
#### 1.all
数组查询操作符。用于数组字段的查询筛选条件，要求数组字段中包含给定数组的所有元素。

* 示例代码 1：普通数组
```
找出 tags 数组字段同时包含 cloud 和 database 的记录
const dbCmd = db.command
let res = await db.collection('todos').where({
  tags: dbCmd.all(['cloud', 'database'])
})
.get()
```
* 示例代码 2：对象数组
//如果数组元素是对象，则可以用 dbCmd.elemMatch 匹配对象的部分字段
<details>
<summary style="font-weight:bold">示例 1:</summary>
<pre>
	<code>
	//假设有字段 places 定义如下：
	{
	  "type": string
	  "area": number
	  "age": number
	}
	//找出数组字段中至少同时包含一个满足 “area 大于 100 且 age 小于 2” 的元素和一个满足 “type 为 mall 且 age 大于 5” 的元素
	const dbCmd = db.command
	let res = await db.collection('todos').where({
	  places: dbCmd.all([
	    dbCmd.elemMatch({
	      area: dbCmd.gt(100),
	      age: dbCmd.lt(2),
	    }),
	    dbCmd.elemMatch({
	      type: 'mall',
	      age: dbCmd.gt(5),
	    }),
	  ]),
	})
	.get()
	</code>
</pre>
</details>

#### 2.elemMatch
用于数组字段的查询筛选条件，要求数组中包含至少一个满足 `elemMatch` 给定的所有条件的元素

<details>
<summary style="font-weight:bold">示例 1:数组是对象数组的情况</summary>
<pre>
	<code>
	//假设集合示例数据如下：
	{
	  "_id": "a0",
	  "city": "x0",
	  "places": [{
	    "type": "garden",
	    "area": 300,
	    "age": 1
	  }, {
	    "type": "theatre",
	    "area": 50,
	    "age": 15
	  }]
	}
	//找出 places 数组字段中至少同时包含一个满足 “area 大于 100 且 age 小于 2” 的元素
	const dbCmd = db.command
	let res = await db.collection('todos').where({
	  places: dbCmd.elemMatch({
	    area: dbCmd.gt(100),
	    age: dbCmd.lt(2),
	  })
	})
	.get()
	注意*：如果不使用 elemMatch 而直接如下指定条件，则表示的是 places 数组字段中至少有一个元素的 area 字段大于 100 且 places 数组字段中至少有一个元素的 age 字段小于 2：
	const dbCmd = db.command
	let res = await db.collection('todos').where({
	  places: {
	    area: dbCmd.gt(100),
	    age: dbCmd.lt(2),
	  }
	})
	.get()
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2:数组元素都是普通数据类型的情况</summary>
<pre>
	<code>
	//假设集合示例数据如下：
	{
	  "_id": "a0",
	  "scores": [60, 80, 90]
	}
	//找出 scores 数组字段中至少同时包含一个满足 “大于 80 且小于 100” 的元素
	const dbCmd = db.command
	let res = await db.collection('todos').where({
	  scores: dbCmd.elemMatch(dbCmd.gt(80).lt(100))
	})
	.get()
	</code>
</pre>
</details>

#### 3.size
更新操作符，用于数组字段的查询筛选条件，要求数组长度为给定值

找出 tags 数组字段长度为 2 的所有记录
```
const dbCmd = db.command
let res = await db.collection('todos').where({
  places: dbCmd.size(2)
})
.get()
```

### 五、查询·地理位置操作符
#### 1.geoNear
按从近到远的顺序，找出字段值在给定点的附近的记录。

索引要求
需对查询字段建立地理位置索引

找出离给定位置 1 公里到 5 公里范围内的记录
```
const dbCmd = db.command
let res = await db.collection('restaurants').where({
  location: dbCmd.geoNear({
    geometry: new db.Geo.Point(113.323809, 23.097732),
    minDistance: 1000,
    maxDistance: 5000,
  })
}).get()
```
#### 2.geoWithin
找出字段值在指定区域内的记录，无排序。指定的区域必须是多边形（Polygon）或多边形集合（MultiPolygon）。

索引要求
需对查询字段建立地理位置索引

<details>
<summary style="font-weight:bold">示例 1:给定多边形</summary>
<pre>
	<code>
	const dbCmd = db.command
	const { Point, LineString, Polygon } = db.Geo
	let res = await .collection('restaurants').where({
	  location: dbCmd.geoWithin({
	    geometry: new Polygon([
	      new LineString([
	        new Point(0, 0),
	        new Point(3, 2),
	        new Point(2, 3),
	        new Point(0, 0)
	      ])
	    ]),
	  })
	}).get()
	</code>
</pre>
</details>

>给定圆形

可以不用 `geometry` 而用 `centerSphere` 构建一个圆形。

`centerSphere` 对应的值的定义是：`[ [经度, 纬度], 半径 ]`

半径需以弧度计，比如需要 10km 的半径，则用距离除以地球半径 6378.1km 得出的数字。

<details>
<summary style="font-weight:bold">示例 2:给定圆形</summary>
<pre>
	<code>
	const dbCmd = db.command
	const { Point, LineString, Polygon } = db.Geo
	let res = await .collection('restaurants').where({
	  location: dbCmd.geoWithin({
	    geometry: new Polygon([
	      new LineString([
	        new Point(0, 0),
	        new Point(3, 2),
	        new Point(2, 3),
	        new Point(0, 0)
	      ])
	    ]),
	  })
	}).get()
	</code>
</pre>
</details>

#### 3.geoIntersects
找出给定的地理位置图形相交的记录

索引要求
需对查询字段建立地理位置索引

找出和一个多边形相交的记录:
```
const dbCmd = db.command
const { Point, LineString, Polygon } = db.Geo
let res = await db.collection('restaurants').where({
  location: dbCmd.geoIntersects({
    geometry: new Polygon([
      new LineString([
        new Point(0, 0),
        new Point(3, 2),
        new Point(2, 3),
        new Point(0, 0)
      ])
    ]),
  })
}).get()
```

### 六、查询·表达式操作符
#### 1.expr
查询操作符，用于在查询语句中使用聚合表达式，方法接收一个参数，该参数必须为聚合表达式

使用说明

* expr 可用于在聚合 match 流水线阶段中引入聚合表达式 3. 如果聚合 match 阶段是在 lookup 阶段内，此时的 expr 表达式内可使用 lookup 中使用 let 参数定义的变量，具体示例可见 lookup 的 指定多个连接条件 例子 5. expr 可用在普通查询语句（where）中引入聚合表达式

<details>
<summary style="font-weight:bold">示例代码 1：比较同一个记录中的两个字段</summary>
<pre>
	<code>
	//假设 items 集合的数据结构如下：
	{
	  "_id": string,
	  "inStock": number, // 库存量
	  "ordered": number  // 被订量
	}
	//找出被订量大于库存量的记录：
	const dbCmd = db.command
	const $ = dbCmd.aggregate
	let res = await db.collection('items').where(dbCmd.expr($.gt('$ordered', '$inStock'))).get()
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 2：与条件语句组合使用</summary>
<pre>
	<code>
	假设 items 集合的数据结构如下：
	{
	  "_id": string,
	  "price": number
	}
	假设加个小于等于 10 的打 8 折，大于 10 的打 5 折，让数据库查询返回打折后价格小于等于 8 的记录：
	const dbCmd = db.command
	const $ = dbCmd.aggregate
	let res = await db.collection('items').where(dbCmd.expr(
	  $.lt(
	    $.cond({
	      if: $.gte('$price', 10),
	      then: $.multiply(['$price', '0.5']),
	      else: $.multiply(['$price', '0.8']),
	    })
	    ,
	    8
	  )
	).get()
	</code>
</pre>
</details>

### 七、更新·字段操作符
|   名称	|    说明		|
|------|------|
|  set	| 	更新操作符，用于设定字段等于指定值。   |
|  remove	| 	更新操作符，用于表示删除某个字段。  |
|  inc	| 	更新操作符，原子操作，用于指示字段自增 |
|  mul	| 	更新操作符，原子操作，用于指示字段自乘某个值  |
|  min	| 	更新操作符，给定一个值，只有该值小于字段当前值才进行更新。  |
|  max	| 	更新操作符，给定一个值，只有该值大于字段当前值才进行更新。 |
|  rename	| 	更新操作符，字段重命名。如果需要对嵌套深层的字段做重命名，需要用点路径表示法。不能对嵌套在数组里的对象的字段进行重命名。 |

#### 1.set
更新操作符，用于设定字段等于指定值。

使用说明
这种方法相比传入纯 JS 对象的好处是能够指定字段等于一个对象

```
// 以下方法只会更新 style.color 为 red，而不是将 style 更新为 { color: 'red' }，即不影响 style 中的其他字段
let res = await db.collection('todos').doc('doc-id').update({
  style: {
    color: 'red'
  }
})

// 以下方法更新 style 为 { color: 'red', size: 'large' }
let res = await db.collection('todos').doc('doc-id').update({
  style: dbCmd.set({
    color: 'red',
    size: 'large'
  })
})
```

#### 2.remove
更新操作符，用于表示删除某个字段。

删除 style 字段：
```
const dbCmd = db.command
let res = await db.collection('todos').doc('todo-id').update({
  style: dbCmd.remove()
})
```

#### 3.inc
更新操作符，原子操作，用于指示字段自增

原子自增
多个用户同时写，对数据库来说都是将字段自增，不会有后来者覆写前者的情况

将一个 todo 的进度自增 10：
```
const dbCmd = db.command
let res = await db.collection('todos').doc('todo-id').update({
  progress: dbCmd.inc(10)
})
```

#### 4.mul
更新操作符，原子操作，用于指示字段自乘某个值

原子自乘
多个用户同时写，对数据库来说都是将字段自乘，不会有后来者覆写前者的情况

将一个 todo 的进度自乘 10：
```
const dbCmd = db.command
let res = await db.collection('todos').doc('todo-id').update({
  progress: dbCmd.mul(10)
})
```

#### 5.min
更新操作符，给定一个值，只有该值小于字段当前值才进行更新。

如果字段 progress > 50，则更新到 50
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  progress: dbCmd.min(50)
})
```

#### 6.max
更新操作符，给定一个值，只有该值大于字段当前值才进行更新。

如果字段 progress < 50，则更新到 50
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  progress: dbCmd.max(50)
})
```

#### 7.rename
更新操作符，字段重命名。如果需要对嵌套深层的字段做重命名，需要用点路径表示法。不能对嵌套在数组里的对象的字段进行重命名。

示例 1：重命名顶层字段
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  progress: dbCmd.rename('totalProgress')
})
```
示例 2：重命名嵌套字段
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  someObject: {
    someField: dbCmd.rename('someObject.renamedField')
  }
})
或：
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  'someObject.someField': dbCmd.rename('someObject.renamedField')
})
```

### 八、更新·数组操作符
|   名称	|    说明		|
|------|------|
|  push	| 	数组更新操作符。对一个值为数组的字段，往数组添加一个或多个值。或字段原为空，则创建该字段并设数组为传入值。   |
|  pop	| 	数组更新操作符，对一个值为数组的字段，将数组尾部元素删除，仅可以删除末尾一个  |
|  unshift	| 	数组更新操作符，对一个值为数组的字段，往数组头部添加一个或多个值。或字段原为空，则创建该字段并设数组为传入值。 |
|  shift	| 	数组更新操作符，对一个值为数组的字段，将数组头部元素删除。  |
|  pull	| 	数组更新操作符。给定一个值或一个查询条件，将数组中所有匹配给定值或查询条件的元素都移除掉。  |
|  pullAll	| 	数组更新操作符。给定一个值或一个查询条件，将数组中所有匹配给定值的元素都移除掉。跟 pull 的差别在于只能指定常量值、传入的是数组。 |
|  addToSet	| 	数组更新操作符。原子操作。给定一个或多个元素，除非数组中已存在该元素，否则添加进数组。 |

#### 1.push
数组更新操作符。对一个值为数组的字段，往数组添加一个或多个值。或字段原为空，则创建该字段并设数组为传入值。

参数说明
* position 说明

	要求必须同时有 each 参数存在。
	
	非负数代表从数组开始位置数的位置，从 0 开始计。如果数值大于等于数组长度，则视为在尾部添加。负数代表从数组尾部倒数的位置，比如 -1 就代表倒数第二个元素的位置。如果负数数值的绝对值大于等于数组长度，则视为从数组头部添加。

* sort 说明

	要求必须同时有 each 参数存在。给定 1 代表升序，-1 代表降序。

	如果数组元素是记录，则用 { <字段>: 1 | -1 } 的格式表示根据记录中的什么字段做升降序排序。

* slice 说明**

	要求必须同时有 each 参数存在
|值		|说明					|
|------|------|
|0		|将字段更新为空数组		|
|正数	|数组只保留前 n 个元素	|
|负数	|数组只保留后 n 个元素	|

<details>
<summary style="font-weight:bold">示例代码 1：尾部添加元素</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push(['mini-program', 'cloud'])
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 2：从第二个位置开始插入</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: ['mini-program', 'cloud'],
	    position: 1,
	  })
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 3：排序</summary>
<pre>
	<code>
	//插入后对整个数组做排序
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: ['mini-program', 'cloud'],
	    sort: 1,
	  })
	})
	//不插入，只对数组做排序
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: [],
	    sort: 1,
	  })
	})
	//如果字段是对象数组，可以如下根据元素对象里的字段进行排序：
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: [
	      { name: 'miniprogram', weight: 8 },
	      { name: 'cloud', weight: 6 },
	    ],
	    sort: {
	      weight: 1,
	    },
	  })
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 4：截断保留</summary>
<pre>
	<code>
	//插入后只保留后 2 个元素
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: ['mini-program', 'cloud'],
	    slice: -2,
	  })
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 5：在指定位置插入、然后排序、最后只保留前 2 个元素</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.push({
	    each: ['mini-program', 'cloud'],
	    position: 1,
	    slice: 2,
	    sort: 1,
	  })
	})
	</code>
</pre>
</details>

#### 2.pop
数组更新操作符，对一个值为数组的字段，将数组尾部元素删除，仅可以删除末尾一个

示例代码
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  tags: dbCmd.pop()
})
```

#### 3.unshift
数组更新操作符，对一个值为数组的字段，往数组头部添加一个或多个值。或字段原为空，则创建该字段并设数组为传入值。

示例代码
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  tags: dbCmd.unshift(['mini-program', 'cloud'])
})
```

#### 4.shift
数组更新操作符，对一个值为数组的字段，将数组头部元素删除。

示例代码
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  tags: dbCmd.shift()
})
```
#### 5.pull
数组更新操作符。给定一个值或一个查询条件，将数组中所有匹配给定值或查询条件的元素都移除掉。

<details>
<summary style="font-weight:bold">示例代码 1：根据常量匹配移除</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.pull('database')
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 2：根据查询条件匹配移除</summary>
<pre>
	<code>
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.pull(dbCmd.in(['database', 'cloud']))
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 3：对象数组时，根据查询条件匹配移除</summary>
<pre>
	<code>
	假设有字段 places 数组中的元素结构如下
	{
	  "type": string
	  "area": number
	  "age": number
	}
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  places: dbCmd.pull({
	    area: dbCmd.gt(100),
	    age: dbCmd.lt(2),
	  })
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 4：有嵌套对象的对象数组时，根据查询条件匹配移除</summary>
<pre>
	<code>
	//假设有字段 cities 数组中的元素结构如下
	{
	  "name": string
	  "places": Place[]
	}
	//Place 结构如下：
	{
	  "type": string
	  "area": number
	  "age": number
	}
	//可用 elemMatch 匹配嵌套在对象数组里面的对象数组字段 places
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  cities: dbCmd.pull({
	    places: dbCmd.elemMatch({
	      area: dbCmd.gt(100),
	      age: dbCmd.lt(2),
	    })
	  })
	})
	</code>
</pre>
</details>

#### 6.pullAll
数组更新操作符。给定一个值或一个查询条件，将数组中所有匹配给定值的元素都移除掉。跟 `pull` 的差别在于只能指定常量值、传入的是数组。

根据常量匹配移除

从 tags 中移除所有 database 和 cloud 字符串
```
const dbCmd = db.command
let res = await db.collection('todos').doc('doc-id').update({
  tags: dbCmd.pullAll(['database', 'cloud'])
})
```

#### 7.addToSet
数组更新操作符。原子操作。给定一个或多个元素，除非数组中已存在该元素，否则添加进数组。

<details>
<summary style="font-weight:bold">示例代码 1：添加一个元素</summary>
<pre>
	<code>
	如果 tags 数组中不包含 database，添加进去
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.addToSet('database')
	})
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例代码 1：添加多个元素</summary>
<pre>
	<code>
	需传入一个对象，其中有一个字段 each，其值为数组，每个元素就是要添加的元素
	const dbCmd = db.command
	let res = await db.collection('todos').doc('doc-id').update({
	  tags: dbCmd.addToSet({
	    each: ['database', 'cloud']
	  })
	})
	</code>
</pre>
</details>
