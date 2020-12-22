# 聚合操作

## 聚合操作
### 0.聚合表达式
表达式可以是**字段路径**、**常量**、或**聚合操作符**。表达式可以嵌套表达式。

* 字段路径：_表达式用字段路径表示法来指定记录中的字段。如：$profile，$profile.name_
* 常量：_常量可以是任意类型。使用 db.command.aggregate.literal 声明为常量。_

### 1.addFields 方法
聚合阶段。添加新字段到输出的记录。


<details>
<summary style="font-weight:bold">示例 1：连续两次 addFields</summary>
<pre>
	<code>
	{
	  _id: 1,
	  student: "Maya",
	  homework: [ 10, 5, 10 ],
	  quiz: [ 10, 8 ],
	  extraCredit: 0
	}
	{
	  _id: 2,
	  student: "Ryan",
	  homework: [ 5, 6, 5 ],
	  quiz: [ 8, 8 ],
	  extraCredit: 8
	}
	//应用两次 addFields，第一次增加两个字段分别为 homework 和 quiz 的和值，第二次增加一个字段再基于上两个和值求一次和值。
	const $ = db.command.aggregate
	let res = await db.collection('scores').aggregate()
	  .addFields({
		totalHomework: $.sum('$homework'),
		totalQuiz: $.sum('$quiz')
	  })
	  .addFields({
		totalScore: $.add(['$totalHomework', '$totalQuiz', '$extraCredit'])
	  })
	  .end()
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：在嵌套记录里增加字段</summary>
<pre>
	<code>
	{ _id: 1, type: "car", specs: { doors: 4, wheels: 4 } }
	{ _id: 2, type: "motorcycle", specs: { doors: 0, wheels: 2 } }
	{ _id: 3, type: "jet ski" }
	//可以用如下操作在 specs 字段下增加一个新的字段 fuel_type，值都设为固定字符串 unleaded：
	let res = await db.collection('vehicles').aggregate()
	  .addFields({
		'spec.fuel_type': 'unleaded'
	  })
	  .end()
	//结果
	{ _id: 1, type: "car",specs: { doors: 4, wheels: 4, fuel_type: "unleaded" } }
	...
	</code>
</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：设置字段值为另一个字段</summary>
<pre>
	<code>
	let res = await db.collection('vehicles').aggregate()
	  .addFields({
	    vehicle_type: '$type'
	  })
	  .end()
	  </code>
</pre>
</details>

### 2.bucket方法
聚合阶段。将输入记录根据给定的条件和边界划分成不同的组，每组即一个 bucket。

**bucket 的形式如下：**
```
bucket({
  groupBy: <expression>, //决定分组的表达式
  boundaries: [<lowerbound1>, <lowerbound2>, ...], //每个元素分别是每组的下界
  default: <literal>, //指定之后，没有进入任何分组的记录将都进入一个默认分组
  output: { //用以决定输出记录除了 _id 外还要包含哪些字段，各个字段的值必须用累加器表达式指定。
    <output1>: <accumulator expr>,
    ...
    <outputN>: <accumulator expr>
  }
})
```

<details>
<summary style="font-weight:bold">示例 1：按price字段将 [0, 50) 分为一组，[50, 100) 分为一组，其他分为一组</summary>
<pre>
	<code>
	假设集合 items 有如下记录：
	{
	  _id: "1",
	  price: 10
	}
	{
	  _id: "2",
	  price: 50
	}
	{
	  _id: "3",
	  price: 20
	}
	{
	  _id: "4",
	  price: 80
	}
	{
	  _id: "5",
	  price: 200
	}
	// 对上述记录进行分组，将 [0, 50) 分为一组，[50, 100) 分为一组，其他分为一组：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .bucket({
		groupBy: '$price',
		boundaries: [0, 50, 100],
		default: 'other',
		output: {
		  count: $.sum(),
		  ids: $.push('$_id')
		}
	  })
	  .end()
	//返回结果如下：
	[
	  {
		"_id": 0,
		"count": 2,
		"ids": [
		  "1",
		  "3"
		]
	  },
	  {
		"_id": 50,
		"count": 2,
		"ids": [
		  "2",
		  "4"
		]
	  },
	  {
		"_id": "other",
		"count": 22,
		"ids": [
		  "5"
		]
	  }
	]
	</code>
</pre>
</details>

### 3.bucketAuto方法
聚合阶段。将输入记录根据给定的条件划分成不同的组，每组即一个 bucket。与 bucket 的其中一个不同之处在于无需指定 boundaries，bucketAuto 会自动尝试将记录尽可能平均的分散到每组中。

<details>
<summary style="font-weight:bold">示例 1：按记录按price自动分组，分成三组</summary>
<pre>
	<code>
	// 假设集合 items 有如下记录：
	{
	  _id: "1",
	  price: 10.5
	}
	{
	  _id: "2",
	  price: 50.3
	}
	{
	  _id: "3",
	  price: 20.8
	}
	{
	  _id: "4",
	  price: 80.2
	}
	{
	  _id: "5",
	  price: 200.3
	}
	//对上述记录进行自动分组，分成三组：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .bucketAuto({
		groupBy: '$price',
		buckets: 3,
	  })
	  .end()
	//返回结果如下：
	{
	  "_id": {
		"min": 10.5,
		"max": 50.3
	  },
	  "count": 2
	}
	{
	  "_id": {
		"min": 50.3,
		"max": 200.3
	  },
	  "count": 2
	}
	{
	  "_id": {
		"min": 200.3,
		"max": 200.3
	  },
	  "count": 1
	}
	</code>
</pre>
</details>

### 4.count方法
聚合阶段。计算上一聚合阶段输入到本阶段的记录数，输出一个记录，其中指定字段的值为记录数。

是输出记录数的字段的名字，不能是空字符串，不能以 $ 开头，不能包含 . 字符。

count 阶段等同于 group + project 的操作：

<details>
<summary style="font-weight:bold">示例 1：找出价格大于 50 的记录数：</summary>
<pre>
	<code>
	//假设集合 items 有如下记录：
	{
	  _id: "1",
	  price: 10.5
	}
	{
	  _id: "2",
	  price: 50.3
	}
	{
	  _id: "3",
	  price: 20.8
	}
	{
	  _id: "4",
	  price: 80.2
	}
	{
	  _id: "5",
	  price: 200.3
	}
	//找出价格大于 50 的记录数：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .match({
	    price: $.gt(50)
	  })
	  .count('expensiveCount')
	  .end()
	//返回结果如下：
	{
	  "expensiveCount": 3
	}
	</code>
	</pre>
</details>

### 5.geoNear方法
聚合阶段。将记录按照离给定点从近到远输出。

|属性				|类型		|默认值	|必填	|说明	|
|------|------|------|------|------|
|near				|GeoPoint	|		|是		|GeoJSON Point，用于判断距离的点	|
|spherical			|true		|		|是		|必填，值为 true					|
|limit				|number		|		|否		|限制返回记录数					|
|maxDistance		|number		|		|否		|距离最大值						|
|minDistance		|number		|		|否		|距离最小值						|
|query				|Object		|		|否		|要求记录必须同时满足该条件（语法同 where|
|distanceMultiplier	|number		|		|否		|返回时在距离上乘以该数字				|
|distanceField		|string		|		|是		|存放距离的输出字段名，可以用点表示法表示一个嵌套字段											|
|includeLocs		|string		|		|否		|列出要用于距离计算的字段，如果记录中有多个字段都是地理位置时有用								|
|key				|string		|		|否		|选择要用的地理位置索引。如果集合由多个地理位置索引，则必须指定一个，指定的方式是指定对应的字段	|

**API 说明**
* `geoNear` 必须为第一个聚合阶段
* 必须有地理位置索引。如果有多个，必须用 `key` 参数指定要使用的索引。

<details>
<summary style="font-weight:bold">示例 1：将记录按照离给定点从近到远输出：</summary>
<pre>
	<code>
	//假设集合 attractions 有如下记录：
	{
	  "_id": "geoNear.0",
	  "city": "Guangzhou",
	  "docType": "geoNear",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      113.30593,
	      23.1361155
	    ]
	  },
	  "name": "Canton Tower"
	},
	{
	  "_id": "geoNear.1",
	  "city": "Guangzhou",
	  "docType": "geoNear",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      113.306789,
	      23.1564721
	    ]
	  },
	  "name": "Baiyun Mountain"
	},
	{
	  "_id": "geoNear.2",
	  "city": "Beijing",
	  "docType": "geoNear",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      116.3949659,
	      39.9163447
	    ]
	  },
	  "name": "The Palace Museum"
	},
	{
	  "_id": "geoNear.3",
	  "city": "Beijing",
	  "docType": "geoNear",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      116.2328567,
	      40.242373
	    ]
	  },
	  "name": "Great Wall"
	}
	//将记录按照离给定点从近到远输出
	const $ = db.command.aggregate
	let res = await db.collection('attractions').aggregate()
	  .geoNear({
	    distanceField: 'distance', // 输出的每个记录中 distance 即是与给定点的距离
	    spherical: true,
	    near: new db.Geo.Point(113.3089506, 23.0968251),
	    query: {
	      docType: 'geoNear',
	    },
	    key: 'location', // 若只有 location 一个地理位置索引的字段，则不需填
	    includeLocs: 'location', // 若只有 location 一个是地理位置，则不需填
	  })
	  .end()
	//返回结果如下：
	{
	  "_id": "geoNear.0",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      113.30593,
	      23.1361155
	    ]
	  },
	  "docType": "geoNear",
	  "name": "Canton Tower",
	  "city": "Guangzhou",
	  "distance": 4384.68131486958
	},
	{
	  "_id": "geoNear.1",
	  "city": "Guangzhou",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      113.306789,
	      23.1564721
	    ]
	  },
	  "docType": "geoNear",
	  "name": "Baiyun Mountain",
	  "distance": 6643.521654040738
	},
	{
	  "_id": "geoNear.2",
	  "docType": "geoNear",
	  "name": "The Palace Museum",
	  "city": "Beijing",
	  "location": {
	    "coordinates": [
	      116.3949659,
	      39.9163447
	    ],
	    "type": "Point"
	  },
	  "distance": 1894750.4414538583
	},
	{
	  "_id": "geoNear.3",
	  "docType": "geoNear",
	  "name": "Great Wall",
	  "city": "Beijing",
	  "location": {
	    "type": "Point",
	    "coordinates": [
	      116.2328567,
	      40.242373
	    ]
	  },
	  "distance": 1928300.3308822548
	}
	</code>
	</pre>
</details>

### 6.group方法
聚合阶段。将输入记录按给定表达式分组，输出时每个记录代表一个分组，每个记录的 _id 是区分不同组的 key。输出记录中也可以包括累计值，将输出字段设为累计值即会从该分组中计算累计值。

使用group可以很方便的实现类似SQL的distinct功能

**`group` 的形式如下**：
```
group({
  _id: <expression>,
  <field1>: <accumulator1>,
  ...
  <fieldN>: <accumulatorN>
})
```
`_id` 参数是必填的，如果填常量则只有一组。其他字段是可选的，都是累计值，用 `$.sum` 等累计器(`const $ = db.command.aggregate`)，但也可以使用其他表达式。

累计器必须是以下操作符之一：

|操作符			|说明			|
|------			|------						|
|addToSet		|向数组中添加值，如果数组中已存在该值，			|
|avg			|返回一组集合中，指定字段对应数据的平均值			|
|sum			|计算并且返回一组字段所有数值的总和					|
|first			|返回指定字段在一组集合的第一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义。		|
|last			|返回指定字段在一组集合的最后一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义。		|
|max			|返回一组数值的最大值								|
|min			|返回一组数值的最小值									|
|push			|在 group 阶段，返回一组中表达式指定列与对应的值，一起组成的数组		|
|stdDevPop		|返回一组字段对应值的标准差										|
|stdDevSamp		|计算输入值的样本标准偏差。如果输入值代表数据总体，或者不概括更多的数据，请改用 db.command.aggregate.stdDevPop	|
|mergeObjects	|将多个文档合并为单个文档											|

<details>
<summary style="font-weight:bold">示例 1：按字段值分组</summary>
<pre>
	<code>
	//假设集合 avatar 有如下记录：
	{
	  _id: "1",
	  alias: "john",
	  region: "asia",
	  scores: [40, 20, 80],
	  coins: 100
	}
	{
	  _id: "2",
	  alias: "arthur",
	  region: "europe",
	  scores: [60, 90],
	  coins: 20
	}
	{
	  _id: "3",
	  alias: "george",
	  region: "europe",
	  scores: [50, 70, 90],
	  coins: 50
	}
	{
	  _id: "4",
	  alias: "john",
	  region: "asia",
	  scores: [30, 60, 100, 90],
	  coins: 40
	}
	{
	  _id: "5",
	  alias: "george",
	  region: "europe",
	  scores: [20],
	  coins: 60
	}
	{
	  _id: "6",
	  alias: "john",
	  region: "asia",
	  scores: [40, 80, 70],
	  coins: 120
	}
	//操作
	const $ = db.command.aggregate
	let res = await db.collection('avatar').aggregate()
	  .group({
	    _id: '$alias',
	    num: $.sum(1)
	  })
	  .end()
	//返回结果如下：
	{
	  "_id": "john",
	  "num": 3
	}
	{
	  "_id": "authur",
	  "num": 1
	}
	{
	  "_id": "george",
	  "num": 2
	}
	</code>
	</pre>
</details>


<details>
<summary style="font-weight:bold">示例 2：按多个值分组</summary>
<pre>
	<code>
	//可以给 _id 传入记录的方式按多个值分组。还是沿用上面的示例数据，按各个区域（region）获得相同最高分（score）的来分组，并求出各组虚拟币（coins）的总量：
	const $ = db.command.aggregate
	let res = await db.collection('avatar').aggregate()
	  .group({
	    _id: {
	      region: '$region',
	      maxScore: $.max('$scores')
	    },
	    totalCoins: $.sum('$coins')
	  })
	  .end()
	//返回结果如下：
	{
	  "_id": {
	    "region": "asia",
	    "maxScore": 80
	  },
	  "totalCoins": 220
	}
	{
	  "_id": {
	    "region": "asia",
	    "maxScore": 100
	  },
	  "totalCoins": 100
	}
	{
	  "_id": {
	    "region": "europe",
	    "maxScore": 90
	  },
	  "totalCoins": 70
	}
	{
	  "_id": {
	    "region": "europe",
	    "maxScore": 20
	  },
	  "totalCoins": 60
	}
	</code>
	</pre>
</details>

### 7.limit方法
聚合阶段。限制输出到下一阶段的记录数。

<details>
<summary style="font-weight:bold">示例 1：限制返回两条记录</summary>
<pre>
	<code>
	//假设集合 items 有如下记录：
	{
	  _id: "1",
	  price: 10
	}
	{
	  _id: "2",
	  price: 50
	}
	{
	  _id: "3",
	  price: 20
	}
	{
	  _id: "4",
	  price: 80
	}
	{
	  _id: "5",
	  price: 200
	}
	//返回价格大于 20 的记录的最小的两个记录：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .match({
	    price: $.gt(20)
	  })
	  .sort({
	    price: 1,
	  })
	  .limit(2)
	  .end()
	//返回结果如下：
	{
	  "_id": "3",
	  "price": 20
	}
	{
	  "_id": "4",
	  "price": 80
	}
	</code>
	</pre>
</details>

### 8.lookup方法
聚合阶段。联表查询。与同个数据库下的一个指定的集合做 left outer join(左外连接)。对该阶段的每一个输入记录，lookup 会在该记录中增加一个数组字段，该数组是被联表中满足匹配条件的记录列表。lookup 会将连接后的结果输出给下个阶段。

**API 说明**

`lookup` 有两种使用方式
* **相等匹配**

	将输入记录的一个字段和被连接集合的一个字段进行相等匹配时，采用以下定义：
	```
	lookup({
	  from: <要连接的集合名>,
	  localField: <输入记录的要进行相等匹配的字段>,
	  foreignField: <被连接集合的要进行相等匹配的字段>,
	  as: <输出的数组字段名>
	})
	```
	参数详细说明
	
|参数字段		|说明								|
|------|------|
|from			|要进行连接的另外一个集合的名字			|
|localField		|当前流水线的输入记录的字段名，该字段将被用于与 from 指定的集合的 foreignField 进行相等匹配。如果输入记录中没有该字段，则该字段的值在匹配时会被视作 null |
|foreignField	|被连接集合的字段名，该字段会被用于与 localField 进行相等匹配。如果被连接集合的记录中没有该字段，该字段的值将在匹配时被视作 null						|
|as				|指定连接匹配出的记录列表要存放的字段名，这个数组包含的是匹配出的来自 from 集合的记录。如果输入记录中本来就已有该字段，则该字段会被覆写					|


> 示例
<details>
<summary style="font-weight:bold">示例 1：指定一个相等匹配条件</summary>
<pre>
	<code>
	//假设 orders 集合有以下记录：
	[
	  {"_id":4,"book":"novel 1","price":30,"quantity":2},
	  {"_id":5,"book":"science 1","price":20,"quantity":1},
	  {"_id":6}
	]
	//books 集合有以下记录：
	[
	  {"_id":"book1","author":"author 1","category":"novel","stock":10,"time":1564456048486,"title":"novel 1"},
	  {"_id":"book3","author":"author 3","category":"science","stock":30,"title":"science 1"},
	  {"_id":"book4","author":"author 3","category":"science","stock":40,"title":"science 2"},
	  {"_id":"book2","author":"author 2","category":"novel","stock":20,"title":"novel 2"},
	  {"_id":"book5","author":"author 4","category":"science","stock":50,"title":null},
	  {"_id":"book6","author":"author 5","category":"novel","stock":"60"}
	]
	//以下聚合操作可以通过一个相等匹配条件连接 orders 和 books 集合，匹配的字段是 orders 集合的 book 字段和 books 集合的 title 字段：
	const db = uniCloud.database()
	let res = await db.collection('orders').aggregate()
	  .lookup({
	    from: 'books',
	    localField: 'book',
	    foreignField: 'title',
	    as: 'bookList',
	  })
	  .end()
	//结果：
	[
	  {
	    "_id": 4,
	    "book": "novel 1",
	    "price": 30,
	    "quantity": 2,
	    "bookList": [
	      {
	        "_id": "book1",
	        "title": "novel 1",
	        "author": "author 1",
	        "category": "novel",
	        "stock": 10
	      }
	    ]
	  },
	  {
	    "_id": 5,
	    "book": "science 1",
	    "price": 20,
	    "quantity": 1,
	    "bookList": [
	      {
	        "_id": "book3",
	        "category": "science",
	        "title": "science 1",
	        "author": "author 3",
	        "stock": 30
	      }
	    ]
	  },
	  {
	    "_id": 6,
	    "bookList": [
	      {
	        "_id": "book5",
	        "category": "science",
	        "author": "author 4",
	        "stock": 50,
	        "title": null
	      },
	      {
	        "_id": "book6",
	        "author": "author 5",
	        "stock": "60",
	        "category": "novel"
	      }
	    ]
	  }
	]
	</code>
	</pre>
