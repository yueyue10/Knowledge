//座位
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
        this.rectId = 0 //唯一标识
    }

    adjust(left, top) {
        this.left += left
        this.top += top
    }

    setSelected(sel) {
        this.background = sel ? "red" : "#f4a41e"
    }

    isPointIn(x, y) {
        this.ctx.beginPath()
        this.ctx.rect(this.left, this.top, this.width, this.height);
        let isIN = this.ctx.isPointInPath(x, y)
        this.ctx.closePath()
        return isIN
    }

    painting(index, drawBorder = true) {
        this.rectId = index
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
        if (index) {
            this.ctx.fillStyle = "#fff"
            this.ctx.font = "12px Georgia";
            this.ctx.fillText(index, this.left + this.width / 2, this.top + this.height / 2, 10);
        }
        this.ctx.restore()
    }
}

//选中区域
class SelectArea {
    constructor(ctx, {
        x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0,
        background = '#f4a41e'
    }) {
        this.ctx = ctx
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.background = background
    }

    adjust(x2, y2) {
        this.x2 = x2
        this.y2 = y2
    }

    painting() {
        this.ctx.save();
        this.ctx.setLineDash([5])
        this.ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
        this.ctx.restore();
    }
}

export class SeatMap {

    constructor(canvas_id, seat_span_id, map_status_id, error_hint_id) {
        this.mapStatus = 2;//1:新增 2:编辑
        this.renderList = []
        this.canvas = document.getElementById(canvas_id)
        this.seatView = document.getElementById(seat_span_id);
        this.mapStatusView = document.getElementById(map_status_id);
        this.errorHintView = document.getElementById(error_hint_id);
        this.seatText = this.seatView.textContent;
        this.ctx = this.canvas.getContext('2d')
        this.canvasInfo = this.canvas.getBoundingClientRect()
        this.addSpanEvent()
        this.addMapEvent()
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
    }

    addSelectArea(areaConfig) {
        let target = new SelectArea(this.ctx, areaConfig)
        this.renderList.push(target)
        return target
    }

    computeSuitable(rect, leftr = 0, topr = 0) {
        let rectCache = {left: rect.left + leftr, top: rect.top + topr, width: rect.width, height: rect.height}
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
            let s1 = p2.y < p3.y - 5
            let s2 = p1.y > p4.y + 5
            let s3 = p2.x < p3.x - 5
            let s4 = p1.x > p4.x + 5
            let ySuit = (s1 || s2 || s3 || s4)
            // console.log("computeSuitable", idx, ySuit, p1, p2, p3, p4, s1, s2, s3, s4)
            if (!ySuit) {
                suit = false
                // console.log("computeSuitable", `${idx}条冲突`)
                this.errorHintView.innerText = `和${idx + 1}条冲突`
            }
        })
        if (rectCache.left < 3 || rectCache.left > this.canvasInfo.width - 23 || rectCache.top < 3 || rectCache.top > this.canvasInfo.height - 23) {
            suit = false
            this.errorHintView.innerText = "超出边界！"
        }
        return suit
    }

    painting() {
        console.log("数据长度：", this.renderList.length)
        this.ctx.clearRect(0, 0, this.canvasInfo.width, this.canvasInfo.height)
        this.renderList.forEach((it, index) => it.painting(index + 1))
        this.ctx.restore()
    }

    addSpanEvent() {
        this.seatView.addEventListener("click", () => {
            this.mapStatus = this.mapStatus == 1 ? 2 : 1;
            this.seatView.style.color = this.mapStatus == 1 ? "red" : "#838388";
            this.mapStatusView.style.color = this.mapStatus == 1 ? "red" : "blue";
            this.mapStatusView.innerHTML = this.mapStatus == 1 ? "添加状态" : "编辑状态";
            if (this.mapStatus == 2) this.errorHintView.innerText = ""
        })
    }

    addMapEvent() {
        let startX, startY, target, downEp, area
        this.canvas.addEventListener('mousedown', e => {
            // debugger
            this.errorHintView.innerText = ""
            startX = e.offsetX, startY = e.offsetY
            if (this.mapStatus == 1) {//如果是添加状态
                this.addRectInner({left: startX - 10, top: startY - 10, width: 20, height: 20})
                this.painting()
            } else {
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
            }
        })
        this.canvas.addEventListener('mousemove', e => {
            // debugger
            const currentX = e.offsetX, currentY = e.offsetY
            if (this.mapStatus == 1)
                return
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
        })
        this.canvas.addEventListener('mouseup', e => {
            const currentX = e.offsetX, currentY = e.offsetY
            if (this.mapStatus != 1 && target != null) {
                this.errorHintView.innerText = ""
                this.painting()
            }
        })

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
    }
}

