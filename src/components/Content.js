'use strict';
const request = require('request');
const path = require('path');

class Content {
    constructor(){
        window.Main = this;
        
        this.WebView = document.getElementById('webview');
        this.Bar = new Bar();
        
        this.WebViewEvent();
        this.loadCss = true;
        this.loadJs = true;
        this.loadToken = true;
        this.reloadLogin = true;

        emmitLoad.on('removeLoading', function(){
            if(!this.loadCss && !this.loadJs && !this.loadToken && !this.reloadLogin){
                setTimeout(function(){
                    document.body.classList.remove('loading');
                }, 8000);
            }
        });
        

    }

    WebViewEvent(){
        this.WebView.addEventListener('close', this.Close.bind(this));
        // this.WebView.addEventListener('load-commit', this.loadCommit.bind(this));
        this.WebView.addEventListener('did-start-loading', this.didStartLoading.bind(this));
        this.WebView.addEventListener('did-stop-loading', this.didStopLoading.bind(this));
        this.WebView.addEventListener('did-finish-load', this.didFinishLoad.bind(this));
        this.WebView.addEventListener('dom-ready', this.Ready.bind(this));
    }

    Ready(){
        document.body.classList.add('loading');
    }

    Close(){
        document.body.classList.add('close-exit');
    }

    didStartLoading(){
        // if(!this.loadCss && !this.loadJs && !this.loadToken){
            // document.body.classList.add('loading');
        // }
    }

    didStopLoading(){
        // if(!this.loadCss && !this.loadJs && !this.loadToken && !this.reloadLogin){
            // document.body.classList.remove('loading');
        // }
        // this.WebView.openDevTools();
    }

    didFinishLoad(){
        const self = this;
        request.get('https://gatwave.fr/app/assets/css/webview.css', (error, response, data) => {
            if(!error){
                var formatedCSS = data.replace(/\s/g, ' ').trim();
                self.WebView.insertCSS(formatedCSS);
                self.loadCss = false;
                emmitLoad.emit('removeLoading');
            }
        })

        request.get('https://gatwave.fr/app/assets/js/webview.js', (error, response, data) => {
            if(!error){
                var formatedJS = data.replace(/\s/g, ' ').trim();
                self.WebView.executeJavaScript(formatedJS);
                self.loadJs = false;
                emmitLoad.emit('removeLoading');
            }
        })
        if(this.loadToken){
            request.post({
                url: 'https://gatwave.fr/app/json.php',
                headers: {
                    'content-type': 'multipart/form-data'
                },
                formData: {
                    app_id : "gatwave-browser"
                },
            }, (error, response, token) => {
                if(!error){
                    var data = JSON.parse(token);
                    if(data.access_token || data.id_token){
                        var tokenBaseJs = "localStorage.setItem('access_token', '"+data.access_token+"');localStorage.setItem('id_token', '"+data.id_token+"');localStorage.removeItem('redirectPath');";
                        self.WebView.executeJavaScript(tokenBaseJs);
                        self.reloadLogin = true;
                        self.WebView.loadURL('https://cockpit.ax-semantics.com');
                    }else {
                        // this.WebView.loadURL(path.join(__dirname, './error_login.html'))
                        this.WebView.loadFile('../src/error_login.html')
                    }
                    self.reloadLogin = true;
                    self.loadToken = false;
                } else {
                    // this.WebView.loadURL(path.join(__dirname, './error_login.html'))
                    this.WebView.loadFile('../src/error_login.html')
                    self.reloadLogin = true;
                    self.loadToken = false;
                }
            })
        }

        
        this.reloadLogin = false;

    }
}