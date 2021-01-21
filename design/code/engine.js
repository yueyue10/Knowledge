import {floatAdd, floatSub} from "./utils.js"

class Rect {
    constructor(ctx, {
        top = 0,
        left = 0,
        width = 0,
        height = 0,
        background = '#f4a41e'
    }, seat_text) {
        this.ctx = ctx
        this.top = top
        this.left = left
        this.width = width
        this.height = height
        this.seat_text = seat_text
        this.background = background
    }

    adjust(left, top, type) {
        this.left += left
        this.top += top
        this.background = type === "up" ? "#f4a41e" : "red"
    }

    isPointIn(x, y) {
        this.ctx.beginPath()
        this.ctx.rect(this.left, this.top, this.width, this.height);
        let isIN = this.ctx.isPointInPath(x, y)
        this.ctx.closePath()
        return isIN
    }

    painting(drawBorder = true) {
        this.ctx.save()
        if (drawBorder) {
            //绘制边框
            this.ctx.beginPath()
            this.ctx.rect(this.left, this.top, this.width, this.height)
            this.ctx.fillStyle = this.background
            this.ctx.stroke()
            this.ctx.closePath()
        }
        //绘制图形
        this.ctx.textAlign = "center"
        this.ctx.textBaseline = "middle";
        this.ctx.font = this.width + "px iconfont";
        this.ctx.fillStyle = this.background
        this.ctx.fillText(this.seat_text, this.left + this.width / 2, this.top + this.height / 2);
        this.ctx.restore()
    }
}

export class SeatMap {

    constructor(canvas_id, seat_span_id, map_status_id) {
        this.mapStatus = 2;//1:新增 2:编辑
        this.renderList = []
        this.canvas = document.getElementById(canvas_id)
        this.seatView = document.getElementById(seat_span_id);
        this.mapStatusView = document.getElementById(map_status_id);
        this.seatText = this.seatView.textContent;
        this.ctx = this.canvas.getContext('2d')
        this.canvasInfo = this.canvas.getBoundingClientRect()
        this.addSpanEvent()
        this.addMapEvent()
    }

    addRect(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        this.addRenderList(target)
        return this
    }

    addRectInner(rectConfig) {
        let target = new Rect(this.ctx, rectConfig, this.seatText)
        this.renderList.push(target)
    }

    addRenderList(target) {
        this.renderList.push(target)
    }

    painting() {
        console.log("数据长度：", this.renderList.length)
        this.ctx.clearRect(0, 0, this.canvasInfo.width, this.canvasInfo.height)
        this.renderList.forEach(it => it.painting())
        this.ctx.restore()
    }

    addSpanEvent() {
        this.seatView.addEventListener("click", () => {
            this.mapStatus = this.mapStatus == 1 ? 2 : 1;
            this.seatView.style.color = this.mapStatus == 1 ? "red" : "#838388";
            this.mapStatusView.style.color = this.mapStatus == 1 ? "red" : "blue";
            this.mapStatusView.innerHTML = this.mapStatus == 1 ? "添加状态" : "编辑状态";
        })
    }

    addMapEvent() {
        const that = this
        let startX, startY, target
        this.canvas.addEventListener('mousedown', e => {
            startX = e.offsetX, startY = e.offsetY
            this.painting()
            if (this.mapStatus == 1) {//如果是添加状态
                this.addRectInner({left: floatSub(startX, 10), top: floatSub(startY, 10), width: 20, height: 20})
                this.painting()
            } else {
                let chooseIdx = null
                this.renderList.forEach((it, idx) => {
                    if (it.isPointIn(startX, startY)) {
                        chooseIdx = idx
                    }
                })
                if (chooseIdx == null)
                    return
                target = that.renderList[chooseIdx]
                document.addEventListener('mousemove', mouseMoveEvent)
                document.addEventListener('mouseup', mouseUpEvent)
            }
        })

        function mouseMoveEvent(e) {
            const currentX = e.offsetX, currentY = e.offsetY
            target.adjust(currentX - startX, currentY - startY, "move")
            startX = currentX, startY = currentY
            that.painting()
        }

        function mouseUpEvent(e) {
            const currentX = e.offsetX, currentY = e.offsetY
            target.adjust(currentX - startX, currentY - startY, "up")
            startX = currentX, startY = currentY
            that.painting()

            document.removeEventListener('mousemove', mouseMoveEvent)
            document.removeEventListener('mouseup', mouseUpEvent)
        }
    }
}