</details>
	
<details>
<summary style="font-weight:bold">示例 2：对数组字段应用相等匹配</summary>
<pre>
	<code>
	//假设 authors 集合有以下记录：
	[
	  {"_id": 1, "name": "author 1", "intro": "Two-time best-selling sci-fiction novelist"},
	  {"_id": 3, "name": "author 3", "intro": "UCB assistant professor"},
	  {"_id": 4, "name": "author 4", "intro": "major in CS"}
	]
	//books 集合有以下记录：
	[
	  {"_id":"book1","authors":["author 1"],"category":"novel","stock":10,"time":1564456048486,"title":"novel 1"},
	  {"_id":"book3","authors":["author 3", "author 4"],"category":"science","stock":30,"title":"science 1"},
	  {"_id":"book4","authors":["author 3"],"category":"science","stock":40,"title":"science 2"}
	]
	//以下操作获取作者信息及他们分别发表的书籍，使用了 lookup 操作匹配 authors 集合的 name 字段和 books 集合的 authors 数组字段：
	const db = cloud.database()
	let res = await db.collection('authors').aggregate()
	  .lookup({
	    from: 'books',
	    localField: 'name',
	    foreignField: 'authors',
	    as: 'publishedBooks',
	  })
	  .end()
	//结果
	[
	  {
	    "_id": 1,
	    "intro": "Two-time best-selling sci-fiction novelist",
	    "name": "author 1",
	    "publishedBooks": [
	      {
	        "_id": "book1",
	        "title": "novel 1",
	        "category": "novel",
	        "stock": 10,
	        "authors": [
	          "author 1"
	        ]
	      }
	    ]
	  },
	  {
	    "_id": 3,
	    "name": "author 3",
	    "intro": "UCB assistant professor",
	    "publishedBooks": [
	      {
	        "_id": "book3",
	        "category": "science",
	        "title": "science 1",
	        "stock": 30,
	        "authors": [
	          "author 3",
	          "author 4"
	        ]
	      },
	      {
	        "_id": "book4",
	        "title": "science 2",
	        "category": "science",
	        "stock": 40,
	        "authors": [
	          "author 3"
	        ]
	      }
	    ]
	  },
	  {
	    "_id": 4,
	    "intro": "major in CS",
	    "name": "author 4",
	    "publishedBooks": [
	      {
	        "_id": "book3",
	        "category": "science",
	        "title": "science 1",
	        "stock": 30,
	        "authors": [
	          "author 3",
	          "author 4"
	        ]
	      }
	    ]
	  }
	]
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：组合 mergeObjects 应用相等匹配</summary>
<pre>
	<code>
	//假设 orders 集合有以下记录：
	[
	  {"_id":4,"book":"novel 1","price":30,"quantity":2},
	  {"_id":5,"book":"science 1","price":20,"quantity":1},
	  {"_id":6}
	]
	//books 集合有以下记录：
	[
	  {"_id":"book1","author":"author 1","category":"novel","stock":10,"time":1564456048486,"title":"novel 1"},
	  {"_id":"book3","author":"author 3","category":"science","stock":30,"title":"science 1"},
	  {"_id":"book4","author":"author 3","category":"science","stock":40,"title":"science 2"},
	  {"_id":"book2","author":"author 2","category":"novel","stock":20,"title":"novel 2"},
	  {"_id":"book5","author":"author 4","category":"science","stock":50,"title":null},
	  {"_id":"book6","author":"author 5","category":"novel","stock":"60"}
	]
	//以下操作匹配 orders 的 book 字段和 books 的 title 字段，并将 books 匹配结果直接 merge 到 orders 记录中。
	var db = cloud.database()
	var $ = db.command.aggregate
	let res = await db.collection('orders').aggregate()
	  .lookup({
	    from: "books",
	    localField: "book",
	    foreignField: "title",
	    as: "bookList"
	  })
	  .replaceRoot({
	    newRoot: $.mergeObjects([ $.arrayElemAt(['$bookList', 0]), '$$ROOT' ])
	  })
	  .project({
	    bookList: 0
	  })
	  .end()
	//结果
	[
	  {
	    "_id": 4,
	    "title": "novel 1",
	    "author": "author 1",
	    "category": "novel",
	    "stock": 10,
	    "book": "novel 1",
	    "price": 30,
	    "quantity": 2
	  },
	  {
	    "_id": 5,
	    "category": "science",
	    "title": "science 1",
	    "author": "author 3",
	    "stock": 30,
	    "book": "science 1",
	    "price": 20,
	    "quantity": 1
	  },
	  {
	    "_id": 6,
	    "category": "science",
	    "author": "author 4",
	    "stock": 50,
	    "title": null
	  }
	]
	</code>
	</pre>
</details>

* **自定义连接条件、拼接子查询**

	如果需要指定除相等匹配之外的连接条件，或指定多个相等匹配条件，或需要拼接被连接集合的子查询结果，那可以使用如下定义：

	```
	lookup({
	  from: <要连接的集合名>,
	  let: { <变量1>: <表达式1>, ..., <变量n>: <表达式n> },
	  pipeline: [ <在要连接的集合上进行的流水线操作> ],
	  as: <输出的数组字段名>
	})
	```
	参数详细说明
	
|参数字段	|说明					|
|------|------|
|from		|要进行连接的另外一个集合的名字		|
|let		|可选。指定在 pipeline 中可以使用的变量，变量的值可以引用输入记录的字段，比如 let: { userName: '$name' } 就代表将输入记录的 name 字段作为变量 userName 的值。在 pipeline 中无法直接访问输入记录的字段，必须通过 let 定义之后才能访问，访问的方式是在 expr 操作符中用 $$变量名 的方式访问，比如 $$userName。	|
|pipeline	|指定要在被连接集合中运行的聚合操作。如果要返回整个集合，则该字段取值空数组 []。在 pipeline 中无法直接访问输入记录的字段，必须通过 let 定义之后才能访问，访问的方式是在 expr 操作符中用 $$变量名 的方式访问，比如 $$userName。		|
|as			|指定连接匹配出的记录列表要存放的字段名，这个数组包含的是匹配出的来自 from 集合的记录。如果输入记录中本来就已有该字段，则该字段会被覆写		|

> 示例
<details>
<summary style="font-weight:bold">示例 1：指定多个连接条件</summary>
<pre>
	<code>
	//假设 orders 集合有以下记录：
	[
	  {"_id":4,"book":"novel 1","price":300,"quantity":20},
	  {"_id":5,"book":"science 1","price":20,"quantity":1}
	]
	//books 集合有以下记录：	
	[
	  {"_id":"book1","author":"author 1","category":"novel","stock":10,"time":1564456048486,"title":"novel 1"},
	  {"_id":"book3","author":"author 3","category":"science","stock":30,"title":"science 1"}
	]
	//以下操作连接 orders 和 books 集合，要求两个条件：
	* orders 的 book 字段与 books 的 title 字段相等
	* books 的 stock 字段 大于或等于 orders 的 quantityorders 字段
	const db = cloud.database()
	const dbCmd = db.command
	const $ = dbCmd.aggregate
	let res = await db.collection('orders').aggregate()
	.lookup({
	  from: 'books',
	  let: {
	    order_book: '$book',
	    order_quantity: '$quantity'
	  },
	  pipeline: $.pipeline()
	    .match(dbCmd.expr($.and([
	      $.eq(['$title', '$$order_book']),
	      $.gte(['$stock', '$$order_quantity'])
	    ])))
	    .project({
	      _id: 0,
	      title: 1,
	      author: 1,
	      stock: 1
	    })
	    .done(),
	  as: 'bookList',
	})
	.end()
	//结果：	
	[
	{
	  "_id": 4,
	  "book": "novel 1",
	  "price": 300,
	  "quantity": 20,
	  "bookList": []
	},
	{
	  "_id": 5,
	  "book": "science 1",
	  "price": 20,
	  "quantity": 1,
	  "bookList": [
	    {
	      "title": "science 1",
	      "author": "author 3",
	      "stock": 30
	    }
	  ]
	}
	]
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：拼接被连接集合的子查询</summary>
<pre>
	<code>
	//假设 orders 集合有以下记录：
	[
	  {"_id":4,"book":"novel 1","price":30,"quantity":2},
	  {"_id":5,"book":"science 1","price":20,"quantity":1}
	]
	//books 集合有以下记录：
	[
	  {"_id":"book1","author":"author 1","category":"novel","stock":10,"time":1564456048486,"title":"novel 1"},
	  {"_id":"book3","author":"author 3","category":"science","stock":30,"title":"science 1"},
	  {"_id":"book4","author":"author 3","category":"science","stock":40,"title":"science 2"}
	]
	//在每条输出记录上加上一个数组字段，该数组字段的值是对 books 集合的一个查询语句的结果：
	const db = cloud.database()
	const $ = db.command.aggregate
	let res = await db.collection('orders').aggregate()
	  .lookup({
	    from: 'books',
	    let: {
	      order_book: '$book',
	      order_quantity: '$quantity'
	    },
	    pipeline: $.pipeline()
	      .match({
	        author: 'author 3'
	      })
	      .project({
	        _id: 0,
	        title: 1,
	        author: 1,
	        stock: 1
	      })
	      .done(),
	    as: 'bookList',
	  })
	  .end()
	//结果
	[
	  {
	    "_id": 4,
	    "book": "novel 1",
	    "price": 30,
	    "quantity": 20,
	    "bookList": [
	      {
	        "title": "science 1",
	        "author": "author 3",
	        "stock": 30
	      },
	      {
	        "title": "science 2",
	        "author": "author 3",
	        "stock": 40
	      }
	    ]
	  },
	  {
	    "_id": 5,
	    "book": "science 1",
	    "price": 20,
	    "quantity": 1,
	    "bookList": [
	      {
	        "title": "science 1",
	        "author": "author 3",
	        "stock": 30
	      },
	      {
	        "title": "science 2",
	        "author": "author 3",
	        "stock": 40
	      }
	    ]
	  }
	]
	</code>
	</pre>
</details>

### 9.match方法
聚合阶段。根据条件过滤文档，并且把符合条件的文档传递给下一个流水线阶段。

查询条件与普通查询一致，可以用普通查询操作符，注意 match 阶段和其他聚合阶段不同，不可使用聚合操作符，只能使用查询操作符。

```
// 直接使用字符串
match({
  name: 'Tony Stark'
})

// 使用操作符
const dbCmd = db.command
match({
  age: dbCmd.gt(18)
})
```



<details>
<summary style="font-weight:bold">示例 1：匹配字段返回数据</summary>
<pre>
	<code>
	//假设集合 articles 有如下记录：
	{ "_id" : "1", "author" : "stark",  "score" : 80 }
	{ "_id" : "2", "author" : "stark",  "score" : 85 }
	{ "_id" : "3", "author" : "bob",    "score" : 60 }
	{ "_id" : "4", "author" : "li",     "score" : 55 }
	{ "_id" : "5", "author" : "jimmy",  "score" : 60 }
	{ "_id" : "6", "author" : "li",     "score" : 94 }
	{ "_id" : "7", "author" : "justan", "score" : 95 }
	//匹配 下面是一个直接匹配的例子：
	let res = await db.collection('articles')
	  .aggregate()
	  .match({
	    author: 'stark'
	  })
	  .end()
	//这里的代码尝试找到所有 author 字段是 stark 的文章，那么匹配如下：
	{ "_id" : "1", "author" : "stark", "score" : 80 }
	{ "_id" : "2", "author" : "stark", "score" : 85 }
	</code>
	</pre>
</details>

---
**计数**

match 过滤出文档后，还可以与其他流水线阶段配合使用。

<details>
<summary style="font-weight:bold">示例 2：match过滤出文档后，还可以与其他流水线阶段配合使用</summary>
<pre>
	<code>
	//比如下面这个例子，我们使用 group 进行搭配，计算 score 字段大于 80 的文档数量：
	const dbCmd = db.command
	const $ = dbCmd.aggregate
	let res = await db.collection('articles')
	  .aggregate()
	  .match({
	    score: dbCmd.gt(80)
	  })
	  .group({
	      _id: null,
	      count: $.sum(1)
	  })
	  .end()
	//返回值如下：
	{ "_id" : null, "count" : 3 }
	</code>
	</pre>
</details>

### 10.project方法
聚合阶段。把指定的字段传递给下一个流水线，指定的字段可以是某个已经存在的字段，也可以是计算出来的新字段。

**project 的形式如下：**
```
project({
  <表达式>
})
```
表达式可以有以下格式：

|格式					|说明			|
|------|------|
|<字段>: <1 或 true>	|指定包含某个已有字段|
|_id: <0 或 false>		|舍弃 _id 字段	|
|<字段>: <表达式>		|加入一个新字段，或者重置某个已有字段		|
|<字段>: <0 或 false>	|舍弃某个字段（如果你指定舍弃了某个非 _id 字段，那么在此次 project 中，你不能再使用其它表达式）	|

**指定包含字段**

_id 字段是默认包含在输出中的，除此之外其他任何字段，如果想要在输出中体现的话，必须在 project 中指定； 如果指定包含一个尚不存在的字段，那么 project 会忽略这个字段，不会加入到输出的文档中；

**指定排除字段**

如果你在 project 中指定排除某个字段，那么其它字段都会体现在输出中； 如果指定排除的是非 _id 字段，那么在本次 project 中，不能再使用其它表达式；

**加入新的字段或重置某个已有字段**

你可以使用一些特殊的表达式加入新的字段，或重置某个已有字段。

**多层嵌套的字段**

有时有些字段处于多层嵌套的底层，我们可以使用点记法：

```
"contact.phone.number": <1 or 0 or 表达式>
```

也可以直接使用嵌套的格式：

```
contact: { phone: { number: <1 or 0 or 表达式> } }
```

>示例

<details>
<summary style="font-weight:bold">示例 1：指定包含某些字段</summary>
<pre>
	<code>
	//假设我们有一个 articles 集合，其中含有以下文档：
	{
		"_id": 666,
		"title": "This is title",
		"author": "Nobody",
		"isbn": "123456789",
		"introduction": "......"
	}
	//指定包含某些字段
	下面的代码使用 project，让输出只包含 _id、title 和 author 字段：
	let res = await db.collection('articles')
	  .aggregate()
	  .project({
	    title: 1,
	    author: 1
	  })
	  .end()
	//输出如下：
	{ "_id" : 666, "title" : "This is title", "author" : "Nobody" }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：去除输出中的 _id 字段</summary>
<pre>
	<code>
	//_id 是默认包含在输出中的，如果不想要它，可以指定去除它：
	let res = await db.collection('articles')
	  .aggregate()
	  .project({
	    _id: 0,  // 指定去除 _id 字段
	    title: 1,
	    author: 1
	  })
	  .end()
	//输出如下：
	{ "title" : "This is title", "author" : "Nobody" }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：去除某个非 _id 字段</summary>
<pre>
	<code>
	//我们还可以指定在输出中去掉某个非 _id 字段，这样其它字段都会被输出：
	let res = await db.collection('articles')
	  .aggregate()
	  .project({
	    isbn: 0,  // 指定去除 isbn 字段
	  })
	  .end()
	//输出如下，相比输入，没有了 isbn 字段：
	{
	    "_id" : 666,
	    "title" : "This is title",
	    "author" : "Nobody",
	    "introduction": "......"
	}
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 4：加入计算出的新字段</summary>
<pre>
	<code>
	//假设我们有一个 students 集合，其中包含以下文档：
	{
	    "_id": 1,
	    "name": "小明",
	    "scores": {
	        "chinese": 80,
	        "math": 90,
	        "english": 70
	    }
	}
	//下面的代码，我们使用 project，在输出中加入了一个新的字段 totalScore：
	const { sum } = db.command.aggregate
	let res = await db.collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    name: 1,
	    totalScore: sum([
	        "$scores.chinese",
	        "$scores.math",
	        "$scores.english"
	    ])
	  })
	  .end()
	//输出为：
	{ "name": "小明", "totalScore": 240 }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 5：加入新的数组字段</summary>
<pre>
	<code>
	//假设我们有一个 points 集合，包含以下文档：
	{ "_id": 1, "x": 1, "y": 1 }
	{ "_id": 2, "x": 2, "y": 2 }
	{ "_id": 3, "x": 3, "y": 3 }
	//下面的代码，我们使用 project，把 x 和 y 字段，放入到一个新的数组字段 coordinate 中：
	let res = await db.collection('points')
	  .aggregate()
	  .project({
	    coordinate: ["$x", "$y"]
	  })
	  .end()
	//输出如下：
	{ "_id": 1, "coordinate": [1, 1] }
	{ "_id": 2, "coordinate": [2, 2] }
	{ "_id": 3, "coordinate": [3, 3] }
	</code>
	</pre>
</details>

### 11.replaceRoot方法
聚合阶段。指定一个已有字段作为输出的根节点，也可以指定一个计算出的新字段作为根节点。

**replaceRoot 使用形式如下：**
```
replaceRoot({
    newRoot: <表达式>
})
```
表达式格式如下：

|格式		|说明														|
|------|------|
|<字段名>	|指定一个已有字段作为输出的根节点（如果字段不存在则报错）	|
|<对象>		|计算一个新字段，并且把这个新字段作为根节点					|

>示例
<details>
<summary style="font-weight:bold">示例 1：使用已有字段作为根节点</summary>
<pre>
	<code>
	//假设我们有一个 schools 集合，内容如下：
	{
	  "_id": 1,
	  "name": "SFLS",
	  "teachers": {
	    "chinese": 22,
	    "math": 18,
	    "english": 21,
	    "other": 123
	  }
	}
	//下面的代码使用 replaceRoot，把 teachers 字段作为根节点输出：
	let res = await db.collection('schools')
	  .aggregate()
	  .replaceRoot({
	    newRoot: '$teachers'
	  })
	  .end()
	//输出如下：
	{
	  "chinese": 22,
	  "math": 18,
	  "english": 21,
	  "other": 123
	}
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：使用计算出的新字段作为根节点</summary>
<pre>
	<code>
	//假设我们有一个 roles 集合，内容如下：
	{ "_id": 1, "first_name": "四郎", "last_name": "黄" }
	{ "_id": 2, "first_name": "邦德", "last_name": "马" }
	{ "_id": 3, "first_name": "牧之", "last_name": "张" }
	//下面的代码使用 replaceRoot，把 first_name 和 last_name 拼在一起：
	const { concat } = db.command.aggregate
	let res = await db.collection('roles')
	  .aggregate()
	  .replaceRoot({
	    newRoot: {
	      full_name: concat(['$last_name', '$first_name'])
	    }
	  })
	  .end()
	//输出如下：
	{ "full_name": "黄四郎" }
	{ "full_name": "马邦德" }
	{ "full_name": "张牧之" }
	</code>
	</pre>
</details>

### 12.sample方法
聚合阶段。随机从文档中选取指定数量的记录。

