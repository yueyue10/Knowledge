//检查两个长方形是否有重叠部分参考：https://www.cnblogs.com/programnote/p/4691608.html

/* 计算合理性
 * selWidgets:选中的组件数组 [{startPoint,endPoint}]
 * processType:操作类型 add，move，copy
 * actionPoints:事件的坐标点数组
 */
let computeDownSuitable = function (selWidgets, processType, actionPoints) {
    //actionType:事件类型 鼠标点击类型:point、框选类型:section
    let actionType = actionPoints.length > 1 ? 'section' : 'point'
    if (processType == "add" && actionType == "point") {//添加只有一个组件类型，selWidgets里面只有一个
        if (selWidgets.length != 1) throw new Error('内部异常')
        let selPoint = selWidgets[0] //选中的点
        this.widgets.forEach(wid => {
            let p1 = wid.startPoint
            let p2 = wid.endPoint
            let p3 = selPoint.startPoint
            let p4 = selPoint.endPoint
            if (p1.y < p3.y || p1.y > p4.y || p2.x < p3.x || p1.x > p4.x) {

            }
        })
    } else if (processType == "add" && actionType == "select") {

    }
}

//加
export function floatAdd(arg1, arg2) {
    var r1, r2, m;
    try {
        r1 = arg1.toString().split(".")[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg2.toString().split(".")[1].length
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
}

//减
export function floatSub(arg1, arg2) {
    var r1, r2, m, n;
    try {
        r1 = arg1.toString().split(".")[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg2.toString().split(".")[1].length
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2));
    //动态控制精度长度
    n = (r1 >= r2) ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
}

//乘
export function floatMul(arg1, arg2) {
    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length
    } catch (e) {
    }
    try {
        m += s2.split(".")[1].length
    } catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}


//除
export function floatDiv(arg1, arg2) {
    var t1 = 0, t2 = 0, r1, r2;
    try {
        t1 = arg1.toString().split(".")[1].length
    } catch (e) {
    }
    try {
        t2 = arg2.toString().split(".")[1].length
    } catch (e) {
    }

    r1 = Number(arg1.toString().replace(".", ""));

    r2 = Number(arg2.toString().replace(".", ""));
    return (r1 / r2) * Math.pow(10, t2 - t1);
}
