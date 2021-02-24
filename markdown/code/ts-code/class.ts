//class类的使用
class Test {
    name

    constructor(name, public age: number) {
        this.name = name
    }

    eat() {
        console.log(this.name, this.age)
    }
}

let tt = new Test("zhang", 10)
tt.eat()

//interface接口的使用
interface Animal {
    eat()
}

class Tiger implements Animal {
    eat() {
        console.log('i eat meat')
    }

}

let tg = new Tiger()
tg.eat()