**sample 的形式如下：**
```
sample({
    size: <正整数>
})
```
请注意：size 是正整数，否则会出错。

<details>
<summary style="font-weight:bold">示例 1：随机选取</summary>
<pre>
	<code>
	//假设文档 users 有以下记录：
	{ "name": "a" }
	{ "name": "b" }
	//如果现在进行抽奖活动，需要选出一名幸运用户。那么 sample 的调用方式如下：
	let res = await db.collection('users')
	  .aggregate()
	  .sample({
	    size: 1
	  })
	  .end()
	//返回了随机选中的一个用户对应的记录，结果如下：
	{ "_id": "696529e4-7e82-4e7f-812e-5144714edff6", "name": "b" }
	</code>
	</pre>
</details>

### 13.skip方法
聚合阶段。指定一个正整数，跳过对应数量的文档，输出剩下的文档。

```
这段代码会跳过查找到的前 5 个文档，并且把剩余的文档输出。
let res = await db.collection('users')
  .aggregate()
  .skip(5)
  .end()
```

### 14.sort方法
聚合阶段。根据指定的字段，对输入的文档进行排序。

**形式如下：**
```
sort({
    <字段名1>: <排序规则>,
    <字段名2>: <排序规则>,
})
```

<排序规则>可以是以下取值：
* 1 代表升序排列（从小到大）；
* -1 代表降序排列（从大到小）；

>示例
<details>
<summary style="font-weight:bold">示例 1：升序/降序排列</summary>
<pre>
	<code>
	//假设我们有集合 articles，其中包含数据如下：
	{ "_id": "1", "author": "stark",  "score": 80, "age": 18 }
	{ "_id": "2", "author": "bob",    "score": 60, "age": 18 }
	{ "_id": "3", "author": "li",     "score": 55, "age": 19 }
	{ "_id": "4", "author": "jimmy",  "score": 60, "age": 22 }
	{ "_id": "5", "author": "justan", "score": 95, "age": 33 }
	//下面的代码在 students 集合中进行聚合搜索，并且将结果排序，首先根据 age 字段降序排列，然后再根据 score 字段进行降序排列。
	let res = await db.collection('articles')
	  .aggregate()
	  .sort({
	      age: -1,
	      score: -1
	  })
	  .end()
	//输出结果如下：
	{ "_id": "5", "author": "justan", "score": 95, "age": 33 }
	{ "_id": "4", "author": "jimmy",  "score": 60, "age": 22 }
	{ "_id": "3", "author": "li",     "score": 55, "age": 19 }
	{ "_id": "1", "author": "stark",  "score": 80, "age": 18 }
	{ "_id": "2", "author": "bob",    "score": 60, "age": 18 }
	</code>
	</pre>
</details>

### 15.sortByCount方法
聚合阶段。根据传入的表达式，将传入的集合进行分组（group）。然后计算不同组的数量，并且将这些组按照它们的数量进行排序，返回排序后的结果。

**sortByCount 的调用方式如下：**
`sortByCount(<表达式>)`

表达式的形式是：$ + 指定字段。请注意：不要漏写 $ 符号。

>示例
<details>
<summary style="font-weight:bold">示例 1：统计基础类型</summary>
<pre>
	<code>
	//假设集合 passages 的记录如下：
	{ "category": "Web" }
	{ "category": "Web" }
	{ "category": "Life" }
	//下面的代码就可以统计文章的分类信息，并且计算每个分类的数量。即对 category 字段执行 sortByCount 聚合操作。
	let res = await db.collection('passages')
	  .aggregate()
	  .sortByCount('$category')
	  .end()
	//返回的结果如下所示：Web 分类下有2篇文章，Life 分类下有1篇文章。
	{ "_id": "Web", "count": 2 }
	{ "_id": "Life", "count": 1 }
	</code>
	</pre>
</details>


<details>
<summary style="font-weight:bold">示例 2：解构数组类型</summary>
<pre>
	<code>
	//假设集合 passages 的记录如下：tags 字段对应的值是数组类型。
	{ "tags": [ "JavaScript", "C#" ] }
	{ "tags": [ "Go", "C#" ] }
	{ "tags": [ "Go", "Python", "JavaScript" ] }
	//如何统计文章的标签信息，并且计算每个标签的数量？因为 tags 字段对应的数组，所以需要借助 unwind 操作解构 tags 字段，然后再调用 sortByCount。
	let res = await db.collection('passages')
	  .aggregate()
	  .unwind(`$tags`)
	  .sortByCount(`$tags`)
	  .end()
	//返回的结果如下所示：
	{ "_id": "Go", "count": 2 }
	{ "_id": "C#", "count": 2 }
	{ "_id": "JavaScript", "count": 2 }
	{ "_id": "Python", "count": 1 }
	</code>
	</pre>
</details>

### 16.unwind方法
聚合阶段。使用指定的数组字段中的每个元素，对文档进行拆分。拆分后，文档会从一个变为一个或多个，分别对应数组的每个元素。

**API 说明**
使用指定的数组字段中的每个元素，对文档进行拆分。拆分后，文档会从一个变为一个或多个，分别对应数组的每个元素。

**unwind 有两种使用形式：**
* **参数是一个字段名**
```
unwind(<字段名>)
```
* **参数是一个对象**
```
unwind({
    path: <字段名>,
    includeArrayIndex: <string>,
    preserveNullAndEmptyArrays: <boolean>
})
```

|字段						|类型	|说明					|
|------|------|------|
|path						|string	|想要拆分的数组的字段名，需要以 $ 开头。	|
|includeArrayIndex			|string	|可选项，传入一个新的字段名，数组索引会保存在这个新的字段上。新的字段名不能以 $ 开头。																|
|preserveNullAndEmptyArrays	|boolean|如果为 true，那么在 path 对应的字段为 null、空数组或者这个字段不存在时，依然会输出这个文档；如果为 false，unwind 将不会输出这些文档。默认为 false。|

>示例
<details>
<summary style="font-weight:bold">示例 1：拆分数组</summary>
<pre>
	<code>
	//假设我们有一个 products 集合，包含数据如下：
	{ "_id": "1", "product": "tshirt", "size": ["S", "M", "L"] }
	{ "_id": "2", "product": "pants", "size": [] }
	{ "_id": "3", "product": "socks", "size": null }
	{ "_id": "4", "product": "trousers", "size": ["S"] }
	{ "_id": "5", "product": "sweater", "size": ["M", "L"] }
	//我们根据 size 字段对这些文档进行拆分
	db.collection('products')
	  .aggregate()
	  .unwind('$size')
	  .end()
	//返回的结果如下所示：
	{ "_id": "1", "product": "tshirt", "size": "S" }
	{ "_id": "1", "product": "tshirt", "size": "M" }
	{ "_id": "1", "product": "tshirt", "size": "L" }
	{ "_id": "4", "product": "trousers", "size": "S" }
	{ "_id": "5", "product": "sweater", "size": "M" }
	{ "_id": "5", "product": "sweater", "size": "L" }
	</code>
	</pre>
</details>


<details>
<summary style="font-weight:bold">示例 2：拆分后，保留原数组的索引</summary>
<pre>
	<code>
	//我们根据 size 字段对文档进行拆分后，想要保留原数组索引在新的 index 字段中。
	let res = await db.collection('products')
	  .aggregate()
	  .unwind({
	      path: '$size',
	      includeArrayIndex: 'index'
	  })
	  .end()
	//输出如下：
	{ "_id": "1", "product": "tshirt", "size": "S", "index": 0 }
	{ "_id": "1", "product": "tshirt", "size": "M", "index": 1 }
	{ "_id": "1", "product": "tshirt", "size": "L", "index": 2 }
	{ "_id": "4", "product": "trousers", "size": "S", "index": 0 }
	{ "_id": "5", "product": "sweater", "size": "M", "index": 0 }
	{ "_id": "5", "product": "sweater", "size": "L", "index": 1 }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：保留字段为空的文档</summary>
<pre>
	<code>
	//注意到我们的集合中有两行特殊的空值数据：
	...
	{ "_id": "2", "product": "pants", "size": [] }
	{ "_id": "3", "product": "socks", "size": null }
	...
	//如果想要在输出中保留 size 为空数组、null，或者 size 字段不存在的文档，可以使用 preserveNullAndEmptyArrays 参数
	let res = await db.collection('products')
	  .aggregate()
	  .unwind({
	      path: '$size',
	      preserveNullAndEmptyArrays: true
	  })
	  .end()
	//返回的结果如下所示：
	{ "_id": "1", "product": "tshirt", "size": "S" }
	{ "_id": "1", "product": "tshirt", "size": "M" }
	{ "_id": "1", "product": "tshirt", "size": "L" }
	{ "_id": "2", "product": "pants", "size": null }
	{ "_id": "3", "product": "socks", "size": null }
	{ "_id": "4", "product": "trousers", "size": "S" }
	{ "_id": "5", "product": "sweater", "size": "M" }
	{ "_id": "5", "product": "sweater", "size": "L" }
	</code>
	</pre>
</details>

### 17.end方法
标志聚合操作定义完成，发起实际聚合操作

**返回值**

Promise.<Object>

|属性	|类型		|说明			|
|------|------|------|
|list	|Array.<any>|聚合结果列表	|

## 聚合操作符

### 一、算术操作符
|   名称	|    说明		|
|------|------|
| abs	|  聚合阶段。添加新字段到输出的记录。 |
| add	|  聚合阶段。将数字相加或将数字加在日期上。 |
| ceil	|  聚合阶段。向上取整，返回大于或等于给定数字的最小整数。 |
| divide	|  聚合阶段。传入被除数和除数，求商。 |
| exp	|  聚合阶段。取 e（自然对数的底数，欧拉数） 的 n 次方。 |
| floor	|  向下取整，返回大于或等于给定数字的最小整数。 |
| ln	|  计算给定数字在自然对数值。 |
| log	|  计算给定数字在给定对数底下的 log 值。 |
| log10	|  计算给定数字在对数底为 10 下的 log 值。 |
| mod	|  取模运算，取数字取模后的值。 |
| multiply	|  取传入的数字参数相乘的结果。 |
| pow	|  求给定基数的指数次幂。 |
| sqrt	|  求平方根。 |
| subtract	|  将两个数字相减然后返回差值，或将两个日期相减然后返回相差的毫秒数，或将一个日期减去一个数字返回结果的日期。 |
| trunc	|  将数字截断为整形。 |

#### 1.abs方法
聚合操作符。返回一个数字的绝对值。

```
db.command.aggregate.abs(<number>)
```

abs 传入的值除了数字常量外，也可以是任何最终解析成一个数字的表达式。

如果表达式解析为 null 或者指向一个不存在的字段，则 abs 的结果是 null。如果值解析为 NaN，则结果是 NaN。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求得各个记录的 start 和 end 之间的绝对差异大小</summary>
<pre>
	<code>
	//假设集合 ratings 有如下记录：
	{ _id: 1, start: 5, end: 8 }
	{ _id: 2, start: 4, end: 4 }
	{ _id: 3, start: 9, end: 7 }
	{ _id: 4, start: 6, end: 7 }
	//可以用如下方式求得各个记录的 start 和 end 之间的绝对差异大小：
	const $ = db.command.aggregate
	let res = await db.collection('ratings').aggregate()
	  .project({
	    delta: $.abs($.subtract(['$start', '$end']))
	  })
	  .end()
	//返回结果如下：
	{ "_id" : 1, "delta" : 3 }
	{ "_id" : 2, "delta" : 0 }
	{ "_id" : 3, "delta" : 2 }
	{ "_id" : 4, "delta" : 1 }
	</code>
	</pre>
</details>

#### 2.add方法
聚合操作符。将数字相加或将数字加在日期上。如果数组中的其中一个值是日期，那么其他值将被视为毫秒数加在该日期上。

