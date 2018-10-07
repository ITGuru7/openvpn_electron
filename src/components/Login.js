'use strict';
const request = require('request');
const path = require('path');
const {ipcRenderer} = require('electron')
const storage = require('electron-json-storage');

storage.has('ACCOUNT', function(error, hasKey) {
    if (hasKey) {
        storage.get('ACCOUNT', function(error, data) {
            document.getElementById("username").value = data.username;
            document.getElementById("password").value = data.password
        });
        
    }
});

class Login {
    constructor(username, password){
        this.username = username;
        this.password = password;
        this.getOVPN();
    }

    getOVPN(){
        if(this.username == "" || this.passowrd == "") {
            alert('Please enter username and password!')
        }

        storage.set('ACCOUNT', { username: this.username, password: this.password }, function(error) {
            if (error) throw error;
        });

        document.getElementById("message").innerHTML = "";
        request.post({
            url: 'https://gatwave.fr/app/login.php',
            headers: {
                'content-type': 'multipart/form-data'
            },
            formData: {
                username : this.username,
                password : this.password
            },
        }, (error, response, json) => {
            if(!error){
                const url = JSON.parse(json);
                console.log(url);
                if(url && url.data) {
                    ipcRenderer.send('download', url.data)
                }else {
                    document.getElementById("shake").classList.toggle("shake")
                    setTimeout(function(){
                        document.getElementById("shake").classList.toggle("shake")
                    }, 500)
                }
            } else {
                document.getElementById("shake").classList.toggle("shake")
                setTimeout(function(){
                    document.getElementById("shake").classList.toggle("shake")
                }, 500)
            }
        })
    }
}
