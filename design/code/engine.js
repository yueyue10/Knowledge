import {Rect, SelectArea} from "./utils.js"
//座椅配置
let rectConf = {
    col: 25,
    row: 15,
    divide: 5,
    width: 20
}
//画布配置
let mapConf = {
    map: {
        width: 6 * 2 + 30 * rectConf.col,
        height: 6 * 2 + 30 * rectConf.row,
        padding: 5,
    },
    viewIds: {
        canvas: 'seat_canvas',
        seatView: 'unselect_seat_span',
        mapStatusView: "map_status",
        errorHintView: "error_hint",
        resetZoomView: "reset_zoom_btn",
        translateView: "set_translate_btn",
        contextMenuView: "context-menu",
        autoAddView: "auto_add_btn",
        contextCopy: "#context-menu>#copy",
        contextDelete: "#context-menu>#delete",
        contextPaste: "#context-menu>#paste",
        modifyRectConf: "modify_rect_conf",
        rectColConSpan: "rect-col-span",
        rectRowConSpan: "rect-row-span",
    }
}

function getViewById(view_id) {
    return document.getElementById(mapConf.viewIds[view_id])
}

function getViewByTag(tag_id) {
    return document.querySelector(mapConf.viewIds[tag_id]);
}

export class SeatMap {

    constructor() {
        this.mapStatus = 2;//1:新增 2:编辑 3:平移
        this.zoomValue = 1;
        this.scaleValue = 1
        this.renderList = []
        this.contextPos = null
        this.initCanvasView()
        this.initDisplayView()
        this.addSpanEvent()
        this.addMapEvent()
    }


    initCanvasView() {
        this.canvas = getViewById('canvas')
        this.canvas.width = mapConf.map.width
        this.canvas.height = mapConf.map.height
        this.ctx = this.canvas.getContext('2d')
        this.canvasInfo = this.canvas.getBoundingClientRect()
    }

    initDisplayView() {
        this.seatView = getViewById('seatView');
        this.mapStatusView = getViewById('mapStatusView');
        this.errorHintView = getViewById('errorHintView');
        this.resetZoomView = getViewById('resetZoomView');
        this.translateView = getViewById('translateView');
        this.contextMenuView = getViewById('contextMenuView');
        this.autoAddView = getViewById('autoAddView');
        this.modifyRectConf = getViewById('modifyRectConf');
        this.rectColConSpan = getViewById('rectColConSpan');
        this.rectRowConSpan = getViewById('rectRowConSpan');
        this.contextCopy = getViewByTag('contextCopy');
        this.contextPaste = getViewByTag('contextPaste');
        this.contextDelete = getViewByTag('contextDelete');
        this.seatText = this.seatView.textContent;
    }

    addRect(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        if (this.computeSuitable({target}))
            this.renderList.push(target)
        return this
    }

    addRectInner(x, y) {
        let width = rectConf.width
        let target = new Rect(this.ctx, {left: x, top: y, width: width, height: width}, this.seatText)
        let suit = this.computeSuitable({target})
        if (suit) this.renderList.push(target)
        this.painting()
        return suit
    }

    //框选逻辑：1.判断框是否为空：为空创建框；不为空就修改框。2.对renderList遍历，判断组件在框内就设置选中，并设置相对框的坐标。
    selectArea(area, areaCon) {
        if (area == null) area = new SelectArea(this.ctx, areaCon), this.renderList.push(area)
        else area.adjust(areaCon.x2, areaCon.y2)
        let rectList = this.renderList.filter(ren => {
            return ren.constructor.name != "SelectArea"
        })
        rectList.forEach(rect => {
            //p1,p2:框的左上角和右下角。p3,p4:rect组件的左上角和右下角。
            let p1, p2, p3 = {x: rect.left, y: rect.top}, p4 = {x: rect.left + rect.width, y: rect.top + rect.height}
            if (area.x1 < area.x2 && area.y1 < area.y2)//向右下角划动
                p1 = {x: area.x1, y: area.y1}, p2 = {x: area.x2, y: area.y2}
            if (area.x1 < area.x2 && area.y1 > area.y2)//向右上角划动
                p1 = {x: area.x1, y: area.y2}, p2 = {x: area.x2, y: area.y1}
            if (area.x1 > area.x2 && area.y1 > area.y2)//向左上角划动
                p1 = {x: area.x2, y: area.y2}, p2 = {x: area.x1, y: area.y1}
            if (area.x1 > area.x2 && area.y1 < area.y2)//向左下角划动
                p1 = {x: area.x2, y: area.y1}, p2 = {x: area.x1, y: area.y2}
            let areaObj = p1 && p2 //刚开始时p1,p2不存在，下面会报错
            if (areaObj && p3.x > p1.x && p3.y > p1.y && p4.x < p2.x && p4.y < p2.y)//rect组件的p3和p4点都在p1和p2组成的矩形内
                rect.setSelected(true), rect.setAreaSp(p1)
            else
                rect.setSelected(false)
        })
        this.painting()
        return area
    }

