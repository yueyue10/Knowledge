# js基础

### 一、[class][class]的使用[参考][class-参考]

>this的指向
`类的方法内部如果含有this，它默认指向类的实例。但是，必须非常小心，一旦单独使用该方法，很可能报错。`

**下面的代码就会导致class类里面的this不能正确引用**
```
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
printName(); // TypeError: Cannot read property 'print' of undefined
```

* 解决方法一：`在构造方法中绑定this，这样就不会找不到print方法了。`
```
class Logger {
  constructor() {
    this.printName = this.printName.bind(this);
  }

  // ...
}
```
* 解决方法二：`使用箭头函数`
```
class Logger {
  constructor() {
    this.printName = (name = 'there') => {
      this.print(`Hello ${name}`);
    };
  }

  // ...
}
```

### 二、[function][function]的使用

### 三、async函数使用[参考][async-参考]

* 1.await 容易引入错误，需要try-catch包裹
    ```
    async function myFunction() {
      await somethingThatReturnsAPromise()
      .catch(function (err) {
        console.log(err);
      };
    }
    ```
* 2.多个`await`命令后面的异步操作，如果不存在继发关系，最好让它们同时触发。
    ```
    //继发关系
    let foo = await getFoo();
    let bar = await getBar();
    // 同时触发
    let [foo, bar] = await Promise.all([getFoo(), getBar()]);
    ```
* 3.`await`命令只能用在`async`函数之中，如果用在普通函数，就会报错。
    ```
    //for循环继发操作
    async function dbFuc(db) {
      let docs = [{}, {}, {}];
    
      for (let doc of docs) {
        await db.post(doc);
      }
    }
    //对数组的数据进行多个请求并发执行
    async function dbFuc(db) {
      let docs = [{}, {}, {}];
      let promises = docs.map((doc) => db.post(doc));
    
      let results = await Promise.all(promises);
      console.log(results);
    }
    ```
### 四、module使用[参考][module-参考]

[class]:code/js-code/class.js
[function]:code/js-code/function.js
[async-参考]:http://jsrun.net/t/MZKKp
[class-参考]:http://jsrun.net/t/SZKKp
[module-参考]:http://jsrun.net/t/KgKKp
