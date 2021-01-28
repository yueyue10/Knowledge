//座位
export class Rect {
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
        this.selected = false//是否被选中
    }

    adjust(left, top) {
        this.left += left
        this.top += top
    }

    setSelected(sel) {
        this.selected = sel
        this.background = sel ? "red" : "#f4a41e"
    }

    isPointIn(x, y) {
        this.ctx.beginPath()
        this.ctx.rect(this.left, this.top, this.width, this.height);
        let isIN = this.ctx.isPointInPath(x, y)
        this.ctx.closePath()
        return isIN
    }

    painting(index, drawBorder = false) {
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
            this.ctx.font = "10px Arial";
            this.ctx.fillStyle = "#fff"
            this.ctx.fillText(index, this.left + this.width / 2, this.top + this.height / 2);
        }
        this.ctx.restore()
    }
}

//选中区域
export class SelectArea {
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
        this.ctx.lineWidth = 2
        this.ctx.setLineDash([5, 1])
        this.ctx.strokeStyle = "#345f04"
        this.ctx.fillStyle = "rgba(155, 187, 89, 0.7)"
        this.ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
        this.ctx.fillRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1)
        this.ctx.restore();
    }
}
