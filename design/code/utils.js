/* 计算合理性-此方法只针对单个元素操作
 * widgetList:画布中已经放置的组件
 * widget:操作的组件
 * canvasInfo:画布信息
 * leftr:向左移动距离-如果是新增,此参数可以不填
 * topr:向右移动距离-同上
 */
let computeDownSuitable = function (widgetList, widget, canvasInfo, leftr = 0, topr = 0) {
    let widgetCache = {left: widget.left + leftr, top: widget.top + topr, width: widget.width, height: widget.height}
    console.log(widgetCache)
    let suit = true;
    //判断是否有[widgetId]属性,可以确定是新增还是修改;如果是修改,则过滤掉已经实例化的widget
    if (widget.widgetId) widgetList = widgetList.filter(wid => {
        return wid.widgetId != widget.widgetId
    })
    //遍历画布中的所有组件,和目标组件进行检测;检测方法参考:https://www.cnblogs.com/programnote/p/4691608.html
    widgetList.forEach((it, idx) => {
        let p1 = {x: it.left, y: it.top}
        let p2 = {x: it.left + it.width, y: it.top + it.height}
        let p3 = {x: widgetCache.left, y: widgetCache.top}
        let p4 = {x: widgetCache.left + widgetCache.width, y: widgetCache.top + widgetCache.height}
        // debugger
        let s1 = p2.y < p3.y - 5
        let s2 = p1.y > p4.y + 5
        let s3 = p2.x < p3.x - 5
        let s4 = p1.x > p4.x + 5
        let ySuit = (s1 || s2 || s3 || s4)
        // console.log("computeSuitable", idx, ySuit, p1, p2, p3, p4, s1, s2, s3, s4)
        if (!ySuit) {
            suit = false
            this.errorHintView.innerText = `和${idx + 1}条冲突`
        }
    })
    if (widgetCache.left < 3 || widgetCache.left > canvasInfo.width - 23 || widgetCache.top < 3 || widgetCache.top > canvasInfo.height - 23) {
        suit = false
        this.errorHintView.innerText = "超出边界！"
    }
    return suit
}
