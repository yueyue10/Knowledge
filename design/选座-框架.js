/**
 * 场馆类
 */
class Venue {
    constructor(canvas) {
        this.status = 0;//当前状态：0：初始化完成；1：添加状态；2：修改状态
        this.canvas = canvas;//画布对象
        this.componentChecked = null;//选中的组件对象
        this.canvasWidth = 100;
        this.canvasHeight = 100;
        this.allComponentList = [] //画布上的所有组件数组
        this.initCanvas()
        this.initListener()
    }

    initCanvas() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
    }

    initListener() {
        //画布响应鼠标的事件
        this.canvas.addEventListener("click", () => {

        }, false)
    }

    componentCheckChange(checked, component) {
        this.status = checked ? 1 : 2;
        this.componentChecked = component || null;
    }

    drawComponents() {
        for (let i = 0; i < this.allComponentList.length; i++) {
            ctx.save()
            ctx.beginPath()
            ctx.font = "60px iconfont";
            ctx.fillText(this.allComponentList[i].text, this.allComponentList[i].x, this.allComponentList[i].y);
        }
    }
}

