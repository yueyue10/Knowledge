<template>
  <div class="wrapper">
    <div class="stage">舞台</div>
    <div class="seat-area" @mousemove="mousemove">
      <!-- @mousewheel.prevent="rollCanvas" -->
      <span id="noselect" class="iconfont" style="display: none">&#xe6f1;</span>
      <span id="selected" class="iconfont" style="display: none">&#xe6f8;</span>
      <canvas
        id="canvas"
        class="area"
        :width="winWidth"
        :height="propEndRow * (postionHeight + 2)"
      >
      </canvas>
    </div>
  </div>
</template>

<script>
import NumberPlus from "@/utils/number";
export default {
  props: [
    "propSeatList",
    "propEndRow",
    "propEndCol",
    "propFloors",
    "propStartRow",
    "propStartCol",
    "propSelectSeat",
    "propTempSelectStall",
  ],
  head: {
    script: [
      {
        // src: "//at.alicdn.com/t/font_2251844_ra3wrl0s66.js",
      },
    ],
  },
  data() {
    return {
      postionWidth: 0,
      postionHeight: 0,
      startRow: 0,
      endRow: 0,
      startCol: 0,
      endCol: 0,
      zoom: 1,
      winWidth: 0,
    };
  },
  created() {
    // todo 套票功能
  },
  mounted() {
    this.winWidth = window.innerWidth > 1919 ? 1620 : window.innerWidth - 294;
    this.postionWidth = this.postionHeight =
      this.winWidth / (this.propEndCol - this.propStartCol + 3);

    var canvas = document.getElementById("canvas");
    let _this = this;

    let time = setTimeout(() => {
      this.drawSeatMap();
      clearTimeout(time);
    }, 500);
    // 监听点击事件
    canvas.addEventListener(
      "click",
      function (e) {
        let x = e.clientX - canvas.getBoundingClientRect().left;
        let y = e.clientY - canvas.getBoundingClientRect().top;
        // console.info(x, y);
        _this.drawSeatMap(2, { x, y });
      },
      false
    );

    window.addEventListener("resize", () => {
      _this.winWidth = window.innerWidth > 1919 ? 1620 : window.innerWidth - 294;
      _this.postionWidth = _this.postionHeight =
        _this.winWidth / (_this.propEndCol - _this.propStartCol + 3);
      let time = setTimeout(() => {
        _this.drawSeatMap();
        clearTimeout(time);
      }, 300);
    });
  },
  methods: {
    /**
     * type: 1 初始绘制 2 点击事件  3 放大缩小 4 重绘  5 选中票档
     * params: 具体参数
     */
    drawSeatMap(type = 1, params) {
      let _this = this;
      //  首先从页面上获取字体内容，直接绘制无效，能实现的关键点1
      let noselect = document.getElementById("noselect").textContent;
      let selected = document.getElementById("selected").textContent;
      // 获取canvas对象
      var canvas = document.getElementById("canvas");
      //  获取画布
      var ctx = canvas.getContext("2d");
      if (canvas.getContext) {
        // 清空区域内所有内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // todo 绘制背景图
        // ctx.drawImage(
        //   document.getElementById("img"),
        //   0,
        //   0,
        //   canvas.width,
        //   canvas.height,
        //   _this.postionWidth * 0.5,
        //   _this.postionHeight * 2.4,
        //   canvas.width,
        //   canvas.height
        // );
        // 绘制楼层
        if (this.propFloors && this.propFloors.length > 0)
          for (let i = this.propFloors.length - 1; i >= 0; i--) {
            let floor = this.propFloors[i];
            ctx.beginPath();
            ctx.strokeStyle = "#CBCBCD";
            ctx.fillStyle = "#fff";
            let x = NumberPlus.times(
                floor.sCol - this.propStartCol + 0.45,
                this.postionWidth
              ),
              y = NumberPlus.times(
                floor.sRow - this.propFloors[0].sRow + 2.6,
                this.postionWidth
              ),
              width = NumberPlus.times(
                floor.eCol - floor.sCol + 1.9,
                this.postionWidth
              ),
              height = NumberPlus.times(
                floor.eRow - floor.sRow + 2.6,
                this.postionHeight
              );
            ctx.rect(x, y, width, height);
            ctx.fillRect(
              NumberPlus.plus(x, 1),
              NumberPlus.plus(y, 1),
              NumberPlus.minus(width, 2),
              NumberPlus.minus(height, 2)
            );
            // 楼层文字
            ctx.font = "60px Calibri";
            ctx.fillStyle = "#dadada";
            let equallyWidth = NumberPlus.plus(width, NumberPlus.times(x, 2));
            ctx.fillText(
              floor.name,
              NumberPlus.minus(
                NumberPlus.divide(equallyWidth, 2),
                (floor.name.length / 2) * 60
              ),
              NumberPlus.plus(y + 20, NumberPlus.divide(height, 2))
            );
            ctx.stroke();
          }
        const realWidth = NumberPlus.times(this.postionWidth, 0.7),
          realHeight = NumberPlus.times(this.postionHeight, 0.7);

        this.propSeatList.forEach((seat) => {
          let content = noselect,
            postionX = NumberPlus.times(
              seat.SEATXCOL - _this.propStartCol + 1,
              _this.postionWidth
            ),
            postionY = NumberPlus.times(
              seat.SEATYROW - _this.propStartRow + 4,
              _this.postionHeight
            );
          //  设置填充与描边
          if (type === 1) {
            // 如果为1 且params有值 是删除座位 需要重绘 去除未选座位
            if (params) {
              seat.selected =
                params.findIndex((p) => p.SCENESEATID === seat.SCENESEATID) !==
                -1;
            }
          } else if (type === 2) {
            let { x, y } = params;
            ctx.beginPath();
            // 通过绘制圆判断座椅是否在范围内，但是精度需要校正
            // 半径
            let radius = NumberPlus.times(
              _this.postionWidth,
              NumberPlus.times(0.7, 0.5)
            );
            ctx.rect(postionX, postionY - realHeight, realWidth, realHeight);
            if (ctx.isPointInPath(x, y) && seat.SEATSTATUSID == 6) {
              let selectSeatList = [...this.propSelectSeat];
              if (!seat.selected) {
                if (selectSeatList.length >= 6) {
                  this.$Notice.error({
                    title: "提示",
                    desc: "单次只能购买6张",
                  });
                } else {
                  seat.selected = true;
                  selectSeatList.push({
                    ...seat,
                  });
                }
              } else {
                seat.selected = false;
                let index = selectSeatList.findIndex(
                  (item) => item.SCENESEATID == seat.SCENESEATID
                );
                if (index !== -1) selectSeatList.splice(index, 1);
              }
              this.$emit("selectSeat", selectSeatList);
            }
          }

          if (seat.SEATSTATUSID == 6) {
            if (seat.selected) ctx.fillStyle = "rgba(31, 135, 7, 1)";
            else {
              let opacity = 1;
              if (type == 5 && params && params.areaId != seat.AREAID)
                opacity = 0.2;
              ctx.fillStyle = "rgba(" + seat.AREACOLOR + "," + opacity + ")";
            }
          } else ctx.fillStyle = "rgba(241, 241, 241,1)";

          //  设置字体，能实现的关键点2
          ctx.font = realWidth + "px iconfont";

          content = seat.selected == true ? selected : noselect;

          //  绘制内容
          ctx.fillText(content, postionX, postionY);
        });

        if (type == 3) {
          let zoom = 1;
          zoom += params / 12000;
          ctx.translate((1 - zoom) * 1000, (1 - zoom) * 1000);
          // console.info(zoom, (1 - zoom) * 100);
          ctx.scale(zoom, zoom);
        }
      }
    },
    mousemove(event) {
      // console.info(event.offsetX, event.offsetY);
    },
    rollCanvas() {
      let _this = this;

      this.drawSeatMap(3, event.wheelDelta);
    },
  },
};
</script>

