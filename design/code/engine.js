import {Rect, SelectArea} from "./utils.js"

const rectNum = [20, 15]
const config = {
    width: 6 * 2 + 30 * rectNum[0],
    height: 6 * 2 + 30 * rectNum[1],
    mapPadding: 5,
    rectDivide: 5,
    rectWidth: 20
}

export class SeatMap {

    constructor(canvas_id, seat_span_id, map_status_id, error_hint_id, reset_zoom_id, set_translate_id, menu_id, auto_add_id) {
        this.mapStatus = 2;//1:新增 2:编辑 3:平移
        this.zoomValue = 1;
        this.scaleValue = 1
        this.renderList = []
        this.canvas = document.getElementById(canvas_id)
        this.seatView = document.getElementById(seat_span_id);
        this.mapStatusView = document.getElementById(map_status_id);
        this.errorHintView = document.getElementById(error_hint_id);
        this.resetZoomView = document.getElementById(reset_zoom_id);
        this.translateView = document.getElementById(set_translate_id);
        this.contextMenuView = document.getElementById(menu_id);
        this.autoAddView = document.getElementById(auto_add_id);
        this.seatText = this.seatView.textContent;
        this.initConfig()
        this.addSpanEvent()
        this.addMapEvent()
    }

    initConfig() {
        this.canvas.width = config.width
        this.canvas.height = config.height
        this.ctx = this.canvas.getContext('2d')
        this.canvasInfo = this.canvas.getBoundingClientRect()
    }

    addRect(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        if (this.computeSuitable(target))
            this.renderList.push(target)
        return this
    }

    addRectInner(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        if (this.computeSuitable(target))
            this.renderList.push(target)
        this.painting()
    }

    deleteRect(rect) {
        let index = this.renderList.findIndex(ren => {
            return ren == rect
        })
        this.renderList.splice(index, 1);
    }