```
db.command.aggregate.add([<表达式1>, <表达式2>, ...])
```
>示例
<details>
<summary style="font-weight:bold">示例 1：数字求和</summary>
<pre>
	<code>
	//假设集合 staff 有如下记录：
	{ _id: 1, department: "x", sales: 5, engineer: 10, lastUpdate: ISODate("2019-05-01T00:00:00Z") }
	{ _id: 2, department: "y", sales: 10, engineer: 20, lastUpdate: ISODate("2019-05-01T02:00:00Z") }
	{ _id: 3, department: "z", sales: 20, engineer: 5, lastUpdate: ISODate("2019-05-02T03:00:00Z") }
	//可以用如下方式求得各个记录人数总数：
	const $ = db.command.aggregate
	let res = await db.collection('staff').aggregate()
	  .project({
	    department: 1,
	    total: $.add(['$sales', '$engineer'])
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, department: "x", total: 15 }
	{ _id: 2, department: "y", total: 30 }
	{ _id: 3, department: "z", total: 25 }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：增加日期值</summary>
<pre>
	<code>
	//如下操作可以获取各个记录的 lastUpdate 加一个小时之后的值：
	const $ = db.command.aggregate
	let res = await db.collection('staff').aggregate()
	  .project({
	    department: 1,
	    lastUpdate: $.add(['$lastUpdate', 60*60*1000])
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, department: "x", lastUpdate: ISODate("2019-05-01T01:00:00Z") }
	{ _id: 2, department: "y", lastUpdate: ISODate("2019-05-01T03:00:00Z") }
	{ _id: 3, department: "z", lastUpdate: ISODate("2019-05-02T04:00:00Z") }
	</code>
	</pre>
</details>

#### 3.ceil方法
聚合操作符。向上取整，返回大于或等于给定数字的最小整数。
```
db.command.aggregate.ceil(<number>)
```

`<number> `可以是任意解析为数字的表达式。如果表达式解析为 null 或指向一个不存在的字段，则返回 null，如果解析为 NaN，则返回 NaN。

<details>
<summary style="font-weight:bold">示例 1：取各个数字的向上取整值</summary>
<pre>
	<code>
	//假设集合 sales 有如下记录：
	{ _id: 1, sales: 5.2 }
	{ _id: 2, sales: 1.32 }
	{ _id: 3, sales: -3.2 }
	//可以用如下方式取各个数字的向上取整值：
	const $ = db.command.aggregate
	let res = await db.collection('sales').aggregate()
	  .project({
	    sales: $.ceil('$sales')
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, sales: 6 }
	{ _id: 2, sales: 2 }
	{ _id: 3, sales: -3 }
	</code>
	</pre>
</details>

#### 4.divide方法
聚合操作符。传入被除数和除数，求商。

```
db.command.aggregate.divide([<被除数表达式>, <除数表达式>])
```
表达式可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：取各个数字转换为千米之后的值</summary>
<pre>
	<code>
	//假设集合 railroads 有如下记录：
	{ _id: 1, meters: 5300 }
	{ _id: 2, meters: 64000 }
	{ _id: 3, meters: 130 }
	//可以用如下方式取各个数字转换为千米之后的值：
	const $ = db.command.aggregate
	let res = await db.collection('railroads').aggregate()
	  .project({
	    km: $.divide(['$meters', 1000])
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, km: 5.3 }
	{ _id: 2, km: 64 }
	{ _id: 3, km: 0.13 }
	</code>
	</pre>
</details>

#### 5.exp
聚合操作符。取 e（自然对数的底数，欧拉数） 的 n 次方。

```
db.command.aggregate.exp(<exponent>)
```
`<exponent>` 可以是任意解析为数字的表达式。如果表达式解析为 null 或指向一个不存在的字段，则返回 null，如果解析为 NaN，则返回 NaN。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：取各个数字转换为千米之后的值</summary>
<pre>
	<code>
	//假设集合 math 有如下记录：
	{ _id: 1, exp: 0 }
	{ _id: 2, exp: 1 }
	{ _id: 3, exp: 2 }
	//
	const $ = db.command.aggregate
	let res = await db.collection('math').aggregate()
	  .project({
	    result: $.exp('$exp')
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, result: 1 }
	{ _id: 2, result: 2.71828182845905 }
	{ _id: 3, result: 7.38905609893065 }
	</code>
	</pre>
</details>

#### 6.floor
聚合操作符。向下取整，返回大于或等于给定数字的最小整数。

```
db.command.aggregate.floor(<number>)
```
`<number> `可以是任意解析为数字的表达式。如果表达式解析为 null 或指向一个不存在的字段，则返回 null，如果解析为 NaN，则返回 NaN。
>示例代码
<details>
<summary style="font-weight:bold">示例 1：可以用如下方式取各个数字的向下取整值：</summary>
<pre>
	<code>
	//假设集合 sales 有如下记录：
	{ _id: 1, sales: 5.2 }
	{ _id: 2, sales: 1.32 }
	{ _id: 3, sales: -3.2 }
	//可以用如下方式取各个数字的向下取整值：
	const $ = db.command.aggregate
	let res = await db.collection('sales').aggregate()
	  .project({
	    sales: $.floor('$sales')
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, sales: 5 }
	{ _id: 2, sales: 1 }
	{ _id: 3, sales: -6 }
	</code>
	</pre>
</details>

#### 7.ln
聚合操作符。计算给定数字在自然对数值。

```
db.command.aggregate.ln(<number>)
```
`<number>` 可以是任意解析为非负数字的表达式。

`ln` 等价于 `log([<number>, Math.E])`，其中 `Math.E` 是 `JavaScript` 获取 `e` 的值的方法。


#### 8.log
聚合操作符。计算给定数字在给定对数底下的 log 值。

```
db.command.aggregate.log([<number>, <base>])
```
`<number>` 可以是任意解析为非负数字的表达式。`<base>` 可以是任意解析为大于 1 的数字的表达式。

如果任一参数解析为 `null` 或指向任意一个不存在的字段，`log` 返回 `null`。如果任一参数解析为 `NaN`，`log` 返回 `NaN`。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：可以用如下方式取各个数字的向下取整值：</summary>
<pre>
	<code>
	//假设集合 curve 有如下记录：
	{ _id: 1, x: 1 }
	{ _id: 2, x: 2 }
	{ _id: 3, x: 3 }
	//计算 log2(x) 的值：
	const $ = db.command.aggregate
	let res = await db.collection('curve').aggregate()
	  .project({
	    log: $.log(['$x', 2])
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, log: 0 }
	{ _id: 2, log: 1 }
	{ _id: 3, log: 1.58496250072 }
	</code>
	</pre>
</details>

#### 9.log10
聚合操作符。计算给定数字在对数底为 10 下的 log 值。

```
db.command.aggregate.log(<number>)
```
`<number>` 可以是任意解析为非负数字的表达式。

`log10` 等同于 `log` 方法的第二个参数固定为 10。

#### 10.mod
聚合操作符。取模运算，取数字取模后的值。

```
db.command.aggregate.mod([<dividend>, <divisor>])
```
第一个数字是被除数，第二个数字是除数。参数可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：可以用如下方式取各个数字的向下取整值：</summary>
<pre>
	<code>
	//假设集合 shopping 有如下记录：
	{ _id: 1, bags: 3, items: 5 }
	{ _id: 2, bags: 2, items: 8 }
	{ _id: 3, bags: 5, items: 16 }
	//各记录取 items 除以 bags 的余数（items % bags）：
	const $ = db.command.aggregate
	let res = await db.collection('shopping').aggregate()
	  .project({
	    overflow: $.mod(['$items', '$bags'])
	  })
	  .end()
	//返回结果如下：
	{ _id: 1, log: 2 }
	{ _id: 2, log: 0 }
	{ _id: 3, log: 1 }
	</code>
	</pre>
</details>

#### 11.multiply
聚合操作符。取传入的数字参数相乘的结果。

```
db.command.aggregate.multiply([<expression1>, <expression2>, ...])
```
参数可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：可以用如下方式取各个数字的向下取整值：</summary>
<pre>
	<code>
	//假设集合 fruits 有如下记录：
	{ "_id": 1, "name": "apple", "price": 10, "quantity": 100 }
	{ "_id": 2, "name": "orange", "price": 15, "quantity": 50 }
	{ "_id": 3, "name": "lemon", "price": 5, "quantity": 20 }
	//求各个水果的的总价值：
	const $ = db.command.aggregate
	let res = await db.collection('fruits').aggregate()
	  .project({
	    name: 1,
	    total: $.multiply(['$price', '$quantity']),
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "name": "apple", "total": 1000 }
	{ "_id": 2, "name": "orange", "total": 750 }
	{ "_id": 3, "name": "lemo", "total": 100 }
	</code>
	</pre>
</details>

#### 12.pow
聚合操作符。求给定基数的指数次幂。

```
db.command.aggregate.pow([<base>, <exponent>])
```
参数可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 x 和 y 的平方和：</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{ "_id": 1, "x": 2, "y": 3 }
	{ "_id": 2, "x": 5, "y": 7 }
	{ "_id": 3, "x": 10, "y": 20 }
	//求 x 和 y 的平方和：
	const $ = db.command.aggregate
	let res = await db.collection('stats').aggregate()
	  .project({
	    sumOfSquares: $.add([$.pow(['$x', 2]), $.pow(['$y', 2])]),
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "sumOfSquares": 13 }
	{ "_id": 2, "sumOfSquares": 74 }
	{ "_id": 3, "sumOfSquares": 500 }
	</code>
	</pre>
</details>

#### 13.sqrt
聚合操作符。求平方根。

```
db.command.aggregate.sqrt([<number>])
```
参数可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：假设 x 和 y 分别为两直角边，则求斜边长：</summary>
<pre>
	<code>
	//假设直角三角形集合 triangle 有如下记录：
	{ "_id": 1, "x": 2, "y": 3 }
	{ "_id": 2, "x": 5, "y": 7 }
	{ "_id": 3, "x": 10, "y": 20 }
	//假设 x 和 y 分别为两直角边，则求斜边长：
	const $ = db.command.aggregate
	let res = await db.collection('triangle').aggregate()
	  .project({
	    len: $.sqrt([$.add([$.pow(['$x', 2]), $.pow(['$y', 2])])]),
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "len": 3.605551275463989 }
	{ "_id": 2, "len": 8.602325267042627 }
	{ "_id": 3, "len": 22.360679774997898 }
	</code>
	</pre>
</details>

#### 14.subtract
聚合操作符。将两个数字相减然后返回差值，或将两个日期相减然后返回相差的毫秒数，或将一个日期减去一个数字返回结果的日期。

```
db.command.aggregate.subtract([<expression1>, <expression2>])
```
参数可以是任意解析为数字或日期的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：假设 x 和 y 分别为两直角边，则求斜边长：</summary>
<pre>
	<code>
	//假设集合 scores 有如下记录：
	{ "_id": 1, "max": 10, "min": 1 }
	{ "_id": 2, "max": 7, "min": 5 }
	{ "_id": 3, "max": 6, "min": 6 }
	//求各个记录的 max 和 min 的差值。：
	const $ = db.command.aggregate
	let res = await db.collection('scores').aggregate()
	  .project({
	    diff: $.subtract(['$max', '$min'])
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "diff": 9 }
	{ "_id": 2, "diff": 2 }
	{ "_id": 3, "diff": 0 }
	</code>
	</pre>
</details>

#### 15.trunc
聚合操作符。将数字截断为整形。

```
db.command.aggregate.trunc(<number>)
```
参数可以是任意解析为数字的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：将数字截断为整形：</summary>
<pre>
	<code>
	//假设集合 scores 有如下记录：
	{ "_id": 1, "value": 1.21 }
	{ "_id": 2, "value": 3.83 }
	{ "_id": 3, "value": -4.94 }
	//
	const $ = db.command.aggregate
	let res = await db.collection('scores').aggregate()
	  .project({
	    int: $.trunc('$value')
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "value": 1 }
	{ "_id": 2, "value": 3 }
	{ "_id": 3, "value": -4 }
	</code>
	</pre>
</details>

### 二、数组操作符

|   名称	|    说明		|
|------|------|
|  arrayElemAt	| 	聚合操作符。返回在指定数组下标的元素。   |
|  arrayToObject	| 	聚合操作符。将一个数组转换为对象。   |
|  concatArrays	| 	聚合操作符。将多个数组拼接成一个数组。   |
|  filter	| 	聚合操作符。根据给定条件返回满足条件的数组的子集。  |
|  in	| 	聚合操作符。给定一个值和一个数组，如果值在数组中则返回 true，否则返回 false。 |
|  indexOfArray	| 在数组中找出等于给定值的第一个元素的下标，如果找不到则返回 -1。 |
|  isArray	| 聚合操作符。判断给定表达式是否是数组，返回布尔值。 |
|  map	| 聚合操作符。类似 JavaScript Array 上的 map 方法，将给定数组的每个元素按给定转换方法转换后得出新的数组。 |
|  objectToArray | 聚合操作符。将一个对象转换为数组。方法把对象的每个键值对都变成输出数组的一个元素，元素形如 `{ k: <key>, v: <value> }`。|
|  range | 聚合操作符。返回一组生成的序列数字。给定开始值、结束值、非零的步长，range 会返回从开始值开始逐步增长、步长为给定步长、但不包括结束值的序列。|
|  reduce | 聚合操作符。类似 JavaScript 的 reduce 方法，应用一个表达式于数组各个元素然后归一成一个元素。|
|  reverseArray | 聚合操作符。返回给定数组的倒序形式。|
|  size | 聚合操作符。返回数组长度。|
|  slice | 聚合操作符。类似 JavaScritp 的 slice 方法。返回给定数组的指定子集。|
|  zip | 聚合操作符。把二维数组的第二维数组中的相同序号的元素分别拼装成一个新的数组进而组装成一个新的二维数组. |

#### 1.arrayElemAt
聚合操作符。返回在指定数组下标的元素。

```
db.command.aggregate.arrayElemAt([<array>, <index>])
```

`<array> `可以是任意解析为数字的表达式。

`<index> `可以是任意解析为整形的表达式。如果是正数，`arrayElemAt` 返回在 `index` 位置的元素，如果是负数，`arrayElemAt` 返回从数组尾部算起的 `index` 位置的元素。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求各个第一次考试的分数和和最后一次的分数：</summary>
<pre>
	<code>
	//假设集合 exams 有如下记录：
	{ "_id": 1, "scores": [80, 60, 65, 90] }
	{ "_id": 2, "scores": [78] }
	{ "_id": 3, "scores": [95, 88, 92] }
	//求各个第一次考试的分数和和最后一次的分数：
	const $ = db.command.aggregate
	let res = await db.collection('exams').aggregate()
	  .project({
	    first: $.arrayElemAt(['$scores', 0]),
	    last: $.arrayElemAt(['$scores', -1]),
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "first": 80, "last": 90 }
	{ "_id": 2, "first": 78, "last": 78 }
	{ "_id": 3, "first": 95, "last": 92 }
	</code>
	</pre>
</details>


#### 2.arrayToObject
聚合操作符。将一个数组转换为对象。

**语法可以取两种：**

* 第一种：传入一个二维数组，第二维的数组长度必须为 2，其第一个值为字段名，第二个值为字段值
```
db.command.aggregate.arrayToObject([
  [<key1>, <value1>],
  [<key2>, <value2>],
  ...
])
```
* 第二种：传入一个对象数组，各个对象必须包含字段 `k` 和 `v`，分别指定字段名和字段值
```
db.command.aggregate.arrayToObject([
  { "k": <key1>, "v": <value1> },
  { "k": <key2>, "v": <value2> },
  ...
])
```
传入 `arrayToObject` 的参数只要可以解析为上述两种表示法之一即可。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求各个第一次考试的分数和和最后一次的分数：</summary>
<pre>
	<code>
	//假设集合 shops 有如下记录：
	{ "_id": 1, "sales": [ ["max", 100], ["min", 50] ] }
	{ "_id": 2, "sales": [ ["max", 70], ["min", 60] ] }
	{ "_id": 3, "sales": [ { "k": "max", "v": 50 }, { "k": "min", "v": 30 } ] }
	//求各个第一次考试的分数和和最后一次的分数：
	const $ = db.command.aggregate
	let res = await db.collection('shops').aggregate()
	  .project({
	    sales: $.arrayToObject('$sales'),
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "sales": { "max": 100, "min": 50 } }
	{ "_id": 2, "sales": { "max": 70, "min": 60 } }
	{ "_id": 3, "sales": { "max": 50, "min": 30 } }
	</code>
	</pre>
</details>

#### 3.concatArrays
聚合操作符。将多个数组拼接成一个数组。


**语法如下：**

```
db.command.aggregate.concatArrays([ <array1>, <array2>, ... ])
```
参数可以是任意解析为数组的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求各个第一次考试的分数和和最后一次的分数：</summary>
<pre>
	<code>
	//假设集合 items 有如下记录：
	{ "_id": 1, "fruits": [ "apple" ], "vegetables": [ "carrot" ] }
	{ "_id": 2, "fruits": [ "orange", "lemon" ], "vegetables": [ "cabbage" ] }
	{ "_id": 3, "fruits": [ "strawberry" ], "vegetables": [ "spinach" ] }
	//求各个第一次考试的分数和和最后一次的分数：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    list: $.concatArrays(['$fruits', '$vegetables']),
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "list": [ "apple", "carrot" ] }
	{ "_id": 2, "list": [ "orange", "lemon", "cabbage" ] }
	{ "_id": 3, "list": [ "strawberry", "spinach" ] }
	</code>
	</pre>
</details>

#### 4.filter
聚合操作符。根据给定条件返回满足条件的数组的子集。

**语法如下：**

```
db.command.aggregate.filter({
  input: <array>,
  as: <string>,
  cond: <expression>
})
```
|字段	|说明	|
|------|------|
|input	|一个可以解析为数组的表达式					|
|as		|可选，用于表示数组各个元素的变量，默认为 this|
|cond	|一个可以解析为布尔值的表达式，用于判断各个元素是否满足条件，各个元素的名字由 as 参数决定（参数名需加 $$ 前缀，如 $$this）	|

参数可以是任意解析为数组的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 fruits 有如下记录：
	{
	  "_id": 1,
	  "stock": [
	    { "name": "apple", "price": 10 },
	    { "name": "orange", "price": 20 }
	  ],
	}
	{
	  "_id": 2,
	  "stock": [
	    { "name": "lemon", "price": 15 },
	  ],
	}
	//求各个第一次考试的分数和和最后一次的分数：
	const _ = db.command
	const $ = db.command.aggregate
	let res = await db.collection('fruits').aggregate()
	  .project({
	    stock: $.filter({
	      input: '$stock',
	      as: 'item',
	      cond: $.gte(['$$item.price', 15])
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "stock": [ { "name": "orange", "price": 20} ] }
	{ "_id": 2, "stock": [ { "name": "lemon", "price": 15 } ] }
	</code>
	</pre>
</details>

#### 5.in
聚合操作符。给定一个值和一个数组，如果值在数组中则返回 `true`，否则返回 `false`。

**语法如下：**

```
db.command.aggregate.in([<value>, <array>])
```
`<value>` 可以是任意表达式。

`<array>` 可以是任意解析为数组的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 shops 有如下记录：
	{ "_id": 1, "topsellers": ["bread", "ice cream", "butter"] }
	{ "_id": 2, "topsellers": ["ice cream", "cheese", "yagurt"] }
	{ "_id": 3, "topsellers": ["croissant", "cucumber", "coconut"] }
	//标记销量最高的商品包含 ice cream 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    included: $.in(['ice cream', '$topsellers'])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "included": true }
	{ "_id": 2, "included": true }
	{ "_id": 3, "included": false }
	</code>
	</pre>
</details>

#### 6.indexOfArray
聚合操作符。在数组中找出等于给定值的第一个元素的下标，如果找不到则返回 -1。

**语法如下：**

```
db.command.aggregate.indexOfArray([ <array expression>, <search expression>, <start>, <end> ])
```
|字段	|类型	|说明					|
|------|------|------|
|-		|string	|一个可以解析为数组的表达式，如果解析为 `null`，则 `indexOfArray` 返回 `null`			|
|-		|string	|对数据各个元素应用的条件匹配表达式|
|-		|integer|可选，用于指定搜索的开始下标，必须是非负整数		|
|-		|integer|可选，用于指定搜索的结束下标，必须是非负整数，指定了 时也应指定 ，否则 默认当做|

参数可以是任意解析为数组的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{
	  "_id": 1,
	  "sales": [ 1, 6, 2, 2, 5 ]
	}
	{
	  "_id": 2,
	  "sales": [ 4, 2, 1, 5, 2 ]
	}
	{
	  "_id": 3,
	  "sales": [ 2, 5, 3, 3, 1 ]
	}
	//
	const $ = db.command.aggregate
	let res = await db.collection('stats').aggregate()
	  .project({
	    index: $.indexOfArray(['$sales', 2, 2])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "index": 2 }
	{ "_id": 2, "index": 4 }
	{ "_id": 3, "index": -1 }
	</code>
	</pre>
</details>

#### 7.isArray
聚合操作符。判断给定表达式是否是数组，返回布尔值。

**语法如下：**

```
db.command.aggregate.isArray(<expression>)
```
参数可以是任意表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{
	  "_id": 1,
	  "base": 10,
	  "sales": [ 1, 6, 2, 2, 5 ]
	}
	{
	  "_id": 2,
	  "base": 1,
	  "sales": 100
	}
	//计算总销量，如果 sales 是数字，则求 sales * base，如果 sales 是数组，则求数组元素之和与 base 的乘积。
	const $ = db.command.aggregate
	let res = await db.collection('stats').aggregate()
	  .project({
	    sum: $.cond({
	      if: $.isArray('$sales'),
	      then: $.multiply([$.sum(['$sales']), '$base']),
	      else: $.multiply(['$sales', '$base']),
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "index": 160 }
	{ "_id": 2, "index": 100 }
	</code>
	</pre>
</details>

#### 8.map
聚合操作符。类似 JavaScript Array 上的 map 方法，将给定数组的每个元素按给定转换方法转换后得出新的数组。

**语法如下：**

```
db.command.aggregate.map({
  input: <expression>,
  as: <string>,
  in: <expression>
})
```
|字段	|说明								|
|------|------|
|input	|一个可以解析为数组的表达式				|
|as		|可选，用于表示数组各个元素的变量，默认为 this	|
|in		|一个可以应用在给定数组的各个元素上的表达式，各个元素的名字由 as 参数决定（参数名需加 $$ 前缀，如 $$this）	|

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{
	  "_id": 1,
	  "sales": [ 1.32, 6.93, 2.48, 2.82, 5.74 ]
	}
	{
	  "_id": 2,
	  "sales": [ 2.97, 7.13, 1.58, 6.37, 3.69 ]
	}
	//将各个数字截断为整形，然后求和
	const $ = db.command.aggregate
	let res = await db.collection('stats').aggregate()
	  .project({
	    truncated: $.map({
	      input: '$sales',
	      as: 'num',
	      in: $.trunc('$$num'),
	    })
	  })
	  .project({
	    total: $.sum('$truncated')
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "index": 16 }
	{ "_id": 2, "index": 19 }
	</code>
	</pre>
</details>

#### 9.objectToArray
聚合操作符。将一个对象转换为数组。方法把对象的每个键值对都变成输出数组的一个元素，元素形如 { k: <key>, v: <value> }。

**语法如下：**

```
db.command.aggregate.objectToArray(<object>)
```
|字段	|说明								|
|------|------|
|input	|一个可以解析为数组的表达式				|
|as		|可选，用于表示数组各个元素的变量，默认为 this	|
|in		|一个可以应用在给定数组的各个元素上的表达式，各个元素的名字由 as 参数决定（参数名需加 $$ 前缀，如 $$this）	|

>示例代码
<details>
<summary style="font-weight:bold">示例 1：根据给定条件返回满足条件的数组的子集。：</summary>
<pre>
	<code>
	//假设集合 items 有如下记录：
	{ "_id": 1, "attributes": { "color": "red", "price": 150 } }
	{ "_id": 2, "attributes": { "color": "blue", "price": 50 } }
	{ "_id": 3, "attributes": { "color": "yellow", "price": 10 } }
	//将各个数字截断为整形，然后求和
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    array: $.objectToArray('$attributes')
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "array": [{ "k": "color", "v": "red" }, { "k": "price", "v": 150 }] }
	{ "_id": 2, "array": [{ "k": "color", "v": "blue" }, { "k": "price", "v": 50 }] }
	{ "_id": 3, "array": [{ "k": "color", "v": "yellow" }, { "k": "price", "v": 10 }] }
	</code>
	</pre>
</details>

#### 10.range
聚合操作符。返回一组生成的序列数字。给定开始值、结束值、非零的步长，`range` 会返回从开始值开始逐步增长、步长为给定步长、但不包括结束值的序列。


**语法如下：**

```
db.command.aggregate.range([<start>, <end>, <non-zero step>])
```
|字段			|说明													|
|------			|------													|
|start			|开始值，一个可以解析为整形的表达式						|
|end			|结束值，一个可以解析为整形的表达式						|
|non-zero step	|可选，步长，一个可以解析为非零整形的表达式，默认为 1	|

>示例代码
<details>
<summary style="font-weight:bold">示例 1：。：</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{ "_id": 1, "max": 52 }
	{ "_id": 2, "max": 38 }
	//
	const $ = db.command.aggregate
	db.collection('stats').aggregate()
	  .project({
	    points: $.range([0, '$max', 10])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "points": [0, 10, 20, 30, 40, 50] }
	{ "_id": 2, "points": [0, 10, 20] }
	</code>
	</pre>
</details>

#### 11.reduce
聚合操作符。类似 JavaScript 的 `reduce` 方法，应用一个表达式于数组各个元素然后归一成一个元素。

**语法如下：**

```
db.command.aggregate.reduce({
  input: <array>
  initialValue: <expression>,
  in: <expression>
})
```
|字段			|说明							|
|------			|------							|
|input			|输入数组，可以是任意解析为数组的表达式	|
|initialValue	|初始值			|
|in				|用来作用于每个元素的表达式，在 in 中有两个可用变量，value 是表示累计值的变量，this 是表示当前数组元素的变量|

>示例代码
<details>
<summary style="font-weight:bold">示例 1：简易字符串拼接</summary>
<pre>
	<code>
	//假设集合 player 有如下记录：
	{ "_id": 1, "fullname": [ "Stephen", "Curry" ] }
	{ "_id": 2, "fullname": [ "Klay", "Thompsom" ] }
	//获取各个球员的全名，并加 Player: 前缀：
	const $ = db.command.aggregate
	let res = await db.collection('player').aggregate()
	  .project({
	    info: $.reduce({
	      input: '$fullname',
	      initialValue: 'Player:',
	      in: $.concat(['$$value', ' ', '$$this']),
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "info": "Player: Stephen Curry" }
	{ "_id": 2, "info": "Player: Klay Thompson" }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：获取各个球员的全名，不加前缀：</summary>
<pre>
	<code>
	//假设集合 player 有如下记录：
	{ "_id": 1, "fullname": [ "Stephen", "Curry" ] }
	{ "_id": 2, "fullname": [ "Klay", "Thompsom" ] }
	//获取各个球员的全名，不加前缀：
	const $ = db.command.aggregate
	let res = await db.collection('player').aggregate()
	  .project({
	    name: $.reduce({
	      input: '$fullname',
	      initialValue: '',
	      in: $.concat([
	        '$$value',
	        $.cond({
	          if: $.eq(['$$value', '']),
	          then: '',
	          else: ' ',
	        }),
	        '$$this',
	      ]),
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "name": "Stephen Curry" }
	{ "_id": 2, "name": "Klay Thompson" }
	</code>
	</pre>
</details>

#### 12.reverseArray
聚合操作符。返回给定数组的倒序形式。

**语法如下：**

```
db.command.aggregate.reverseArray(<array>)
```
参数可以是任意解析为数组表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：返回给定数组的倒序形式。</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{
	  "_id": 1,
	  "sales": [ 1, 2, 3, 4, 5 ]
	}
	//取 sales 倒序：
	const $ = db.command.aggregate
	let res = await db.collection('stats').aggregate()
	  .project({
	    reversed: $.reverseArray('$sales'),
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "reversed": [5, 4, 3, 2, 1] }
	</code>
	</pre>
</details>

#### 13.size
聚合操作符。返回数组长度。

**语法如下：**

```
db.command.aggregate.size(<array>)
```
`<array>` 可以是任意解析为数组的表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：计算各个商店的雇员数量。</summary>
<pre>
	<code>
	//假设集合 shops 有如下记录：
	{ "_id": 1, "staff": [ "John", "Middleton", "George" ] }
	{ "_id": 2, "staff": [ "Steph", "Jack" ] }
	//计算各个商店的雇员数量：
	const $ = db.command.aggregate
	let res = await db.collection('shops').aggregate()
	  .project({
	    totalStaff: $.size('$staff')
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "totalStaff": 3 }
	{ "_id": 2, "totalStaff": 2 }
	</code>
	</pre>
</details>

#### 14.slice
聚合操作符。类似 JavaScritp 的 slice 方法。返回给定数组的指定子集。

**语法有两种：**

* 返回从开头或结尾开始的 n 个元素：
```
db.command.aggregate.slice([<array>, <n>])
```
* 返回从指定位置算作数组开头、再向后或向前的 n 个元素：
```
db.command.aggregate.slice([<array>, <position>, <n>])
```
`<array>` 可以是任意解析为数组的表达式。

`<position>` 可以是任意解析为整形的表达式。如果是正数，则将数组的第 `<position>` 个元素作为数组开始；如果 `<position>` 比数组长度更长，slice 返回空数组。如果是负数，则将数组倒数第` <position>` 个元素作为数组开始；如果 `<position>` 的绝对值大于数组长度，则开始位置即为数组开始位置。

`<n>` 可以是任意解析为整形的表达式。如果 `<position> `有提供，则 `<n>` 必须为正整数。如果是正数，`slice` 返回前 `n` 个元素。如果是负数，`slice` 返回后 `n` 个元素。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：统一返回前两个爱好。</summary>
<pre>
	<code>
	//假设集合 people 有如下记录：
	{ "_id": 1, "hobbies": [ "basketball", "football", "tennis", "badminton" ] }
	{ "_id": 2, "hobbies": [ "golf", "handball" ] }
	{ "_id": 3, "hobbies": [ "table tennis", "swimming", "rowing" ] }
	//统一返回前两个爱好：
	const $ = db.command.aggregate
	let res = await db.collection('fruits').aggregate()
	  .project({
	    hobbies: $.slice(['$hobbies', 2]),
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "hobbies": [ "basketball", "football" ] }
	{ "_id": 2, "hobbies": [ "golf", "handball" ] }
	{ "_id": 3, "hobbies": [ "table tennis", "swimming" ] }
	</code>
	</pre>
</details>

#### 15.zip
聚合操作符。把二维数组的第二维数组中的相同序号的元素分别拼装成一个新的数组进而组装成一个新的二维数组。如可将 `[ [ 1, 2, 3 ], [ "a", "b", "c" ] ] `转换成 `[ [ 1, "a" ], [ 2, "b" ], [ 3, "c" ] ]`。

**语法有两种：**

```
db.command.aggregate.zip({
  inputs: [<array1>, <array2>, ...],
  useLongestLength: <boolean>,
  defaults: <array>
})
```

`inputs` 是一个二维数组（`inputs` 不可以是字段引用），其中每个元素的表达式（这个可以是字段引用）都可以解析为数组。如果其中任意一个表达式返回 `null`，`<inputs>` 也返回 `null`。如果其中任意一个表达式不是指向一个合法的字段 / 解析为数组 / 解析为 `null`，则返回错误。

`useLongestLength` 决定输出数组的长度是否采用输入数组中的最长数组的长度。默认为 `false`，即输入数组中的最短的数组的长度即是输出数组的各个元素的长度。

`defaults` 是一个数组，用于指定在输入数组长度不一的情况下时采用的数组各元素默认值。指定这个字段则必须指定 `useLongestLength`，否则返回错误。如果 `useLongestLength` 是 `true` 但是 `defaults` 是空或没有指定，则 `zip` 用 `null` 做数组元素的缺省默认值。指定各元素默认值时 `defaults` 数组的长度必须是输入数组最大的长度。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：只传 inputs</summary>
<pre>
	<code>
	//假设集合 stats 有如下记录：
	{ "_id": 1, "zip1": [1, 2], "zip2": [3, 4], "zip3": [5, 6] ] }
	{ "_id": 2, "zip1": [1, 2], "zip2": [3], "zip3": [4, 5, 6] ] }
	{ "_id": 3, "zip1": [1, 2], "zip2": [3] ] }
	//只传 inputs：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    zip: $.zip({
	      inputs: [
	        '$zip1', // 字段引用
	        '$zip2',
	        '$zip3',
	      ],
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "zip": [ [1, 3, 5], [2, 4, 6] ] }
	{ "_id": 2, "zip": [ [1, 3, 4] ] }
	{ "_id": 3, "zip": null }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：设置 useLongestLength</summary>
<pre>
	<code>
	//如果设 useLongestLength 为 true：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    zip: $.zip({
	      inputs: [
	        '$zip1', // 字段引用
	        '$zip2',
	        '$zip3',
	      ],
	      useLongestLength: true,
	    })
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "zip": [ [1, 3, 5], [2, 4, 6] ] }
	{ "_id": 2, "zip": [ [1, 3, 4], [2, null, 5], [null, null, 6] ] }
	{ "_id": 3, "zip": null }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：设置 defaults</summary>
<pre>
	<code>
	//设置 defaults
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    zip: $.zip({
	      inputs: [
	        '$zip1', // 字段引用
	        '$zip2',
	        '$zip3',
	      ],
	      useLongestLength: true,
	      defaults: [-300, -200, -100],
	    })
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "zip": [ [1, 3, 5], [2, 4, 6] ] }
	{ "_id": 2, "zip": [ [1, 3, 4], [2, -200, 5], [-300, -200, 6] ] }
	{ "_id": 3, "zip": null }
	</code>
	</pre>
</details>

### 三、布尔操作符

|   名称	|    说明		|
|------|------|
|  and	| 	聚合操作符。给定多个表达式，`and` 仅在所有表达式都返回 `true` 时返回 `true`，否则返回 `false`。   |
|  not	| 	给定一个表达式，如果表达式返回 true，则 not 返回 false，否则返回 true。注意表达式不能为逻辑表达式（and、or、nor、not）。   |
|  or	| 	给定多个表达式，如果任意一个表达式返回 true，则 or 返回 true，否则返回 false。   |

#### 1.and
聚合操作符。给定多个表达式，`and` 仅在所有表达式都返回 `true` 时返回 `true`，否则返回 `false`。

```
db.command.aggregate.and([<expression1>, <expression2>, ...])
```

如果表达式返回 `false`、`null`、`0`、或 `undefined`，表达式会解析为 `false`，否则对其他返回值都认为是 `true`。


>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 min 大于等于 30 且 max 小于等于 80 的记录：</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "min": 10, "max": 100 }
	{ "_id": 2, "min": 60, "max": 80 }
	{ "_id": 3, "min": 30, "max": 50 }
	//求 min 大于等于 30 且 max 小于等于 80 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    fullfilled: $.and([$.gte(['$min', 30]), $.lte(['$max', 80])])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "fullfilled": false }
	{ "_id": 2, "fullfilled": true }
	{ "_id": 3, "fullfilled": true }
	</code>
	</pre>
</details>

#### 2.not
聚合操作符。给定一个表达式，如果表达式返回 `true`，则 `not` 返回 `false`，否则返回 `true`。注意表达式不能为逻辑表达式（`and`、`or`、`nor`、`not`）。

```
db.command.aggregate.not(<expression>)
```

如果表达式返回 `false`、`null`、`0`、或 `undefined`，表达式会解析为 `false`，否则对其他返回值都认为是 `true`。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 min 不大于 40 的记录。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "min": 10, "max": 100 }
	{ "_id": 2, "min": 60, "max": 80 }
	{ "_id": 3, "min": 30, "max": 50 }
	//求 min 不大于 40 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    fullfilled: $.not($.gt(['$min', 40]))
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "fullfilled": true }
	{ "_id": 2, "fullfilled": false }
	{ "_id": 3, "fullfilled": true }
	</code>
	</pre>
</details>

#### 3.or
聚合操作符。给定多个表达式，如果任意一个表达式返回 true，则 or 返回 true，否则返回 false。

```
db.command.aggregate.or([<expression1>, <expression2>, ...])
```

如果表达式返回 `false`、`null`、`0`、或 `undefined`，表达式会解析为 `false`，否则对其他返回值都认为是 `true`。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 min 小于 40 且 max 大于 60 的记录。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "min": 10, "max": 100 }
	{ "_id": 2, "min": 60, "max": 80 }
	{ "_id": 3, "min": 30, "max": 50 }
	//求 min 小于 40 且 max 大于 60 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    fullfilled: $.or([$.lt(['$min', 30]), $.gt(['$max', 60])])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "fullfilled": true }
	{ "_id": 2, "fullfilled": false }
	{ "_id": 3, "fullfilled": true }
	</code>
	</pre>
</details>

### 四、比较操作符

|   名称	|    说明		|
|------|------|
|  cmp	| 	聚合操作符。给定两个值，返回其比较值：   |
|  eq	| 	聚合操作符。匹配两个值，如果相等则返回 true，否则返回 false。   |
|  gt	| 	聚合操作符。匹配两个值，如果前者大于后者则返回 true，否则返回 false。   |
|  gte	| 	聚合操作符。匹配两个值，如果前者大于或等于后者则返回 true，否则返回 false。   |
|  lt	| 	聚合操作符。匹配两个值，如果前者小于后者则返回 true，否则返回 false。   |
|  lte	| 	聚合操作符。匹配两个值，如果前者小于或等于后者则返回 true，否则返回 false。   |
|  neq	| 	聚合操作符。匹配两个值，如果不相等则返回 true，否则返回 false。   |

#### 1.cmp
聚合操作符。给定两个值，返回其比较值：

如果第一个值小于第二个值，返回 -1 如果第一个值大于第二个值，返回 1 如果两个值相等，返回 0

```
db.command.aggregate.cmp([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 shop1 和 shop2 的各个物品的价格对比：</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "shop1": 10, "shop2": 100 }
	{ "_id": 2, "shop1": 80, "shop2": 20 }
	{ "_id": 3, "shop1": 50, "shop2": 50 }
	//求 shop1 和 shop2 的各个物品的价格对比
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    compare: $.cmp(['$shop1', '$shop2']))
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "compare": -1 }
	{ "_id": 2, "compare": 1 }
	{ "_id": 3, "compare": 0 }
	</code>
	</pre>
</details>

#### 2.eq
聚合操作符。匹配两个值，如果相等则返回 true，否则返回 false。

```
db.command.aggregate.eq([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：求 value 等于 50 的记录。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	//求 value 等于 50 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    matched: $.eq(['$value', 50])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "matched": false }
	{ "_id": 2, "matched": false }
	{ "_id": 3, "matched": true }
	</code>
	</pre>
</details>

#### 3.gt
聚合操作符。匹配两个值，如果前者大于后者则返回 true，否则返回 false。

```
db.command.aggregate.gt([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：判断 value 是否大于 50。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	//判断 value 是否大于 50。
	const $ = db.command.aggregate
	db.collection('price').aggregate()
	  .project({
	    matched: $.gt(['$value', 50])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "matched": false }
	{ "_id": 2, "matched": true }
	{ "_id": 3, "matched": false }
	</code>
	</pre>
</details>

#### 4.gte
聚合操作符。匹配两个值，如果前者大于或等于后者则返回 true，否则返回 false。

```
db.command.aggregate.gte([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：判断 value 是否大于或等于 50。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	//判断 value 是否大于或等于 50。
	const $ = db.command.aggregate
	let res = await b.collection('price').aggregate()
	  .project({
	    matched: $.gte(['$value', 50])
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "matched": false }
	{ "_id": 2, "matched": true }
	{ "_id": 3, "matched": true }
	</code>
	</pre>
</details>

#### 5.lt
聚合操作符。匹配两个值，如果前者小于或等于后者则返回 true，否则返回 false。

```
db.command.aggregate.lt([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：判断 value 是否小于 50。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	//判断 value 是否小于 50。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    matched: $.lt(['$value', 50])
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "matched": true }
	{ "_id": 2, "matched": false }
	{ "_id": 3, "matched": false }
	</code>
	</pre>
</details>

#### 6.lte
聚合操作符。匹配两个值，如果前者小于后者则返回 true，否则返回 false。

```
db.command.aggregate.lte([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：判断 value 是否小于 50。</summary>
<pre>
	<code>
	//假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	判断 value 是否小于 50。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    matched: $.lte(['$value', 50])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "matched": true }
	{ "_id": 2, "matched": false }
	{ "_id": 3, "matched": true }
	</code>
	</pre>
</details>


#### 7.neq
聚合操作符。匹配两个值，如果不相等则返回 true，否则返回 false。

```
db.command.aggregate.neq([<value1>, <value2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：判断 value 是否小于 50。</summary>
<pre>
	<code>
	假设集合 price 有如下记录：
	{ "_id": 1, "value": 10 }
	{ "_id": 2, "value": 80 }
	{ "_id": 3, "value": 50 }
	求 value 不等于 50 的记录。
	const $ = db.command.aggregate
	let res = await db.collection('price').aggregate()
	  .project({
	    matched: $.neq(['$value', 50])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "matched": true }
	{ "_id": 2, "matched": true }
	{ "_id": 3, "matched": false }
	</code>
	</pre>
</details>

### 五、条件操作符

|   名称	|    说明		|
|------|------|
|  cond	| 	聚合操作符。计算布尔表达式，返回指定的两个值其中之一：   |
|  ifNull	| 	聚合操作符。计算给定的表达式，如果表达式结果为 null、undefined 或者不存在，那么返回一个替代值；否则返回原值。  |
|  switch	| 	聚合操作符。根据给定的 switch-case-default 计算返回值、   |

#### 1.cond
聚合操作符。计算布尔表达式，返回指定的两个值其中之一。

cond 的使用形式如下：
```
cond({ if: <布尔表达式>, then: <真值>, else: <假值>  })
```
或者：
```
cond([ <布尔表达式>, <真值>, <假值> ])
```

两种形式中，三个参数（if、then、else）都是必须的。

如果布尔表达式为真，那么 $cond 将会返回 <真值>，否则会返回 <假值>

>示例代码
<details>
<summary style="font-weight:bold">示例 1：使用 cond，根据 amount 字段，来生成新的字段 discount：</summary>
<pre>
	<code>
	//假设集合 items 的记录如下：
	{ "_id": "0", "name": "item-a", "amount": 100 }
	{ "_id": "1", "name": "item-b", "amount": 200 }
	{ "_id": "2", "name": "item-c", "amount": 300 }
	//我们可以使用 cond，根据 amount 字段，来生成新的字段 discount：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    name: 1,
	    discount: $.cond({
	        if: $.gte(['$amount', 200]),
	        then: 0.7,
	        else: 0.9
	    })
	  })
	  .end()
	//输出如下：
	{ "_id": "0", "name": "item-a", "discount": 0.9 }
	{ "_id": "1", "name": "item-b", "discount": 0.7 }
	{ "_id": "2", "name": "item-c", "discount": 0.7 }
	</code>
	</pre>
</details>

#### 2.ifNull
聚合操作符。计算给定的表达式，如果表达式结果为 null、undefined 或者不存在，那么返回一个替代值；否则返回原值。

ifNull 的使用形式如下：
```
ifNull([ <表达式>, <替代值> ])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：使用 ifNull，对不存在 desc 字段的文档，或者 desc 字段为 null 的文档，补充一个替代值：</summary>
<pre>
	<code>
	//假设集合 items 的记录如下：
	{ "_id": "0", "name": "A", "description": "这是商品A" }
	{ "_id": "1", "name": "B", "description": null }
	{ "_id": "2", "name": "C" }
	//我们可以使用 ifNull，对不存在 desc 字段的文档，或者 desc 字段为 null 的文档，补充一个替代值。
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    _id: 0,
	    name: 1,
	    description: $.ifNull(['$description', '商品描述空缺'])
	  })
	  .end()
	//输出如下：
	{ "name": "A", "description": "这是商品A" }
	{ "name": "B", "description": "商品描述空缺" }
	{ "name": "C", "description": "商品描述空缺" }
	</code>
	</pre>
</details>

#### 3.switch
聚合操作符。根据给定的 switch-case-default 计算返回值、

switch 的使用形式如下：
```
switch({
    branches: [
        case: <表达式>, then: <表达式>,
        case: <表达式>, then: <表达式>,
        ...
    ],
    default: <表达式>
})
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：使用 switch，根据 amount 字段，来生成新的字段 discount：</summary>
<pre>
	<code>
	//假设集合 items 的记录如下：
	{ "_id": "0", "name": "item-a", "amount": 100 }
	{ "_id": "1", "name": "item-b", "amount": 200 }
	{ "_id": "2", "name": "item-c", "amount": 300 }
	//我们可以使用 switch，根据 amount 字段，来生成新的字段 discount：
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    name: 1,
	    discount: $.switch({
	        branches: [
	            { case: $.gt(['$amount', 250]), then: 0.8 },
	            { case: $.gt(['$amount', 150]), then: 0.9 }
	        ],
	        default: 1
	    })
	  })
	  .end()
	//输出如下：
	{ "_id": "0", "name": "item-a", "discount": 1 }
	{ "_id": "1", "name": "item-b", "discount": 0.9 }
	{ "_id": "2", "name": "item-c", "discount": 0.8 }
	</code>
	</pre>
</details>

### 六、日期操作符

以下日期操作符中timezone均支持以下几种形式
```
timezone: "Asia/Shanghai" // Asia/Shanghai时区
timezone: "+08" // utc+8时区
timezone: "+08:30" // 时区偏移8小时30分
timezone: "+0830" // 时区偏移8小时30分，同上
```

|   名称	|    说明		|
|------|------|
|  dateFromParts	| 	聚合操作符。给定日期的相关信息，构建并返回一个日期对象。(阿里云不支持)   |
|  dateFromString	| 	聚合操作符。将一个日期/时间字符串转换为日期对象。(阿里云不支持)  |
|  dateToString	| 	聚合操作符。根据指定的表达式将日期对象格式化为符合要求的字符串。(阿里云不支持)   |
|  dayOfMonth	| 	聚合操作符。返回日期字段对应的天数（一个月中的哪一天），是一个介于 1 至 31 之间的数字。   |
|  dayOfWeek	| 	聚合操作符。返回日期字段对应的天数（一周中的第几天），是一个介于 1（周日）到 7（周六）之间的整数。   |
|  dayOfYear	| 	聚合操作符。返回日期字段对应的天数（一年中的第几天），是一个介于 1 到 366 之间的整数。  |
|  hour	| 	聚合操作符。返回日期字段对应的小时数，是一个介于 0 到 23 之间的整数。  |
|  isoDayOfWeek	| 	聚合操作符。返回日期字段对应的 ISO 8601 标准的天数（一周中的第几天），是一个介于 1（周一）到 7（周日）之间的整数。  |
|  isoWeek	| 	聚合操作符。返回日期字段对应的 ISO 8601 标准的周数（一年中的第几周），是一个介于 1 到 53 之间的整数。  |
|  isoWeekYear	| 	聚合操作符。返回日期字段对应的 ISO 8601 标准的天数（一年中的第几天）。  |
|  millisecond	| 	聚合操作符。返回日期字段对应的毫秒数，是一个介于 0 到 999 之间的整数。  |
|  minute	| 	聚合操作符。返回日期字段对应的分钟数，是一个介于 0 到 59 之间的整数。  |
|  month	| 	聚合操作符。返回日期字段对应的月份，是一个介于 1 到 12 之间的整数。  |
|  second	| 	聚合操作符。返回日期字段对应的秒数，是一个介于 0 到 59 之间的整数，在特殊情况下（闰秒）可能等于 60。  |
|  week	| 	返回日期字段对应的周数（一年中的第几周），是一个介于 0 到 53 之间的整数。  |
|  year	| 	聚合操作符。返回日期字段对应的年份。  |
|  subtract	| 	聚合操作符。见[subtract][subtract]  |

#### 1.dateFromParts
聚合操作符。给定日期的相关信息，构建并返回一个日期对象。

语法如下：
```
db.command.aggregate.dateFromParts({
    year: <year>,
    month: <month>,
    day: <day>,
    hour: <hour>,
    minute: <minute>,
    second: <second>,
    millisecond: <ms>,
    timezone: <tzExpression>
})
```
你也可以使用 ISO 8601 的标准：
```
db.command.aggregate.dateFromParts({
    isoWeekYear: <year>,
    isoWeek: <week>,
    isoDayOfWeek: <day>,
    hour: <hour>,
    minute: <minute>,
    second: <second>,
    millisecond: <ms>,
    timezone: <tzExpression>
})
```
>说明

`timezone`字段请参考[Olson Timezone Identifier][List_of_tz_database_time_zones]，形式类似：`Asia/Shanghai`

>示例代码
<details>
<summary style="font-weight:bold">示例 1：给定日期的相关信息，构建并返回一个日期对象。</summary>
<pre>
	<code>
	const $ = db.command.aggregate
    let res = await db
      .collection('dates')
      .aggregate()
      .project({
        _id: 0,
        date: $.dateFromParts({
            year: 2017,
            month: 2,
            day: 8,
            hour: 12,
            timezone: 'America/New_York'
        }),
      })
      .end()
	//输出如下：
	{
        "date": ISODate("2017-02-08T17:00:00.000Z")
    }
	</code>
	</pre>
</details>

#### 2.dateFromString
聚合操作符。将一个日期/时间字符串转换为日期对象

语法如下：
```
db.command.aggregate.dateFromString({
    dateString: <dateStringExpression>,
    timezone: <tzExpression>
})
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：将一个日期/时间字符串转换为日期对象</summary>
<pre>
	<code>
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    date: $.dateFromString({
	        dateString: "2019-05-14T09:38:51.686Z"
	    })
	  })
	  .end()
	//输出如下：
	{
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	</code>
	</pre>
</details>

#### 3.dateToString
聚合操作符。根据指定的表达式将日期对象格式化为符合要求的字符串。

dateToString 的调用形式如下：

```
db.command.aggregate.dateToString({
  date: <日期表达式>,
  format: <格式化表达式>,
  timezone: <时区表达式>,
  onNull: <空值表达式>
})
```
下面是四种表达式的详细说明：

|名称			|描述		|
|-------|-----------|
|日期表达式		|必选。指定字段值应该是能转化为字符串的日期。|
|格式化表达式	|可选。它可以是任何包含“格式说明符”的有效字符串。|
|时区表达式		|可选。指明运算结果的时区。它可以解析格式为 UTC Offset 或者 Olson Timezone Identifier 的字符串。|
|空值表达式		|可选。当 <日期表达式> 返回空或者不存在的时候，会返回此表达式指明的值。|

下面是格式说明符的详细说明：

|说明符	|描述								|合法值		|
|-------|-------|-------|
|%d		|月份的日期（2位数，0填充）			|01 - 31	|
|%G		|ISO 8601 格式的年份				|0000 - 9999|
|%H		|小时（2位数，0填充，24小时制）		|00 - 23	|
|%j		|一年中的一天（3位数，0填充）		|001 - 366	|
|%L		|毫秒（3位数，0填充）				|000 - 999	|
|%m		|月份（2位数，0填充）				|01 - 12	|
|%M		|分钟（2位数，0填充）				|00 - 59	|
|%S		|秒（2位数，0填充）					|00 - 60	|
|%w		|星期几								|1 - 7		|
|%u		|ISO 8601 格式的星期几				|1 - 7		|
|%U		|一年中的一周（2位数，0填充）		|00 - 53	|
|%V		|ISO 8601 格式的一年中的一周		|1 - 53		|
|%Y		|年份（4位数，0填充）				|0000 - 9999|
|%z		|与 UTC 的时区偏移量				|+/-[hh][mm]|
|%Z		|以分钟为单位，与 UTC 的时区偏移量	|+/-mmm		|
|%%		|百分号作为字符						|%			|

>示例代码
<details>
<summary style="font-weight:bold">示例 1：格式化日期</summary>
<pre>
	<code>
	假设集合 students 有如下记录：
	{ "date": "1999-12-11T16:00:00.000Z", "firstName": "Yuanxin", "lastName": "Dong" }
	{ "date": "1998-11-10T16:00:00.000Z", "firstName": "Weijia", "lastName": "Wang" }
	{ "date": "1997-10-09T16:00:00.000Z", "firstName": "Chengxi", "lastName": "Li" }
	//下面是将 date 字段的值，格式化成形如 年份-月份-日期 的字符串：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    formatDate: $.dateToString({
	      date: '$date',
	      format: '%Y-%m-%d'
	    })
	  })
	  .end()
	//返回的结果如下：
	{ "formatDate": "1999-12-11" }
	{ "formatDate": "1998-11-10" }
	{ "formatDate": "1997-10-09" 
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：时区时间</summary>
<pre>
	<code>
	//下面是将 date 字段值格式化为上海时区时间的例子：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    formatDate: $.dateToString({
	      date: '$date',
	      format: '%H:%M:%S',
	      timezone: 'Asia/Shanghai'
	    })
	  })
	  .end()
	//返回的结果如下：
	{ "formatDate": "00:00:00" }
	{ "formatDate": "00:00:00" }
	{ "formatDate": "00:00:00" }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 3：缺失情况的默认值</summary>
<pre>
	<code>
	//当指定的 <日期表达式> 返回空或者不存在的时候，可以设置缺失情况下的默认值：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    formatDate: $.dateToString({
	      date: '$empty',
	      onNull: 'null'
	    })
	  })
	  .end()
	//返回的结果如下：
	{ "formatDate": "null" }
	{ "formatDate": "null" }
	{ "formatDate": "null" }
	</code>
	</pre>
</details>

#### 4.dayOfMonth
聚合操作符。返回日期字段对应的天数（一个月中的哪一天），是一个介于 1 至 31 之间的数字。

```
db.command.aggregate.dayOfMonth(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 dayOfMonth() 对 date 字段进行投影，获取对应的日期：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    dayOfMonth: $.dayOfMonth('$date')
	  })
	  .end()
	//输出如下：
	{
	    "dayOfMonth": 14
	}
	</code>
	</pre>
</details>

#### 5.dayOfWeek
聚合操作符。返回日期字段对应的天数（一周中的第几天），是一个介于 1（周日）到 7（周六）之间的整数。  

注意：周日是每周的第 1 天*

```
db.command.aggregate.dayOfWeek(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 dayOfWeek() 对 date 字段进行投影，获取对应的天数（一周中的第几天）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    dayOfWeek: $.dayOfWeek('$date')
	  })
	  .end()
	//输出如下：
	{
	    "dayOfWeek": 3
	}
	</code>
	</pre>
</details>

#### 6.dayOfYear
聚合操作符。返回日期字段对应的天数（一年中的第几天），是一个介于 1 到 366 之间的整数。 

```
db.command.aggregate.dayOfYear(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 dayOfYear() 对 date 字段进行投影，获取对应的天数（一年中的第几天）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    dayOfYear: $.dayOfYear('$date')
	  })
	  .end()
	//输出如下：
	{
	    "dayOfYear": 134
	}
	</code>
	</pre>
</details>

#### 7.hour
聚合操作符。返回日期字段对应的小时数，是一个介于 0 到 23 之间的整数。

```
db.command.aggregate.hour(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 hour() 对 date 字段进行投影，获取对应的小时数：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    hour: $.hour('$date')
	  })
	  .end()
	//输出如下：
	{
	    "hour": 9
	}
	</code>
	</pre>
</details>

#### 8.isoDayOfWeek
聚合操作符。返回日期字段对应的 ISO 8601 标准的天数（一周中的第几天），是一个介于 1（周一）到 7（周日）之间的整数。

```
db.command.aggregate.month(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 month() 对 date 字段进行投影，获取对应的 ISO 8601 标准的天数（一周中的第几天）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    isoDayOfWeek: $.isoDayOfWeek('$date')
	  })
	  .end()
	//输出如下：
	{
	    "isoDayOfWeek": 2
	}
	</code>
	</pre>
</details>

#### 9.isoWeek
聚合操作符。返回日期字段对应的 ISO 8601 标准的周数（一年中的第几周），是一个介于 1 到 53 之间的整数。

根据 ISO 8601 标准，周一到周日视为一周，本年度第一个周四所在的那周，视为本年度的第 1 周。

例如：2016 年 1 月 7 日是那年的第一个周四，那么 2016.01.04（周一）到 2016.01.10（周日） 即为第 1 周。同理，2016 年 1 月 1 日的周数为 53。

语法如下：

```
db.command.aggregate.isoWeek(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 isoWeek() 对 date 字段进行投影，获取对应的 ISO 8601 标准的周数（一年中的第几周）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    isoWeek: $.isoWeek('$date')
	  })
	  .end()
	//输出如下：
	{
	    "isoWeek": 20
	}
	</code>
	</pre>
</details>

#### 10.isoWeekYear
聚合操作符。返回日期字段对应的 ISO 8601 标准的天数（一年中的第几天）。

API 说明
此处的“年”以第一周的周一为开始，以最后一周的周日为结束。

语法如下：

```
db.command.aggregate.isoWeekYear(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 isoWeekYear() 对 date 字段进行投影，获取对应的 ISO 8601 标准的天数（一年中的第几天）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    isoWeekYear: $.isoWeekYear('$date')
	  })
	  .end()
	//输出如下：
	{
	    "isoWeekYear": 2019
	}
	</code>
	</pre>
</details>

#### 11.millisecond
聚合操作符。返回日期字段对应的毫秒数，是一个介于 0 到 999 之间的整数。

语法如下：

```
db.command.aggregate.millisecond(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 millisecond() 对 date 字段进行投影，获取对应的毫秒数：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    millisecond: $.millisecond('$date'),
	  })
	  .end()
	//输出如下：
	{
	    "millisecond": 686
	}
	</code>
	</pre>
</details>

#### 12.minute
聚合操作符。返回日期字段对应的分钟数，是一个介于 0 到 59 之间的整数。

语法如下：

```
db.command.aggregate.minute(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 minute() 对 date 字段进行投影，获取对应的分钟数：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    minute: $.minute('$date')
	  })
	  .end()
	//输出如下：
	{
	    "minute": 38
	}
	</code>
	</pre>
</details>


#### 13.month
聚合操作符。返回日期字段对应的月份，是一个介于 1 到 12 之间的整数。

语法如下：

```
db.command.aggregate.month(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 month() 对 date 字段进行投影，获取对应的月份：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    month: $.month('$date')
	  })
	  .end()
	//输出如下：
	{
	    "month": 5
	}
	</code>
	</pre>
</details>


#### 14.second
聚合操作符。返回日期字段对应的秒数，是一个介于 0 到 59 之间的整数，在特殊情况下（闰秒）可能等于 60。

语法如下：

```
db.command.aggregate.second(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 second() 对 date 字段进行投影，获取对应的秒数：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    second: $.second('$date')
	  })
	  .end()
	//输出如下：
	{
	    "second": 51
	}
	</code>
	</pre>
</details>

#### 15.week
聚合操作符。返回日期字段对应的周数（一年中的第几周），是一个介于 0 到 53 之间的整数。

每周以周日为开头，每年的第一个周日即为 week 1 的开始，这天之前是 week 0。


语法如下：

```
db.command.aggregate.week(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 week() 对 date 字段进行投影，获取对应的周数（一年中的第几周）：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    week: $.week('$date')
	  })
	  .end()
	//输出如下：
	{
	    "week": 19
	}
	</code>
	</pre>
</details>

#### 16.year
聚合操作符。返回日期字段对应的年份。

语法如下：

```
db.command.aggregate.year(<日期字段>)
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 dates 有以下文档：
	{
	    "_id": 1,
	    "date": ISODate("2019-05-14T09:38:51.686Z")
	}
	//我们使用 year() 对 date 字段进行投影，获取对应的年份：
	const $ = db.command.aggregate
	let res = await db
	  .collection('dates')
	  .aggregate()
	  .project({
	    _id: 0,
	    year: $.year('$date')
	  })
	  .end()
	//输出如下：
	{
	    "year": 2019
	}
	</code>
	</pre>
</details>

#### 17.subtract
见[subtract][subtract]


[List_of_tz_database_time_zones]:https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
[subtract]:https://uniapp.dcloud.net.cn/uniCloud/cf-database?id=subtract


### 七、常量操作符

#### 1.literal
聚合操作符。直接返回一个值的字面量，不经过任何解析和处理。

```
literal(<值>)
```

如果 `<值>` 是一个表达式，那么 `literal` 不会解析或者计算这个表达式，而是直接返回这个表达式。


>示例代码
<details>
<summary style="font-weight:bold">示例 1：以字面量的形式使用 $：</summary>
<pre>
	<code>
	//比如我们有一个 items 集合，其中数据如下：
	{ "_id": "0", "price": "$1" }
	{ "_id": "1", "price": "$5.60" }
	{ "_id": "2", "price": "$8.90" }
	以字面量的形式使用 $
	下面的代码使用 literal，生成了一个新的字段 isOneDollar，表示 price 字段是否严格等于 "$1"。
	注意：我们这里无法使用 eq(['$price', '$1'])，因为 "$1" 是一个表达式，代表 "1" 字段对应的值，而不是字符串字面量 "$1"。
	const $ = db.command.aggregate
	let res = await db.collection('items').aggregate()
	  .project({
	    isOneDollar: $.eq(['$price', $.literal('$1')])
	  })
	  .end()
	//输出如下：
	{ "_id": "0", "isOneDollar": true }
	{ "_id": "1", "isOneDollar": false }
	{ "_id": "2", "isOneDollar": false }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：投影一个字段，对应的值为 1：</summary>
<pre>
	<code>
	//下面的代码使用 literal，投影了一个新的字段 amount，其值为 1。
	const $ = db.command.aggregate
	db.collection('items').aggregate()
	  .project({
	    price: 1,
	    amount: $.literal(1)
	  })
	  .end()
	//输出如下：
	{ "_id": "0", "price": "$1", "amount": 1 }
	{ "_id": "1", "price": "$5.60", "amount": 1 }
	{ "_id": "2", "price": "$8.90", "amount": 1 }
	</code>
	</pre>
</details>

### 八、对象操作符

#### 1.mergeObjects
聚合操作符。将多个文档合并为单个文档。

使用形式如下： 在 `group()` 中使用时：
```
mergeObjects(<document>)
```

在其它表达式中使用时：
```
mergeObjects([<document1>, <document2>, ...])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：搭配 group() 使用</summary>
<pre>
	<code>
	//假设集合 sales 存在以下文档：
	{ "_id": 1, "year": 2018, "name": "A", "volume": { "2018Q1": 500, "2018Q2": 500 } }
	{ "_id": 2, "year": 2017, "name": "A", "volume": { "2017Q1": 400, "2017Q2": 300, "2017Q3": 0, "2017Q4": 0 } }
	{ "_id": 3, "year": 2018, "name": "B", "volume": { "2018Q1": 100 } }
	{ "_id": 4, "year": 2017, "name": "B", "volume": { "2017Q3": 100, "2017Q4": 250 } }
	//下面的代码使用 mergeObjects()，将用相同 name 的文档合并：
	const $ = db.command.aggregate
	let res = await db.collection('sales').aggregate()
	  .group({
	    _id: '$name',
	    mergedVolume: $.mergeObjects('$volume')
	  })
	  .end()
	//输出如下：
	{ "_id": "A", "mergedVolume": { "2017Q1": 400, "2017Q2": 300, "2017Q3": 0, "2017Q4": 0, "2018Q1": 500, "2018Q2": 500 } }
	{ "_id": "B", "mergedVolume": { "2017Q3": 100, "2017Q4": 250, "2018Q1": 100 } }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：一般用法</summary>
<pre>
	<code>
	//假设集合 test 存在以下文档：
	{ "_id": 1, "foo": { "a": 1 }, "bar": { "b": 2 } }
	{ "_id": 2, "foo": { "c": 1 }, "bar": { "d": 2 } }
	{ "_id": 3, "foo": { "e": 1 }, "bar": { "f": 2 } }
	//下面的代码使用 mergeObjects()，将文档中的 foo 和 bar 字段合并为 foobar：
	const $ = db.command.aggregate
	let res = await db.collection('sales').aggregate()
	  .project({
	    foobar: $.mergeObjects(['$foo', '$bar'])
	  })
	  .end()
	//输出结果如下：
	{ "_id": 1, "foobar": { "a": 1, "b": 2 } }
	{ "_id": 2, "foobar": { "c": 1, "d": 2 } }
	{ "_id": 3, "foobar": { "e": 1, "f": 2 } }
	</code>
	</pre>
</details>

#### 2.objectToArray
见[objectToArray][objectToArray]


### 九、集合操作符

|   名称	|    说明		|
|------|------|
|  allElementsTrue	| 	聚合操作符。输入一个数组，或者数组字段的表达式。如果数组中所有元素均为真值，那么返回 true，否则返回 false。空数组永远返回 true。   |
|  anyElementTrue	| 	聚合操作符。输入一个数组，或者数组字段的表达式。如果数组中任意一个元素为真值，那么返回 true，否则返回 false。空数组永远返回 false。   |
|  setDifference | 	聚合操作符，输入两个集合，输出只存在于第一个集合中的元素。  |
|  setEquals | 	聚合操作符，输入两个集合，判断两个集合中包含的元素是否相同（不考虑顺序、去重）。  |
|  setIntersection | 	聚合操作符，输入两个集合，输出两个集合的交集。  |
|  setIsSubset | 	聚合操作符，输入两个集合，输出两个集合的交集。  |
|  setUnion | 	聚合操作符，输入两个集合，输出两个集合的并集。  |

#### 1.allElementsTrue
聚合操作符。输入一个数组，或者数组字段的表达式。如果数组中所有元素均为真值，那么返回 true，否则返回 false。空数组永远返回 true。

```
allElementsTrue([<expression>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1：</summary>
<pre>
	<code>
	//假设集合 test 有如下记录：
	{ "_id": 1, "array": [ true ] }
	{ "_id": 2, "array": [ ] }
	{ "_id": 3, "array": [ false ] }
	{ "_id": 4, "array": [ true, false ] }
	{ "_id": 5, "array": [ 0 ] }
	{ "_id": 6, "array": [ "stark" ] }
	//下面的代码使用 allElementsTrue()，判断 array 字段中是否均为真值：
	const $ = db.command.aggregate
	let res = await db.collection('price')
	  .aggregate()
	  .project({
	    isAllTrue: $.allElementsTrue(['$array'])
	  })
	  .end()
	//返回结果如下：
	{ "_id": 1, "isAllTrue": true }
	{ "_id": 2, "isAllTrue": true }
	{ "_id": 3, "isAllTrue": false }
	{ "_id": 4, "isAllTrue": false }
	{ "_id": 5, "isAllTrue": false }
	{ "_id": 6, "isAllTrue": true }
	</code>
	</pre>
</details>

#### 2.anyElementTrue
聚合操作符。输入一个数组，或者数组字段的表达式。如果数组中任意一个元素为真值，那么返回 true，否则返回 false。空数组永远返回 false。

```
anyElementTrue([<expression>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 test 有如下记录：
	{ "_id": 1, "array": [ true ] }
	{ "_id": 2, "array": [ ] }
	{ "_id": 3, "array": [ false ] }
	{ "_id": 4, "array": [ true, false ] }
	{ "_id": 5, "array": [ 0 ] }
	{ "_id": 6, "array": [ "stark" ] }
	下面的代码使用 anyElementTrue()，判断 array 字段中是否含有真值：
	const $ = db.command.aggregate
	let res = await db.collection('price')
	  .aggregate()
	  .project({
	    isAnyTrue: $.anyElementTrue(['$array'])
	  })
	  .end()
	返回结果如下：
	{ "_id": 1, "isAnyTrue": true }
	{ "_id": 2, "isAnyTrue": false }
	{ "_id": 3, "isAnyTrue": false }
	{ "_id": 4, "isAnyTrue": true }
	{ "_id": 5, "isAnyTrue": false }
	{ "_id": 6, "isAnyTrue": true }
	</code>
	</pre>
</details>

#### 3.setDifference
聚合操作符，输入两个集合，输出只存在于第一个集合中的元素。

```
setDifference([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 test 存在以下数据：
	{ "_id": 1, "A": [ 1, 2 ], "B": [ 1, 2 ] }
	{ "_id": 2, "A": [ 1, 2 ], "B": [ 2, 1, 2 ] }
	{ "_id": 3, "A": [ 1, 2 ], "B": [ 1, 2, 3 ] }
	{ "_id": 4, "A": [ 1, 2 ], "B": [ 3, 1 ] }
	{ "_id": 5, "A": [ 1, 2 ], "B": [ ] }
	{ "_id": 6, "A": [ 1, 2 ], "B": [ {}, [] ] }
	{ "_id": 7, "A": [ ], "B": [ ] }
	{ "_id": 8, "A": [ ], "B": [ 1 ] }
	//下面的代码使用 setDifference，找到只存在于 B 中的数字：
	let res = await db.collection('test')
	  .aggregate()
	  .project({
	    isBOnly: $.setDifference(['$B', '$A'])
	  })
	  .end()
	{ "_id": 1, "isBOnly": [] }
	{ "_id": 2, "isBOnly": [3] }
	{ "_id": 3, "isBOnly": [3] }
	{ "_id": 4, "isBOnly": [5] }
	{ "_id": 5, "isBOnly": [] }
	{ "_id": 6, "isBOnly": [{}, []] }
	{ "_id": 7, "isBOnly": [] }
	{ "_id": 8, "isBOnly": [1] }
	</code>
	</pre>
</details>

#### 4.setEquals
聚合操作符，输入两个集合，判断两个集合中包含的元素是否相同（不考虑顺序、去重）。

```
setEquals([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 test 存在以下数据：
	{ "_id": 1, "A": [ 1, 2 ], "B": [ 1, 2 ] }
	{ "_id": 2, "A": [ 1, 2 ], "B": [ 2, 1, 2 ] }
	{ "_id": 3, "A": [ 1, 2 ], "B": [ 1, 2, 3 ] }
	{ "_id": 4, "A": [ 1, 2 ], "B": [ 3, 1 ] }
	{ "_id": 5, "A": [ 1, 2 ], "B": [ ] }
	{ "_id": 6, "A": [ 1, 2 ], "B": [ {}, [] ] }
	{ "_id": 7, "A": [ ], "B": [ ] }
	{ "_id": 8, "A": [ ], "B": [ 1 ] }
	//下面的代码使用 setEquals，判断两个集合中包含的元素是否相同：
	let res = await db.collection('test')
	  .aggregate()
	  .project({
	    sameElements: $.setEquals(['$A', '$B'])
	  })
	  .end()
	{ "_id": 1, "sameElements": true }
	{ "_id": 2, "sameElements": true }
	{ "_id": 3, "sameElements": false }
	{ "_id": 4, "sameElements": false }
	{ "_id": 5, "sameElements": false }
	{ "_id": 6, "sameElements": false }
	{ "_id": 7, "sameElements": true }
	{ "_id": 8, "sameElements": false }
	</code>
	</pre>
</details>

#### 5.setIntersection
聚合操作符，输入两个集合，输出两个集合的交集。

```
setIntersection([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 test 存在以下数据：
	{ "_id": 1, "A": [ 1, 2 ], "B": [ 1, 2 ] }
	{ "_id": 2, "A": [ 1, 2 ], "B": [ 2, 1, 2 ] }
	{ "_id": 3, "A": [ 1, 2 ], "B": [ 1, 2, 3 ] }
	{ "_id": 4, "A": [ 1, 2 ], "B": [ 3, 1 ] }
	{ "_id": 5, "A": [ 1, 2 ], "B": [ ] }
	{ "_id": 6, "A": [ 1, 2 ], "B": [ {}, [] ] }
	{ "_id": 7, "A": [ ], "B": [ ] }
	{ "_id": 8, "A": [ ], "B": [ 1 ] }
	//下面的代码使用 setIntersection，输出两个集合的交集：
	let res = await db.collection('test')
	  .aggregate()
	  .project({
	    commonToBoth: $.setIntersection(['$A', '$B'])
	  })
	  .end()
	//输出如下：
	{ "_id": 1, "commonToBoth": [ 1, 2 ] }
	{ "_id": 2, "commonToBoth": [ 1, 2 ] }
	{ "_id": 3, "commonToBoth": [ 1, 2 ] }
	{ "_id": 4, "commonToBoth": [ 1 ] }
	{ "_id": 5, "commonToBoth": [ ] }
	{ "_id": 6, "commonToBoth": [ ] }
	{ "_id": 7, "commonToBoth": [ ] }
	{ "_id": 8, "commonToBoth": [ ] }
	</code>
	</pre>
</details>

#### 6.setIsSubset
聚合操作符，输入两个集合，判断第一个集合是否是第二个集合的子集。

```
setIsSubset([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 test 存在以下数据：
	{ "_id": 1, "A": [ 1, 2 ], "B": [ 1, 2 ] }
	{ "_id": 2, "A": [ 1, 2 ], "B": [ 2, 1, 2 ] }
	{ "_id": 3, "A": [ 1, 2 ], "B": [ 1, 2, 3 ] }
	{ "_id": 4, "A": [ 1, 2 ], "B": [ 3, 1 ] }
	{ "_id": 5, "A": [ 1, 2 ], "B": [ ] }
	{ "_id": 6, "A": [ 1, 2 ], "B": [ {}, [] ] }
	{ "_id": 7, "A": [ ], "B": [ ] }
	{ "_id": 8, "A": [ ], "B": [ 1 ] }
	//下面的代码使用 setIsSubset，判断第一个集合是否是第二个集合的子集：
	let res = await db.collection('test')
	  .aggregate()
	  .project({
	    AisSubsetOfB: $.setIsSubset(['$A', '$B'])
	  })
	  .end()
	{ "_id": 1, "AisSubsetOfB": true }
	{ "_id": 2, "AisSubsetOfB": true }
	{ "_id": 3, "AisSubsetOfB": true }
	{ "_id": 4, "AisSubsetOfB": false }
	{ "_id": 5, "AisSubsetOfB": false }
	{ "_id": 6, "AisSubsetOfB": false }
	{ "_id": 7, "AisSubsetOfB": true }
	{ "_id": 8, "AisSubsetOfB": true }
	</code>
	</pre>
</details>

#### 7.setUnion
聚合操作符，输入两个集合，输出两个集合的并集。

```
setUnion([<expression1>, <expression2>])
```

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 test 存在以下数据：
	{ "_id": 1, "A": [ 1, 2 ], "B": [ 1, 2 ] }
	{ "_id": 2, "A": [ 1, 2 ], "B": [ 2, 1, 2 ] }
	{ "_id": 3, "A": [ 1, 2 ], "B": [ 1, 2, 3 ] }
	{ "_id": 4, "A": [ 1, 2 ], "B": [ 3, 1 ] }
	{ "_id": 5, "A": [ 1, 2 ], "B": [ ] }
	{ "_id": 6, "A": [ 1, 2 ], "B": [ {}, [] ] }
	{ "_id": 7, "A": [ ], "B": [ ] }
	{ "_id": 8, "A": [ ], "B": [ 1 ] }
	//下面的代码使用 setUnion，输出两个集合的并集：
	let res = await db.collection('test')
	  .aggregate()
	  .project({
	    AB: $.setUnion(['$A', '$B'])
	  })
	  .end()
	//输出如下：
	{ "_id": 1, "AB": [ 1, 2 ] }
	{ "_id": 2, "AB": [ 1, 2 ] }
	{ "_id": 3, "AB": [ 1, 2, 3 ] }
	{ "_id": 4, "AB": [ 1, 2, 3 ] }
	{ "_id": 5, "AB": [ 1, 2 ] }
	{ "_id": 6, "AB": [ 1, 2, {}, [] ] }
	{ "_id": 7, "AB": [ ] }
	{ "_id": 8, "AB": [ 1 ] }
	</code>
	</pre>
</details>

### 十、字符串操作符

|   名称	|    说明		|
|------|------|
|  concat	| 	聚合操作符。连接字符串，返回拼接后的字符串。   |
|  dateFromString	| 	见[dateFromString][dateFromString]   |
|  dateFromString | 	见[dateToString][dateToString]  |
|  indexOfBytes | 	聚合操作符。在目标字符串中查找子字符串，并返回第一次出现的 UTF-8 的字节索引（从0开始）。如果不存在子字符串，返回 -1。  |
|  indexOfCP | 	聚合操作符。在目标字符串中查找子字符串，并返回第一次出现的 UTF-8 的 code point 索引（从0开始）。如果不存在子字符串，返回 -1.  |
|  split | 	聚合操作符。按照分隔符分隔数组，并且删除分隔符，返回子字符串组成的数组。如果字符串无法找到分隔符进行分隔，返回原字符串作为数组的唯一元素。  |
|  strLenBytes | 	聚合操作符。计算并返回指定字符串中 utf-8 编码的字节数量。  |
|  strLenCP | 	聚合操作符。计算并返回指定字符串的UTF-8 code points 数量。  |
|  strcasecmp | 	聚合操作符。对两个字符串在不区分大小写的情况下进行大小比较，并返回比较的结果。  |
|  substr | 聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。它是 db.command.aggregate.substrBytes 的别名，更推荐使用后者  |
|  substrBytes | 聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。子字符串是由字符串中指定的 UTF-8 字节索引的字符开始，长度为指定的字节数。  |
|  substrCP | 聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。子字符串是由字符串中指定的 UTF-8 字节索引的字符开始，长度为指定的字节数。  |
|  toLower | 聚合操作符。将字符串转化为小写并返回。  |
|  toUpper | 聚合操作符。将字符串转化为大写并返回。  |

#### 1.concat
聚合操作符。连接字符串，返回拼接后的字符串。

```
db.command.aggregate.concat([<表达式1>, <表达式2>, ...])
```
表达式可以是形如` $ + 指定字段`，也可以是普通字符串。只要能够被解析成字符串即可。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	//借助 concat 可以拼接 lastName 和 firstName 字段，得到每位学生的名字全称：
	const $ = db.command.aggregate
	db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    fullName: $.concat(['$firstName', ' ', '$lastName'])
	  })
	  .end()
	//返回的结果如下：
	{ "fullName": "Yuanxin Dong" }
	{ "fullName": "Weijia Wang" }
	{ "fullName": "Chengxi Li" }
	</code>
	</pre>
</details>

#### 2.dateFromString
见[dateFromString][dateFromString]

#### 3.dateToString
见[dateToString][dateToString]

#### 4.indexOfBytes
聚合操作符。在目标字符串中查找子字符串，并返回第一次出现的 UTF-8 的字节索引（从0开始）。如果不存在子字符串，返回 -1。

```
db.command.aggregate.indexOfBytes([<目标字符串表达式>, <子字符串表达式>, <开始位置表达式>, <结束位置表达式>])
```
下面是 4 种表达式的详细描述：

|表达式				|描述								|
|-------|-------|
|目标字符串表达式	|任何可以被解析为字符串的表达式		|
|子字符串表达式		|任何可以被解析为字符串的表达式		|
|开始位置表达式		|任何可以被解析为非负整数的表达式	|
|结束位置表达式		|任何可以被解析为非负整数的表达式	|

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	//借助 indexOfBytes 查找字符 "a" 在字段 firstName 中的位置：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    aStrIndex: $.indexOfBytes(['$firstName', 'a'])
	  })
	  .end()
	//返回的结果如下：
	{ "aStrIndex": 2 }
	{ "aStrIndex": 5 }
	{ "aStrIndex": -1 }
	</code>
	</pre>
</details>

#### 5.indexOfCP
聚合操作符。在目标字符串中查找子字符串，并返回第一次出现的 UTF-8 的 code point 索引（从0开始）。如果不存在子字符串，返回 -1。

`code point` 是“码位”，又名“编码位置”。这里特指 `Unicode` 包中的码位，范围是从0（16进制）到10FFFF（16进制）。

`indexOfCP` 的语法如下：
```
db.command.aggregate.indexOfCP([<目标字符串表达式>, <子字符串表达式>, <开始位置表达式>, <结束位置表达式>])
```
下面是 4 种表达式的详细描述：

|表达式				|描述								|
|-------|-------|
|目标字符串表达式	|任何可以被解析为字符串的表达式		|
|子字符串表达式		|任何可以被解析为字符串的表达式		|
|开始位置表达式		|任何可以被解析为非负整数的表达式	|
|结束位置表达式		|任何可以被解析为非负整数的表达式	|

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	//借助 indexOfCP 查找字符 "a" 在字段 firstName 中的位置：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    aStrIndex: $.indexOfCP(['$firstName', 'a'])
	  })
	  .end()
	//返回的结果如下：
	{ "aStrIndex": 2 }
	{ "aStrIndex": 5 }
	{ "aStrIndex": -1 }
	</code>
	</pre>
</details>

#### 6.split
聚合操作符。按照分隔符分隔数组，并且删除分隔符，返回子字符串组成的数组。如果字符串无法找到分隔符进行分隔，返回原字符串作为数组的唯一元素。

```
db.command.aggregate.split([<字符串表达式>, <分隔符表达式>])
```
字符串表达式和分隔符表达式可以是任意形式的表达式，只要它可以被解析为字符串即可。


>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "birthday": "1999/12/12" }
	{ "birthday": "1998/11/11" }
	{ "birthday": "1997/10/10" }
	通过 split 将每条记录中的 birthday 字段对应值分隔成数组，每个数组分别由代表年、月、日的3个元素组成：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    birthday: $.split(['$birthday', '/'])
	  })
	  .end()
	返回的结果如下：
	{ "birthday": [ "1999", "12", "12" ] }
	{ "birthday": [ "1998", "11", "11" ] }
	{ "birthday": [ "1997", "10", "10" ] }
	</code>
	</pre>
</details>

#### 7.strLenBytes
聚合操作符。计算并返回指定字符串中 `utf-8` 编码的字节数量。

```
db.command.aggregate.strLenBytes(<表达式>)
```
只要表达式可以被解析成字符串，那么它就是有效表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "name": "dongyuanxin", "nickname": "心谭" }
	借助 strLenBytes 计算 name 字段和 nickname 字段对应值的字节长度：
	const $ = db.command.aggregate
	db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    nameLength: $.strLenBytes('$name'),
	    nicknameLength: $.strLenBytes('$nickname')
	  })
	  .end()
	返回结果如下：
	{ "nameLength": 11, "nicknameLength": 6 }
	</code>
	</pre>
