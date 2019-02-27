class Test {
    constructor(options = {}) {
        const {
            config = {},
        } = options;

        this.config = config;
    }

    run(vars) {

        console.log(this.config)
    }
}

let o1 = new Test({config: {a: Math.random()}});
let o2 = new Test({config: {a: Math.random()}});

o1.run()
o2.run()

// (async () => {
//
//     let prom = [];
//
//     for (var i = 0; i < 3; i++) {
//         var obj = new Test({
//             config: {a: Math.random()},
//         });
//         prom.push(new Promise(resolve => {
//             setTimeout(() => { new Test({
//                 config: {a: Math.random()},
//             }).run(); resolve() }, 1000);
//         }));
//     }
//
//     let res = await Promise.all(prom);
//     console.log(res);
//
// })();