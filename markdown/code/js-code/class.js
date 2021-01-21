class Class {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    print() {
        console.log("print now", this.x)
    }
}

function test(p = Class) {
    console.log("test", p.x)
}

test(new Class(10, 12))
let ttt=new Class(21,21)
ttt.print()
