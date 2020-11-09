## 列表到详情接口

### 列表
https://unidemo.dcloud.net.cn/api/news
- 返回数据格式
- post_id 新闻id 如 ： 72980
- title 标题
- created_at 创建时间
- author_avatar 图标

### 详情

地址：https://unidemo.dcloud.net.cn/api/news/36kr/ + id（id为新闻id，上个页面传过来的）

使用 rich-text 【富文本组件】来展示新闻内容
<rich-text class="richText" :nodes="strings"></rich-text>
