'use strict';

class Bar {
    constructor(){
        this.Root = document.getElementById('bar');
        this.Back = document.getElementById('back');
        this.Forward = document.getElementById('forward');
        this.Refresh = document.getElementById('refresh');
        this.Stop = document.getElementById('stop');
        this.Notice = document.getElementById('notice');



        this.Back.addEventListener('click', () => {
            Main.WebView.goBack();
        });

        this.Forward.addEventListener('click', () => {
            Main.WebView.goForward();
        })

        this.Refresh.addEventListener('click', () => {
            Main.WebView.reload();
        })

        this.Stop.addEventListener('click', () => {
            Main.WebView.stop();
        })

    }
}