    /**
     * 判断合理性
     * @param target 要添加的控件
     * @param leftOff 向左偏移量
     * @param topOff 向有偏移量
     */
    computeSuitable({target = null, leftOff = 0, topOff = 0}) {
        this.errorHintView.innerText = ""
        //1.tgRects:要操作的组件数组
        //1.rectTg:操作组件组成的目标控件块
        //1.suit:默认是合适，只有一个有冲突就是不合适
        //1.filRenders:画布中没有被选中的组件数组
        let rectTg, suit = true, filRenders,
            tgRects = this.renderList.filter(ren => {
                return ren.selected
            })
        console.log("tgRects", tgRects)
        if (target) {//添加元素
            rectTg = {left: target.left + leftOff, top: target.top + topOff, width: target.width, height: target.height}
        } else if (tgRects.length == 1) {//移动单个元素
            target = tgRects[0]
            rectTg = {left: target.left + leftOff, top: target.top + topOff, width: target.width, height: target.height}
        } else {//移动多个元素
            let xArr = [], yArr = [], xMax, xMin, yMax, yMin
            tgRects.forEach(ren => {
                xArr.push(ren.left)
                yArr.push(ren.top)
            })
            xMax = Math.max(...xArr), xMin = Math.min(...xArr), yMax = Math.max(...yArr), yMin = Math.min(...yArr)
            console.log("max-min", xMax, xMin, yMax, yMin)
            rectTg = {
                left: xMin + leftOff,
                top: yMin + topOff,
                width: xMax - xMin + rectConf.width,
                height: yMax - yMin + rectConf.width
            }
        }
        //2.过滤目标控件(考虑移动情况)
        filRenders = this.renderList.filter(ren => {
            return ren.rectId && !ren.selected
        })
        //3.遍历画布中的组件数组和目标控件是否冲突
        filRenders.forEach((it, idx) => {
            let p1 = {x: it.left, y: it.top}
            let p2 = {x: it.left + it.width, y: it.top + it.height}
            let p3 = {x: rectTg.left, y: rectTg.top}
            let p4 = {x: rectTg.left + rectTg.width, y: rectTg.top + rectTg.height}
            let s1 = p2.y < p3.y - rectConf.divide
            let s2 = p1.y > p4.y + rectConf.divide
            let s3 = p2.x < p3.x - rectConf.divide
            let s4 = p1.x > p4.x + rectConf.divide
            let ySuit = (s1 || s2 || s3 || s4)
            // console.log("computeSuitable", idx, ySuit, p1, p2, p3, p4, s1, s2, s3, s4)
            if (!ySuit) suit = false, this.errorHintView.innerText = `和${it.rectId}冲突`
        })
        let leftSize = mapConf.map.padding + 3;
        let rightSize = mapConf.map.padding + 3 + rectTg.width;
        let mapWidth = this.canvasInfo.width
        let mapHeight = this.canvasInfo.height
        //4.判断目标控件和边界是否冲突 todo 这里还待优化
        if (rectTg.left < leftSize || rectTg.left > mapWidth - rightSize || rectTg.top < leftSize || rectTg.top > mapHeight - rightSize) {
            suit = false, this.errorHintView.innerText = "超出边界！"
        }
        return suit
    }