</details>

#### 8.strLenCP
聚合操作符。计算并返回指定字符串的UTF-8 code points 数量。

```
db.command.aggregate.strLenCP(<表达式>)
```
只要表达式可以被解析成字符串，那么它就是有效表达式。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "name": "dongyuanxin", "nickname": "心谭" }
	借助 strLenCP 计算 name 字段和 nickname 字段对应值的UTF-8 code points的数量：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    nameLength: $.strLenCP('$name'),
	    nicknameLength: $.strLenCP('$nickname')
	  })
	  .end()
	返回结果如下：
	{ "nameLength": 11, "nicknameLength": 2 }
	</code>
	</pre>
</details>

#### 9.strcasecmp
聚合操作符。对两个字符串在不区分大小写的情况下进行大小比较，并返回比较的结果。

```
db.command.aggregate.strcasecmp([<表达式1>, <表达式2>])
```
只要 `表达式1`和 `表达式2 `可以被解析成字符串，那么它们就是有效的。

返回的比较结果有1，0和-1三种：

* 1：`表达式1` 解析的字符串 > `表达式2` 解析的字符串 - 0：`表达式1` 解析的字符串 = `表达式2` 解析的字符串 - -1：`表达式1` 解析的字符串 < `表达式2` 解析的字符串

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	借助 strcasecmp 比较 firstName 字段值和 lastName 字段值的大小：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    result: $.strcasecmp(['$firstName', '$lastName']),
	  })
	  .end()
	返回结果如下：
	{ "result": 1 }
	{ "result": 1 }
	{ "result": -1 }
	</code>
	</pre>
