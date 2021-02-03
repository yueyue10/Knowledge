class B {
    constructor(num, bValue, cb) {
        this.num = num
        this.bValue = bValue
        this.cb = cb
        this.showValue()
    }

    showValue() {
        this.bValue.innerHTML = this.num
    }

    scaleBack() {
        this.num++
        if (this.num > 5) this.cb(this.num), this.num = 0
    }

    addClick(callback) {
        this.num++
        if (this.num > 5) callback(this.num), this.num = 0
        this.showValue()
    }
}

class A {
    /**
     * @param{B} b
     */
    constructor(b, aListen) {
        this.b = b
        this.aListen = aListen
    }

    listenB() {
        let mNum = ''
        this.b.addClick(function (num) {
            console.log("B的数据返回到A", num)
            mNum = "从B返回数据：" + num
        })
        this.aListen.innerHTML = mNum
    }
}

window.onload = () => {
    let btnAb = document.getElementById('a-call-b')
    let bValue = document.getElementById('b-value')
    let aListen = document.getElementById('b-back-a')

    //A引用B，B调用A的方法
    let bObj = new B(2, bValue, (num) => {
        let mNum = ''
        if (num) mNum = "从B返回数据：" + num
        aListen.innerHTML = mNum
    })
    let aObj = new A(bObj, aListen)
    //添加A的点击监听
    btnAb.addEventListener('click', () => {
        // aObj.listenB() //方法一：通过方法为B传入【回调函数】
        bObj.scaleBack() //方法二：使用构造函数为B传入【回调函数】
        //todo 方法三：在A里面创建B，B里面的方法就可以回调到A里面的方法
    })
}