<style lang="less" scoped>
.wrapper {
  position: relative;
  overflow: hidden;
  width: 1620px;
  background-color: #fff;
  .seat {
    // position: absolute;
  }
  .stage {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: inline-block;
    width: 400px;
    line-height: 40px;
    text-align: center;
    font-size: 16px;
    background-color: #e0e0e0;
    border-radius: 0 0 40px 40px;
  }
  .seat-area {
    position: relative;
    left: 0;
    right: 0;
    top: 0;
    .seat {
      cursor: pointer;
      position: absolute;
      display: inline-block;
      text-align: center;
      // background-color: #cd0000;
    }
    .icon {
      vertical-align: middle;
      display: inline-block;
    }
  }
}

/*当页面宽度大于1000px且小于1680px的时候执行,1000px-1680px*/
@media screen and (min-width: 1000px) and (max-width: 1919px) {
  .wrapper {
    position: relative;
    overflow: hidden;
    width: 100%;
    background-color: #fff;
    .seat {
      // position: absolute;
    }
    .stage {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      display: inline-block;
      width: 400px;
      line-height: 40px;
      text-align: center;
      font-size: 16px;
      background-color: #e0e0e0;
      border-radius: 0 0 40px 40px;
    }
    .seat-area {
      position: relative;
      left: 0;
      right: 0;
      top: 0;
      .seat {
        cursor: pointer;
        position: absolute;
        display: inline-block;
        text-align: center;
        // background-color: #cd0000;
      }
      .icon {
        vertical-align: middle;
        display: inline-block;
      }
    }
  }
}
</style>