</details>

#### 10.substr
聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。它是 `db.command.aggregate.substrBytes` 的别名，更推荐使用后者。

```
db.command.aggregate.substr([<表达式1>, <表达式2>, <表达式3>])
```
`表达式1` 是任何可以解析为字符串的有效表达式，表达式2 和 表达式3 是任何可以解析为数字的有效表达式。

如果 `表达式2` 是负数，返回的结果为 `""`。

如果 `表达式3` 是负数，返回的结果为从 `表达式2` 指定的开始位置以及之后其余部分的子字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "birthday": "1999/12/12", "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "birthday": "1998/11/11", "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "birthday": "1997/10/10", "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	借助 substr 可以提取 birthday 中的年、月、日信息，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    year: $.substr(['$birthday', 0, 4]),
	    month: $.substr(['$birthday', 5, 2]),
	    day: $.substr(['$birthday', 8, -1])
	  })
	  .end()
	返回的结果如下：
	{ "day": "12", "month": "12", "year": "1999" }
	{ "day": "11", "month": "11", "year": "1998" }
	{ "day": "10", "month": "10", "year": "1997" }
	</code>
	</pre>
</details>

#### 11.substrBytes
聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。子字符串是由字符串中指定的 `UTF-8` 字节索引的字符开始，长度为指定的字节数。

