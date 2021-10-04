# p2o-adapter
Peers to object adapter make communication between your server and your client, between the main thread and the worker thread or even between the javascript code running in a webview (react-native-webview) and the native code of an android or ios application (with react-native) more fluid and understandable

## install
```sh
$ npm install p2o-adapter
```

## usage
* `ws`
    * server side
        ```js
        const { createServer } = require('http');
        const { WebSocketServer } = require('ws');
        const fs = require('fs');
        const {initialize} = require('p2o-adapter')

        const server = createServer();
        const wss = new WebSocketServer({ server });

        wss.on('connection', function connection(ws) {
            initialize(ws, "websocket", [{
                moduleId: "fs",
                module: fs
            }])
        });

        server.listen(8080);
        ```
    * browser side
        ```js
        import {initializeWeb} from "p2o-adapter"

        let ws = new WebSocket("ws:localhost:8080");

        (async _=>{
            let proxy = await initializeWeb(ws, "websocket")

            console.log(proxy.fs.readdirSync("/"))
        })()
        ```
* `react-native-webview`
    * react-native-app side
        ```jsx
        import React,{memo, useCallback, useEffect, useRef} from "react"
        import {WebView} from "react-native-webview"
        import { initialize } from "p2o-adapter"
        
        function fact(n){
            return n<=1? 1: fact(n-1)*n
        }

        export default memo(function CustomWebview(props){
            let script = `
            window.isNative = true
            true;
            `    
            let wref = useRef(null)
            let webview
            useEffect(_=>{
                webview = wref.current
                initialize(webview, "react-native",[{
                    moduleId: "app",
                    module: {...globalThis, fact},
                    methods: ["alert","fact"] // specify the methods to be shared
                }])
            },[])

            return <WebView
                ref={wref}
                source= ""
                injectedJavaScriptBeforeContentLoaded = {script}
                onMessage={_=>{}}
            />
        })
        ```
    * webview side
        ```js
        import { initializeWeb } from "p2o-adapter";

        (async() => {

            let proxy = await initializeWeb(ReactNativeWebView, "react-native")

            proxy.app.alert('ok! ')

            alert(console.app.fact(5))
        })()
        ```

 more examples can be found in examples folder

 ## caution
 giving access to certain native features in any way can be very dangerous for your server so know how to use it.
 Initially, this module was created to give access to some react-native functions to the web page loaded in an instance of react-native-webview then it turned out to be of interest to extend it to webworkers and websocket