    addSelectArea(areaConfig) {
        let target = new SelectArea(this.ctx, areaConfig)
        this.renderList.push(target)
        return target
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
            let s1 = p2.y < p3.y - config.rectDivide
            let s2 = p1.y > p4.y + config.rectDivide
            let s3 = p2.x < p3.x - config.rectDivide
            let s4 = p1.x > p4.x + config.rectDivide
            let ySuit = (s1 || s2 || s3 || s4)
            // console.log("computeSuitable", idx, ySuit, p1, p2, p3, p4, s1, s2, s3, s4)
            if (!ySuit) {
                suit = false
                // console.log("computeSuitable", `${idx}条冲突`)
                this.errorHintView.innerText = `和${idx + 1}条冲突`
            }
        })
        let leftSize = config.mapPadding + 3;
        let rightSize = config.mapPadding + 3 + rectCache.width;
        if (rectCache.left < leftSize || rectCache.left > this.canvasInfo.width - rightSize || rectCache.top < leftSize || rectCache.top > this.canvasInfo.height - rightSize) {
            suit = false
            this.errorHintView.innerText = "超出边界！"
        }
        return suit
    }

    drawBorder() {
        console.log("drawBorder", this.zoomValue)
        let padding = config.mapPadding
        this.ctx.strokeRect(padding, padding, (this.canvasInfo.width - 2 * padding - 2) * this.scaleValue, (this.canvasInfo.height - 2 * padding - 2) * this.scaleValue)
        let margin = config.mapPadding + 2
        let rectWidth = config.rectWidth + config.rectDivide * 2
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
        let row = 0, col = 0
        let timer = setInterval(() => {
            this.addRectInner({
                left: config.mapPadding + 2 + 5 + row * 30,
                top: config.mapPadding + 2 + 5 + col * 30,
                width: 20,
                height: 20
            })
            if (row < rectNum[0] - 1) row++
            else row = 0, col++
            if (col == rectNum[1]) clearInterval(timer), this.mapStatus = 2, this.mapStatusView.innerHTML = "编辑状态"
        }, 20)
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
            this.mapStatusView.innerHTML = "添加状态"
            this.autoAddView.disabled = true
            this.autoAddRect()
        })
    }

    addMapEvent() {
        let startX, startY, target, downEp, trans, area, that = this

        //鼠标落下事件
        let mouseDown = e => {
            // debugger
            if (e.button == 2) {//鼠标右击事件
                return
            }
            startX = e.offsetX, startY = e.offsetY
            if (this.mapStatus == 1) {//如果是添加状态
                this.addRectInner({
                    left: startX - config.rectWidth / 2,
                    top: startY - config.rectWidth / 2,
                    width: config.rectWidth,
                    height: config.rectWidth
                })
            } else if (this.mapStatus == 2) {
                if (target != null) {//如果有的话，就反选
                    target.adjust(0, 0)
                    target.setSelected(false)
                    target = null
                    this.painting()
                } else if (area != null) {
                    if (downEp == 1) {
                        downEp = 2
                    } else if (downEp == 2) {
                        deleteArea(this.renderList)
                        area = null
                        downEp = null
                        this.painting()
                    }
                } else {
                    target = getDownRect(this.renderList, startX, startY)
                    if (target) target.setSelected(true)
                    downEp = target == undefined ? 1 : 0
                    this.painting()
                }
            } else if (this.mapStatus == 3) {
                trans = 1
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
                        target.adjust(currentX - startX, currentY - startY)
                        startX = currentX, startY = currentY
                        this.painting()
                    }
                } else if (downEp == 1) {
                    if (area == null)
                        area = this.addSelectArea({x1: startX, y1: startY, x2: currentX, y2: currentY})
                    else
                        area.adjust(currentX, currentY)
                    this.painting()
                }
            if (this.mapStatus == 3 && trans == 1) {//只有拖动的时候才移动
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
            trans = 0
        }
        /**
         * 鼠标滚轮监听
         */
        let mouseWheel = event => {
            console.log("mousewheel", event.wheelDelta)
            let delta = event.wheelDelta ? (event.wheelDelta / 120) : (-event.detail / 3);
            this.zoomMap(delta > 0 ? "1" : "-1")
        }
        /**
         * 键盘输入监听
         */
        let keyInput = e => {
            let ev = window.event || e;
            console.log(['keydown', ev.keyCode]);
            switch (ev.keyCode) {
                case 13://enter
                    if (target) {
                        target.adjust(0, 0)
                        target.setSelected(false)
                        this.painting()
                        target = null
                        this.errorHintView.innerText = ""
                    }
                    break;
                case 17://ctrl
                    break;
                case 27:
                    if (target) {
                        target.setSelected(false)
                        this.painting()
                        target = null
                        this.errorHintView.innerText = ""
                    }
                    break
                case 37://left
                    if (target && this.computeSuitable(target, -2, 0)) {
                        target.adjust(-2, 0)
                        this.painting()
                    }
                    break;
                case 38://up
                    if (target && this.computeSuitable(target, 0, -2)) {
                        target.adjust(0, -2)
                        this.painting()
                    }
                    break;
                case 39://right
                    if (target && this.computeSuitable(target, 2, 0)) {
                        target.adjust(2, 0)
                        this.painting()
                    }
                    break;
                case 40://down
                    if (target && this.computeSuitable(target, 0, 2)) {
                        target.adjust(0, 2)
                        this.painting()
                    }
                    break;
                case 46://delete
                    if (target) that.deleteRect(target)
                    target = null;
                    break;
            }
        }

        function deleteArea(renderList) {
            let index = renderList.findIndex(ren => {
                return ren.constructor.name == "SelectArea"
            })
            renderList.splice(index, 1);
        }

        function getDownRect(renderList, x, y) {
            let clickRect = renderList.find(ren => {
                if (ren.isPointIn(x, y))
                    return ren
            })
            return clickRect
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
        document.onclick = function (event) {
            that.contextMenuView.style.display = 'none';
        }
    }
}