```
db.command.aggregate.substrBytes([<表达式1>, <表达式2>, <表达式3>])
```
`表达式1` 是任何可以解析为字符串的有效表达式，`表达式2` 和 `表达式3` 是任何可以解析为数字的有效表达式。

如果 `表达式2` 是负数，返回的结果为 ""。

如果 `表达式3` 是负数，返回的结果为从 `表达式2` 指定的开始位置以及之后其余部分的子字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "birthday": "1999/12/12", "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "birthday": "1998/11/11", "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "birthday": "1997/10/10", "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	借助 substrBytes 可以提取 birthday 中的年、月、日信息，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    year: $.substrBytes(['$birthday', 0, 4]),
	    month: $.substrBytes(['$birthday', 5, 2]),
	    day: $.substrBytes(['$birthday', 8, -1])
	  })
	  .end()
	返回的结果如下：
	{ "day": "12", "month": "12", "year": "1999" }
	{ "day": "11", "month": "11", "year": "1998" }
	{ "day": "10", "month": "10", "year": "1997" }
	</code>
	</pre>
</details>

#### 12.substrCP
聚合操作符。返回字符串从指定位置开始的指定长度的子字符串。子字符串是由字符串中指定的 UTF-8 字节索引的字符开始，长度为指定的字节数。

