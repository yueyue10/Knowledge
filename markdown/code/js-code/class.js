//=================class类的基础：=================
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    print() {
        console.log("print now", this.x)
    }
}

/**
 * 输出Point的x坐标
 * @param {Point} p 参数是Point对象<这种方式是定义方法参数类型的>
 */
function printPoint(p) {
    console.log("test", p.x)
}

printPoint(new Point(10, 12))

//=================class类的this问题：=================
class Logger {
    printName(name = 'there') {
        this.print(`Hello ${name}`);
    }

    print(text) {
        console.log(text);
    }
}

const logger = new Logger();
const {printName} = logger;

//printName(); // TypeError: Cannot read property 'print' of undefined

//----------解决方法----------
class Logger1 {
    constructor() {
        this.printName1 = this.printName1.bind(this);
    }

    printName1(name = 'there') {
        this.print(`Hello ${name}`);
    }

    print(text) {
        console.log(text);
    }
}

const logger1 = new Logger1();
const {printName1} = logger1;
printName1()
