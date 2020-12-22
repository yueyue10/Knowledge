# 聚合操作

获取数据库集合的聚合操作实例
```db.collection('scores').aggregate()```

| 类型 | 方法		|说明								|
| ------ |------|------|
|  聚合操作 | 	| 	|
|   | [addFields][aggregate_method1]	| 聚合阶段。添加新字段到输出的记录。	|
|   | [bucket][aggregate_method1]	| 聚合阶段。将输入记录根据给定的条件和边界划分成不同的组，每组即一个 bucket。	|
|   | [bucketAuto][aggregate_method1]| 聚合阶段。将输入记录根据给定的条件划分成不同的组，每组即一个 bucket。	|
|   | [count][aggregate_method1]     | 聚合阶段。计算上一聚合阶段输入到本阶段的记录数，输出一个记录，其中指定字段的值为记录数。	|
|   | [geoNear][aggregate_method1]  | 聚合阶段。将记录按照离给定点从近到远输出。	|
|   | [group][aggregate_method1]  | 聚合阶段。将输入记录按给定表达式分组，输出时每个记录代表一个分组，每个记录的 _id 是区分不同组的 key	|
|   | [limit][aggregate_method2]  | 聚合阶段。限制输出到下一阶段的记录数。	|
|   | [lookup][aggregate_method2]  | 聚合阶段。联表查询	|
|   | [match] [aggregate_method3] | 聚合阶段。根据条件过滤文档，并且把符合条件的文档传递给下一个流水线阶段。	|
|   | [project][aggregate_method3]  | 聚合阶段。把指定的字段传递给下一个流水线，指定的字段可以是某个已经存在的字段，也可以是计算出来的新字段。	|
|   | [replaceRoot][aggregate_method3]  | 聚合阶段。指定一个已有字段作为输出的根节点，也可以指定一个计算出的新字段作为根节点。	|
|   | [sample][aggregate_method3]  | 聚合阶段。随机从文档中选取指定数量的记录。	|
|   | [skip][aggregate_method3]  | 聚合阶段。指定一个正整数，跳过对应数量的文档，输出剩下的文档。	|
|   | [sort][aggregate_method3]  | 聚合阶段。根据指定的字段，对输入的文档进行排序。	|
|   | [sortByCount][aggregate_method3]  | 聚合阶段。根据传入的表达式，将传入的集合进行分组（group）。然后计算不同组的数量，并且将这些组按照它们的数量进行排序，返回排序后的结果。	|
|   | [unwind][aggregate_method3]  | 聚合阶段。使用指定的数组字段中的每个元素，对文档进行拆分。拆分后，文档会从一个变为一个或多个，分别对应数组的每个元素。	|
|   | [end][aggregate_method3]  | 标志聚合操作定义完成，发起实际聚合操作	|
|  聚合操作符 | [db.command.aggregate][command_aggregate]  | 	|


[aggregate_method1]:聚合操作1.md
[aggregate_method2]:聚合操作2.md
[aggregate_method3]:聚合操作3.md
[aggregate_method3]:聚合操作3.md
[command_aggregate]:聚合操作4-聚合操作符0.md