```
db.command.aggregate.substrCP([<表达式1>, <表达式2>, <表达式3>])
```

`表达式1` 是任何可以解析为字符串的有效表达式，`表达式2` 和 `表达式3` 是任何可以解析为数字的有效表达式。

如果 `表达式2` 是负数，返回的结果为 ""。

如果 `表达式3` 是负数，返回的结果为从 `表达式2` 指定的开始位置以及之后其余部分的子字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	假设集合 students 的记录如下：
	{ "name": "dongyuanxin", "nickname": "心谭" }
	借助 substrCP 可以提取 nickname 字段值的第一个汉字：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    firstCh: $.substrCP(['$nickname', 0, 1])
	  })
	  .end()
	返回的结果如下：
	{ "firstCh": "心" }
	</code>
	</pre>
</details>

#### 13.toLower
聚合操作符。将字符串转化为小写并返回。


```
db.command.aggregate.toLower(表达式)
```
只要表达式可以被解析成字符串，那么它就是有效表达式。例如：$ + 指定字段。


>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	//借助 toLower 将 firstName 的字段值转化为小写：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    result: $.toLower('$firstName'),
	  })
	  .end()
	//返回的结果如下：
	{ "result": "yuanxin" }
	{ "result": "weijia" }
	{ "result": "chengxi" }
	</code>
	</pre>
</details>

#### 14.toUpper
聚合操作符。将字符串转化为大写并返回。

```
db.command.aggregate.toUpper(表达式)
```
只要表达式可以被解析成字符串，那么它就是有效表达式。例如：$ + 指定字段。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "firstName": "Yuanxin", "group": "a", "lastName": "Dong", "score": 84 }
	{ "firstName": "Weijia", "group": "a", "lastName": "Wang", "score": 96 }
	{ "firstName": "Chengxi", "group": "b", "lastName": "Li", "score": 80 }
	//借助 toUpper 将 lastName 的字段值转化为大写：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .project({
	    _id: 0,
	    result: $.toUpper('$lastName'),
	  })
	  .end()
	//返回的结果如下：
	{ "result": "DONG" }
	{ "result": "WANG" }
	{ "result": "LI" }
	</code>
	</pre>
</details>




[objectToArray]:https://uniapp.dcloud.net.cn/uniCloud/cf-database?id=objecttoarray
[dateFromString]:https://uniapp.dcloud.net.cn/uniCloud/cf-database?id=datefromstring
[dateToString]:https://uniapp.dcloud.net.cn/uniCloud/cf-database?id=datetostring


### 十一、累计器操作符

|   名称	|    说明		|
|------|------|
|  addToSet	| 	聚合操作符。聚合运算符。向数组中添加值，如果数组中已存在该值，不执行任何操作。它只能在 group stage 中使用。  |
|  avg	| 	聚合操作符。返回一组集合中，指定字段对应数据的平均值。   |
|  first | 	聚合操作符。返回指定字段在一组集合的第一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义.  |
|  last | 	聚合操作符。返回指定字段在一组集合的最后一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义。  |
|  max | 	聚合操作符。返回一组数值的最大值。 |
|  mergeObjects | 	见[mergeObjects][mergeObjects]  |
|  min | 	聚合操作符。返回一组数值的最小值。 |
|  push | 	聚合操作符。在 group 阶段，返回一组中表达式指定列与对应的值，一起组成的数组 |
|  stdDevPop | 	聚合操作符。返回一组字段对应值的标准差。 |
|  stdDevSamp | 聚合操作符。计算输入值的样本标准偏差。如果输入值代表数据总体，或者不概括更多的数据，请改用 db.command.aggregate.stdDevPop。 |
|  sum | 聚合操作符。计算并且返回一组字段所有数值的总和。 |

#### 1.addToSet
聚合操作符。聚合运算符。向数组中添加值，如果数组中已存在该值，不执行任何操作。它只能在 group stage 中使用。

```
db.command.aggregate.addToSet(<表达式>)
```
表达式是形如 `$ + 指定字段` 的字符串。如果指定字段的值是数组，那么整个数组会被当作一个元素。


>示例代码
<details>
<summary style="font-weight:bold">示例 1：非数组字段</summary>
<pre>
	<code>
	//假设集合 passages 的记录如下：
	{ "category": "web", "tags": [ "JavaScript", "CSS" ], "title": "title1" }
	{ "category": "System", "tags": [ "C++", "C" ], "title": "title2" }
	非数组字段
	//每条记录的 category 对应值的类型是非数组，利用 addToSet 统计所有分类：
	const $ = db.command.aggregate
	let res = await db
	  .collection('passages')
	  .aggregate()
	  .group({
	    _id: null,
	    categories: $.addToSet('$category')
	  })
	  .end()
	//返回的结果如下：
	{ "_id": null, "categories": [ "System", "web" ] }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 1：数组字段</summary>
<pre>
	<code>
	//每条记录的 tags 对应值的类型是数组，数组不会被自动展开：
	const $ = db.command.aggregate
	let res = await db
	  .collection('passages')
	  .aggregate()
	  .group({
	    _id: null,
	    tagsList: $.addToSet('$tags')
	  })
	  .end()
	//返回的结果如下：
	{ "_id": null, "tagsList": [ [ "C++", "C" ], [ "JavaScript", "CSS" ] ] }
	</code>
	</pre>
</details>

#### 2.avg
聚合操作符。返回一组集合中，指定字段对应数据的平均值。

```
db.command.aggregate.avg(<number>)
```
`avg` 传入的值除了数字常量外，也可以是任何最终解析成一个数字的表达式。它会忽略非数字值。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：非数组字段</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//借助 avg 可以计算所有记录的 score 的平均值：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .group({
	    _id: null,
	    average: $.avg('$score')
	  })
	  .end()
	//返回的结果如下：
	{ "_id": null, "average": 90 }
	</code>
	</pre>
</details>

#### 3.first
聚合操作符。返回指定字段在一组集合的第一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义。

```
db.command.aggregate.first(<表达式>)
```
表达式是形如 `$ + 指定字段` 的字符串。

`first` 只能在 `group` 阶段被使用，并且需要配合 `sort` 才有意义。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//如果需要得到所有记录中 score 的最小值，可以先将所有记录按照 score 排序，然后取出第一条记录的 first。
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .sort({
	    score: 1
	  })
	  .group({
	    _id: null,
	    min: $.first('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": null, "min": 80 }
	</code>
	</pre>
</details>

#### 4.last
聚合操作符。返回指定字段在一组集合的最后一条记录对应的值。仅当这组集合是按照某种定义排序（ sort ）后，此操作才有意义。

```
db.command.aggregate.last(<表达式>)
```
表达式是形如 `$ + 指定字段` 的字符串。

`last` 只能在 `group` 阶段被使用，并且需要配合 `sort` 才有意义。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//如果需要得到所有记录中 score 的最大值，可以先将所有记录按照 score 排序，然后取出最后一条记录的 last。
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .sort({
	    score: 1
	  })
	  .group({
	    _id: null,
	    max: $.last('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": null, "max": 100 }
	</code>
	</pre>
</details>

#### 5.max
聚合操作符。返回一组数值的最大值。

```
db.command.aggregate.max(<表达式>)
```
表达式是形如 `$ + 指定字段` 的字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//借助 max 可以统计不同组（ group ）中成绩的最高值，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .group({
	    _id: '$group',
	    maxScore: $.max('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": "b", "maxScore": 100 }
	{ "_id": "a", "maxScore": 96 }
	...
	</code>
	</pre>
</details>

#### 6.mergeObjects
见[mergeObjects][mergeObjects]

[mergeObjects]:https://uniapp.dcloud.net.cn/uniCloud/cf-database?id=mergeobjects

#### 7.min
聚合操作符。返回一组数值的最小值。

```
db.command.aggregate.min(<表达式>)
```
表达式是形如 `$ + 指定字段` 的字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//借助 min 可以统计不同组（ group ）中成绩的最低值，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .group({
	    _id: '$group',
	    minScore: $.min('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": "b", "minScore": 80 }
	{ "_id": "a", "minScore": 84 }
	</code>
	</pre>
</details>

#### 8.push
聚合操作符。在 `group` 阶段，返回一组中表达式指定列与对应的值，一起组成的数组。

```
db.command.aggregate.push({
  <字段名1>: <指定字段1>,
  <字段名2>: <指定字段2>,
  ...
})
```
表达式是形如 `$ + 指定字段` 的字符串。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "group": "a", "name": "stu1", "score": 84 }
	{ "group": "a", "name": "stu2", "score": 96 }
	{ "group": "b", "name": "stu3", "score": 80 }
	{ "group": "b", "name": "stu4", "score": 100 }
	//借助 push 操作，对不同分组( group )的所有记录，聚合所有数据并且将其放入一个新的字段中，进一步结构化和语义化数据。
	const $ = db.command.aggregate
	let res = await db
	  .collection('students')
	  .aggregate()
	  .group({
	    _id: '$group',
	    students: $.push({
	      name: '$name',
	      score: '$score'
	    })
	  })
	  .end()
	//输出结果如下：
	{ "_id": "b", "students": [{ "name": "stu3", "score": 80 }, { "name": "stu4", "score": 100 }] }
	{ "_id": "a", "students": [{ "name": "stu1", "score": 84 }, { "name": "stu2", "score": 96 }] }
	</code>
	</pre>
</details>

#### 9.stdDevPop
聚合操作符。返回一组字段对应值的标准差。

```
db.command.aggregate.stdDevPop(<表达式>)
```
表达式传入的是指定字段，指定字段对应的值的数据类型必须是 `number` ，否则结果会返回 `null`。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：a 组同学的成绩分别是84和96，b组同学的成绩分别是80和100。
	{ "group":"a", "score":84 }
	{ "group":"a", "score":96 }
	{ "group":"b", "score":80 }
	{ "group":"b", "score":100 }
	//可以用 stdDevPop 来分别计算 a 和 b 两组同学成绩的标准差，以此来比较哪一组同学的成绩更稳定。代码如下：
	const $ = db.command.aggregate
	let res = await db.collection('students').aggregate()
	  .group({
	    _id: '$group',
	    stdDev: $.stdDevPop('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": "b", "stdDev": 10 }
	{ "_id": "a", "stdDev": 6 }
	</code>
	</pre>
</details>

#### 10.stdDevSamp
聚合操作符。计算输入值的样本标准偏差。如果输入值代表数据总体，或者不概括更多的数据，请改用 `db.command.aggregate.stdDevPop`。

```
db.command.aggregate.stdDevSamp(<表达式>)
```
表达式传入的是指定字段，`stdDevSamp` 会自动忽略非数字值。如果指定字段所有的值均是非数字，那么结果返回 `null`。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设集合 students 的记录如下：
	{ "score": 80 }
	{ "score": 100 }
	//可以用 stdDevSamp 来计算成绩的标准样本偏差。代码如下：
	const $ = db.command.aggregate
	let res = await db.collection('students').aggregate()
	  .group({
	    _id: null,
	    ageStdDev: $.stdDevSamp('$score')
	  })
	  .end()
	//返回的数据结果如下：
	{ "_id": null, "ageStdDev": 14.142135623730951 }
	//如果向集合 students 添加一条新记录，它的 score 字段类型是 string：
	{ "score": "aa" }
	//用上面代码计算标准样本偏差时，stdDevSamp 会自动忽略类型不为 number 的记录，返回结果保持不变。
	</code>
	</pre>
</details>

#### 11.sum
聚合操作符。计算并且返回一组字段所有数值的总和。

```
db.command.aggregate.sum(<表达式>)
```
表达式可以传入指定字段，也可以传入指定字段组成的列表。sum 会自动忽略非数字值。如果字段下的所有值均是非数字，那么结果返回 0。若传入数字常量，则当做所有记录该字段的值都给给定常量，在聚合时相加，最终值为输入记录数乘以常量。

>示例代码
<details>
<summary style="font-weight:bold">示例 1：单独字段</summary>
<pre>
	<code>
	//假设代表商品的集合 goods 的记录如下：price 代表商品销售额，cost 代表商品成本
	{ "cost": -10, "price": 100 }
	{ "cost": -15, "price": 1 }
	{ "cost": -10, "price": 10 }
	//单独字段
	借助 sum 可以计算所有商品的销售总和，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('goods')
	  .aggregate()
	  .group({
	    _id: null,
	    totalPrice: $.sum('$price')
	  })
	  .end()
	//返回的数据结果如下：销售额是 111
	{ "_id": null, "totalPrice": 111 }
	</code>
	</pre>
</details>

<details>
<summary style="font-weight:bold">示例 2：字段列表</summary>
<pre>
	<code>
	//如果需要计算所有商品的利润总额，那么需要将每条记录的 cost 和 price 相加得到此记录对应商品的利润。最后再计算所有商品的利润总额。
	//借助 sum，代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('goods')
	  .aggregate()
	  .group({
	    _id: null,
	    totalProfit: $.sum(
	      $.sum(['$price', '$cost'])
	    )
	  })
	  .end()
	//返回的数据结果如下：利润总额为 76
	{ "_id": null, "totalProfit": 76 }
	</code>
	</pre>
</details>

### 十二、变量操作符
#### 1.let
聚合操作符。自定义变量，并且在指定表达式中使用，返回的结果是表达式的结果。

`let` 的语法如下：
```
db.command.aggregate.let({
  vars: {
    <变量1>: <变量表达式>,
    <变量2>: <变量表达式>,
    ...
  },
  in: <结果表达式>
}
```

`vars` 中可以定义多个变量，变量的值由 `变量表达式` 计算而来，并且被定义的变量只有在 `in` 中的 `结果表达式` 才可以访问。

在 `in` 的结果表达式中访问自定义变量时候，请在变量名前加上双美元符号( `$$` )并用引号括起来。

>示例代码
<details>
<summary style="font-weight:bold">示例 1</summary>
<pre>
	<code>
	//假设代表商品的集合 goods 的记录如下：price 代表商品价格，discount 代表商品折扣率，cost 代表商品成本
	{ "cost": -10, "discount": 0.95, "price": 100 }
	{ "cost": -15, "discount": 0.98, "price": 1 }
	{ "cost": -10, "discount": 1, "price": 10 }
	//借助 let 可以定义并计算每件商品实际的销售价格，并将其赋值给自定义变量 priceTotal。最后再将 priceTotal 与 cost 进行取和( sum )运算，得到每件商品的利润。
	//代码如下：
	const $ = db.command.aggregate
	let res = await db
	  .collection('goods')
	  .aggregate()
	  .project({
	    profit: $.let({
	      vars: {
	        priceTotal: $.multiply(['$price', '$discount'])
	      },
	      in: $.sum(['$$priceTotal', '$cost'])
	    })
	  })
	  .end()
	//返回的数据结果如下：
	{ "profit": 85 }
	{ "profit": -14.02 }
	{ "profit": 0 }
	</code>
	</pre>
</details>
