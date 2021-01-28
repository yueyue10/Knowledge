import {Rect, SelectArea} from "./utils.js"
//座椅配置
const rectConf = {
    col: 20,
    row: 15,
    divide: 5,
    width: 20
}
//画布配置
const mapConf = {
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
        contextDelete: "#context-menu>#delete"
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
        this.contextDelete = getViewByTag('contextDelete');
        this.seatText = this.seatView.textContent;
    }

    addRect(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        if (this.computeSuitable(target))
            this.renderList.push(target)
        return this
    }

    addRectInner(x, y) {
        let width = rectConf.width
        let target = new Rect(this.ctx, {left: x, top: y, width: width, height: width}, this.seatText)
        let suit = this.computeSuitable(target)
        if (suit) this.renderList.push(target)
        this.painting()
        return suit
    }

    selectArea(area, areaCon) {
        if (area == null) area = new SelectArea(this.ctx, areaCon), this.renderList.push(area)
        else area.adjust(areaCon.x2, areaCon.y2)
        let rectList = this.renderList.filter(ren => {
            return ren.constructor.name != "SelectArea"
        })
        rectList.forEach(rect => {
            let p1, p2, p3 = {x: rect.left, y: rect.top}, p4 = {x: rect.left + rect.width, y: rect.top + rect.height}
            if (area.x1 < area.x2 && area.y1 < area.y2)//向右下角划动
                p1 = {x: area.x1, y: area.y1}, p2 = {x: area.x2, y: area.y2}
            if (area.x1 < area.x2 && area.y1 > area.y2)//向右上角划动
                p1 = {x: area.x1, y: area.y2}, p2 = {x: area.x2, y: area.y1}
            if (area.x1 > area.x2 && area.y1 > area.y2)//向左上角划动
                p1 = {x: area.x2, y: area.y2}, p2 = {x: area.x1, y: area.y1}
            if (area.x1 > area.x2 && area.y1 < area.y2)//向左下角划动
                p1 = {x: area.x2, y: area.y1}, p2 = {x: area.x1, y: area.y2}
            if (p3.x > p1.x && p3.y > p1.y && p4.x < p2.x && p4.y < p2.y)
                rect.setSelected(true)
            else rect.setSelected(false)
        })
        this.painting()
        return area
    }

    computeSuitable(rect, leftScroll = 0, topScroll = 0) {
        this.errorHintView.innerText = ""
        let rectCache = {
            left: rect.left + leftScroll,
            top: rect.top + topScroll,
            width: rect.width,
            height: rect.height
        }
        console.log(rectCache)
        let suit = true;
        let renderList = this.renderList
        if (rect.rectId) renderList = renderList.filter(ren => {
            return ren.rectId && ren.rectId != rect.rectId
        })
        renderList.forEach((it, idx) => {
            let p1 = {x: it.left, y: it.top}
            let p2 = {x: it.left + it.width, y: it.top + it.height}
            let p3 = {x: rectCache.left, y: rectCache.top}
            let p4 = {x: rectCache.left + rectCache.width, y: rectCache.top + rectCache.height}
            // debugger
            let s1 = p2.y < p3.y - rectConf.divide
            let s2 = p1.y > p4.y + rectConf.divide
            let s3 = p2.x < p3.x - rectConf.divide
            let s4 = p1.x > p4.x + rectConf.divide
            let ySuit = (s1 || s2 || s3 || s4)
            // console.log("computeSuitable", idx, ySuit, p1, p2, p3, p4, s1, s2, s3, s4)
            if (!ySuit) {
                suit = false
                // console.log("computeSuitable", `${idx}条冲突`)
                this.errorHintView.innerText = `和${idx + 1}条冲突`
            }
        })
        let leftSize = mapConf.map.padding + 3;
        let rightSize = mapConf.map.padding + 3 + rectCache.width;
        if (rectCache.left < leftSize || rectCache.left > this.canvasInfo.width - rightSize || rectCache.top < leftSize || rectCache.top > this.canvasInfo.height - rightSize) {
            suit = false
            this.errorHintView.innerText = "超出边界！"
        }
        return suit
    }

    drawBorder() {
        console.log("drawBorder", this.zoomValue)
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
        console.log("数据长度：", this.renderList.length)
        this.ctx.clearRect(0, 0, this.canvasInfo.width, this.canvasInfo.height)
        this.drawBorder()
        this.renderList.forEach((it, index) => it.painting(index + 1))
    }

    addSpanEvent() {
        this.seatView.addEventListener("click", () => {
            this.mapStatus = this.mapStatus == 1 ? 2 : 1;
            this.seatView.style.color = this.mapStatus == 1 ? "red" : "#838388";
            this.mapStatusView.style.color = this.mapStatus == 1 ? "red" : "blue";
            this.mapStatusView.innerHTML = this.mapStatus == 1 ? "添加状态" : "编辑状态";
            if (this.mapStatus == 2) this.errorHintView.innerText = ""
        })
        this.resetZoomView.addEventListener("click", () => {
            this.zoomMap("0")
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
                        else deleteArea(this.renderList)
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
                    if (this.computeSuitable(target, currentX - startX, currentY - startY)) {
                        updateSelRect({x: currentX - startX, y: currentY - startY})
                        startX = currentX, startY = currentY
                    }
                } else if (clickEp == 1) {
                    area = this.selectArea(area, {x1: startX, y1: startY, x2: currentX, y2: currentY})
                } else if (clickEp == 3 && area != null) {
                    area.moveXY({left: currentX - startX, top: currentY - startY})
                    startX = currentX, startY = currentY
                    this.painting()
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
                    updateSelRect({}, false)
                    break;
                case 17://ctrl
                    break;
                case 27://esc
                    updateSelRect({}, false)
                    break
                case 37://left
                    if (target && this.computeSuitable(target, -2, 0)) updateSelRect({x: -2, y: 0})
                    break;
                case 38://up
                    if (target && this.computeSuitable(target, 0, -2)) updateSelRect({x: 0, y: -2})
                    break;
                case 39://right
                    if (target && this.computeSuitable(target, 2, 0)) updateSelRect({x: 2, y: 0})
                    break;
                case 40://down
                    if (target && this.computeSuitable(target, 0, 2)) updateSelRect({x: 0, y: 2})
                    break;
                case 46://delete
                    if (target) deleteRects(this.renderList)
                    if (area) deleteRects(this.renderList)
                    break;
            }
        }

        function updateSelRect({x = 0, y = 0}, sel = true) {
            target.adjust(x, y)
            target.setSelected(sel)
            that.painting()
            if (!sel) target = null, that.errorHintView.innerText = ""
        }

        function deleteArea(renderList) {
            let filRenderList = renderList.filter(ren => {
                return ren.constructor.name != "SelectArea"
            })
            filRenderList.forEach(ren => {
                ren.setSelected(false)
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

        //统一添加事件
        this.canvas.addEventListener('mousedown', mouseDown)
        this.canvas.addEventListener('mousemove', mouseMove)
        this.canvas.addEventListener('mouseup', mouseUp)
        this.canvas.addEventListener("mousewheel", mouseWheel, false)
        document.onkeydown = keyInput;//键盘输入事件
        //右键菜单逻辑
        this.canvas.oncontextmenu = (event) => {
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
    }
}