    drawBorder() {
        // console.log("drawBorder", this.zoomValue)
        let padding = mapConf.map.padding
        this.ctx.strokeRect(padding, padding, (this.canvasInfo.width - 2 * padding - 2) * this.scaleValue, (this.canvasInfo.height - 2 * padding - 2) * this.scaleValue)
        let margin = mapConf.map.padding + 2
        let rectWidth = rectConf.width + rectConf.divide * 2
        for (let i = 1; i <= (this.canvasInfo.width - margin * 2) / rectWidth; i++) {
            this.ctx.beginPath()
            this.ctx.lineWidth = 0.3
            this.ctx.moveTo(rectWidth * i + margin, margin)
            this.ctx.lineTo(margin + i * rectWidth, this.canvasInfo.height - margin)
            this.ctx.strokeStyle = "#0000ff"
            this.ctx.stroke()
            this.ctx.closePath()
        }
        for (let i = 1; i <= (this.canvasInfo.height - margin * 2) / rectWidth; i++) {
            this.ctx.beginPath()
            this.ctx.lineWidth = 0.3
            this.ctx.moveTo(margin, rectWidth * i + margin)
            this.ctx.lineTo(this.canvasInfo.width - margin, rectWidth * i + margin)
            this.ctx.strokeStyle = "#0000ff"
            this.ctx.stroke()
            this.ctx.closePath()
        }
    }

    autoAddRect() {
        this.painting()
        let col = 0, row = 0, rectMargin = mapConf.map.padding + 2 + 5
        let timer = setInterval(() => {
            let suit = this.addRectInner(rectMargin + col * 30, rectMargin + row * 30)
            if (col < rectConf.col - 1) col++
            else col = 0, row++
            if (row == rectConf.row || !suit) clearInterval(timer), this.mapStatus = 2, this.mapStatusView.innerHTML = "编辑状态"
        }, 0)
    }

    zoomMap(type) {
        let zoom = {'0': 1, '-1': 0.99, '1': 1.01}
        this.scaleValue = type == '0' ? 1 / this.zoomValue : zoom[type]
        this.zoomValue = type == '0' ? 1 : zoom[type] * this.zoomValue
        this.ctx.scale(this.scaleValue, this.scaleValue);
        this.painting()
    }

    translateMap(xScroll, yScroll) {
        this.ctx.translate(xScroll, yScroll)
        this.painting()
    }

    painting() {
        // console.log("数据长度：", this.renderList.length)
        this.ctx.clearRect(0, 0, this.canvasInfo.width, this.canvasInfo.height)
        this.drawBorder()
        this.renderList.forEach((it, index) => it.painting(index + 1))
    }

    updateMapStatus(status) {
        this.mapStatus = status
        this.seatView.style.color = this.mapStatus == 1 ? "red" : "#838388";
        this.mapStatusView.style.color = this.mapStatus == 1 ? "red" : "blue";
        this.mapStatusView.innerHTML = this.mapStatus == 1 ? "添加状态" : "编辑状态";
        if (this.mapStatus == 2) this.errorHintView.innerText = ""
    }

    addSpanEvent() {
        this.seatView.addEventListener("click", () => {
            this.updateMapStatus(this.mapStatus == 1 ? 2 : 1)
        })
        this.resetZoomView.addEventListener("click", () => {
            this.zoomMap("0")
            this.resetZoomView.disabled = true
        })
        this.translateView.addEventListener("click", () => {
            this.mapStatus = this.mapStatus != 3 ? 3 : 2;
            this.translateView.className = this.mapStatus == 3 ? "select-view" : ""
            this.mapStatusView.innerText = this.mapStatus == 3 ? "平移状态" : "编辑状态"
        })
        this.autoAddView.addEventListener("click", () => {
            this.mapStatus = 1
            this.autoAddView.disabled = true
            this.mapStatusView.innerHTML = "添加状态"
            this.autoAddRect()
        })
        this.modifyRectConf.addEventListener("click", () => {
            rectConf.col = parseInt(this.rectColConSpan.value)
            rectConf.row = parseInt(this.rectRowConSpan.value)
            mapConf.map.width = 6 * 2 + 30 * rectConf.col
            mapConf.map.height = 6 * 2 + 30 * rectConf.row
            this.canvas.width = mapConf.map.width
            this.canvas.height = mapConf.map.height
            this.canvasInfo = this.canvas.getBoundingClientRect()
            this.autoAddView.disabled = false
            this.renderList = []
            this.painting()
        })
    }

    addMapEvent() {
        /**
         * clickEp：点击空白区域次数
         * transDn：平移状态点击次数
         */
        let startX, startY, target, clickEp, transDn, area, that = this

        //鼠标落下事件
        let mouseDown = e => {
            // debugger
            if (e.button == 2) {//鼠标右击事件
                return
            }
            startX = e.offsetX, startY = e.offsetY
            if (this.mapStatus == 1) {//如果是添加状态
                let halfWidth = rectConf.width / 2
                this.addRectInner(startX - halfWidth, startY - halfWidth)
            } else if (this.mapStatus == 2) {
                if (target != null) {//如果有的话，就反选
                    updateSelRect({}, false)
                } else if (area != null) {
                    if (clickEp == 1) clickEp = 2
                    else if (clickEp == 2) {
                        if (area.isPointIn(startX, startY)) clickEp = 3
                        else deleteArea(this.renderList), resetCopy()
                    } else if (clickEp == 3) {
                        clickEp = 2
                    }
                } else {
                    getDownRect(this.renderList, startX, startY)
                    clickEp = target ? 0 : 1//如果点击区域没有元素，就设置点击次数为1
                }
            } else if (this.mapStatus == 3) {
                transDn = 1
            }
        }
        /**
         * 鼠标移动事件
         */
        let mouseMove = e => {
            // debugger
            const currentX = e.offsetX, currentY = e.offsetY
            if (this.mapStatus == 1)
                return
            if (this.mapStatus == 2)
                if (target != null) {
                    if (this.computeSuitable({leftOff: currentX - startX, topOff: currentY - startY})) {
                        updateSelRect({x: currentX - startX, y: currentY - startY})
                        startX = currentX, startY = currentY
                    }
                } else if (clickEp == 1) {
                    area = this.selectArea(area, {x1: startX, y1: startY, x2: currentX, y2: currentY})
                } else if (clickEp == 3 && area != null) {
                    if (this.computeSuitable({leftOff: currentX - startX, topOff: currentY - startY})) {
                        updateAreaRect({left: currentX - startX, top: currentY - startY})
                        startX = currentX, startY = currentY
                    }
                }
            if (this.mapStatus == 3 && transDn == 1) {//只有拖动的时候才移动
                this.translateMap(currentX - startX, currentY - startY)
                startX = currentX, startY = currentY
            }
        }
        /*
         * 鼠标放开监听
         */
        let mouseUp = e => {
            const currentX = e.offsetX, currentY = e.offsetY
            this.errorHintView.innerText = ""
            transDn = 0
        }
        /**
         * 鼠标滚轮监听
         */
        let mouseWheel = event => {
            console.log("mousewheel", event.wheelDelta)
            let delta = event.wheelDelta ? (event.wheelDelta / 120) : (-event.detail / 3);
            this.zoomMap(delta > 0 ? "1" : "-1")
            this.resetZoomView.disabled = false
        }
        /**
         * 键盘输入监听
         */
        let keyInput = e => {
            let ev = window.event || e;
            console.log(['keydown', ev.keyCode]);
            switch (ev.keyCode) {
                case 13://enter
                    if (target) updateSelRect({}, false)
                    if (area) updateAreaRect({}, true)
                    break;
                case 17://ctrl
                    break;
                case 27://esc
                    that.updateMapStatus(2)
                    if (target) updateSelRect({}, false)
                    if (area) updateAreaRect({}, true)
                    break
                case 37://left
                    if (target && this.computeSuitable({target, leftOff: -2, topOff: 0})) updateSelRect({x: -2, y: 0})
                    if (area && this.computeSuitable({leftOff: -2, topOff: 0})) updateAreaRect({left: -2, top: 0})
                    break;
                case 38://up
                    if (target && this.computeSuitable({target, leftOff: 0, topOff: -2})) updateSelRect({x: 0, y: -2})
                    if (area && this.computeSuitable({leftOff: 0, topOff: -2})) updateAreaRect({left: 0, top: -2})
                    break;
                case 39://right
                    if (target && this.computeSuitable({target, leftOff: 2, topOff: 0})) updateSelRect({x: 2, y: 0})
                    if (area && this.computeSuitable({leftOff: 2, topOff: 0})) updateAreaRect({left: 2, top: 0})
                    break;
                case 40://down
                    if (target && this.computeSuitable({target, leftOff: 0, topOff: 2})) updateSelRect({x: 0, y: 2})
                    if (area && this.computeSuitable({leftOff: 0, topOff: 2})) updateAreaRect({left: 0, top: 2})
                    break;
                case 46://delete
                    if (target) deleteRects(this.renderList)
                    if (area) deleteRects(this.renderList)
                    break;
            }
        }

        function updateAreaRect({left = 0, top = 0}, del = false) {
            area.moveXY({left, top})
            let filRenderList = that.renderList.filter(ren => {
                return ren.selected;
            })
            filRenderList.forEach(ren => {
                ren.adjust(left, top)
            })
            that.painting()
            if (del) deleteArea(that.renderList)
        }

        function updateSelRect({x = 0, y = 0}, sel = true) {
            if (target) target.adjust(x, y), target.setSelected(sel)
            if (!sel) target = null, that.errorHintView.innerText = ""
            that.painting()
        }

        function deleteArea(renderList) {
            let filRenderList = renderList.filter(ren => {
                return ren.constructor.name != "SelectArea"
            })
            console.log("deleteArea----", filRenderList)
            filRenderList.forEach(ren => {
                if ("setSelected" in ren) ren.setSelected(false)
            })
            that.renderList = filRenderList
            area = null
            clickEp = 0
            that.painting()
        }

        function deleteRects(renderList) {
            let filRenderList = renderList.filter(ren => {
                return !ren.selected && ren.constructor.name != "SelectArea";
            })
            that.renderList = filRenderList;
            that.painting()
            target = null
            area = null
            clickEp = 0
        }

        function getDownRect(renderList, x, y) {
            target = renderList.find(ren => {
                if (ren.isPointIn(x, y)) return ren
            })
            if (target) target.setSelected(true)
            that.painting()
        }

        function resetCopy() {
            that.contextCopy.style.display = "block"
            that.contextPaste.style.display = "none"
        }

        function copyList(list) {
            let newList = []
            let objList = JSON.parse(JSON.stringify(list))
            objList.forEach(item => {
                let bean = item.name === "Rect" ? new Rect(that.ctx, {}, '') : new SelectArea(that.ctx, {})
                delete item.ctx
                // console.log("objList.forEach", item)
                newList.push(copyBean(item, bean))
            })
            console.log("copyList", objList)
            return newList
        }

        function copyBean(obj, bean) {
            for (let p in obj)
                bean[p] = obj[p]
            return bean;
        }

        //统一添加事件
        this.canvas.addEventListener('mousedown', mouseDown)
        this.canvas.addEventListener('mousemove', mouseMove)
        this.canvas.addEventListener('mouseup', mouseUp)
        this.canvas.addEventListener("mousewheel", mouseWheel, false)
        document.onkeydown = keyInput;//键盘输入事件
        //右键菜单逻辑
        this.canvas.oncontextmenu = (event) => {
            console.log("oncontextmenu", event)
            this.contextPos = {x: event.offsetX, y: event.offsetY}
            event.preventDefault();
            if (target || area) {
                this.contextMenuView.style.display = 'block';
                this.contextMenuView.style.left = event.clientX + 'px';
                this.contextMenuView.style.top = event.clientY + 'px';
            }
        }
        //文档点击右键菜单消失
        document.onclick = function (event) {
            that.contextMenuView.style.display = 'none';
        }
        //
        this.contextDelete.addEventListener("click", () => {
            deleteRects(this.renderList)
        })
        this.contextCopy.addEventListener("click", () => {
            this.contextCopy.style.display = "none"
            this.contextPaste.style.display = "block"
        })
        this.contextPaste.addEventListener("click", () => {
            // debugger
            // let rectList = this.renderList
            let rectList = copyList(this.renderList) // todo 数据深拷贝没实现，会修改源数据
            console.log("contextPaste0--------", rectList)
            let selRects = rectList.filter(ren => {
                return ren.constructor.name != "SelectArea" && ren.selected
            })
            selRects.forEach(rect => {
                // debugger
                rect.left = rect.toax + this.contextPos.x
                rect.top = rect.toay + this.contextPos.y
            })
            console.log("contextPaste1--------", selRects)
            this.renderList = rectList.concat(selRects)
            console.log("contextPaste2--------", this.renderList)
            resetCopy()
            // updateSelRect({}, false)
            deleteArea(this.renderList)
            this.errorHintView.innerText="因为【JS数据深拷贝】没实现，会修改源数据。所以此功能实现有问题：1.源数据会丢失，2.重叠问题没心思实现，3.ctrl+c和ctrl+v也没心思实现。"
        })
    }
}
