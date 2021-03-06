const {app, BrowserWindow, ipcMain, remote} = require('electron');
const path = require('path');
const request = require('request');
const { spawn , spawnSync, exec} = require('child_process');
const os = require('os');
const {download} = require('electron-dl');
const fs = require('fs');
const md5 = require('md5');


let win;
let openvpn;


class Main{
    constructor(){

        app.setAccessibilitySupportEnabled(true)
        
        app.on('ready', this.createWindow.bind(this));

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (win === null) {
                createWindow();
            }
        });

        ipcMain.on('download', (e, args) => {
            const self = this;
            try {
                fs.unlinkSync(path.join(__dirname, '/../bin/config.ovpn').replace('app.asar', ''));
            }catch(err) {
                // console.log(err)
            }finally{
                download(BrowserWindow.getFocusedWindow(), args, {
                    directory: path.join(__dirname, '/../bin/').replace('app.asar', ''),
                    filename: "config.ovpn"
                }).then(dl => self.startOVPN()).catch(console.error);
            }
            
        });
        
    }

    createWindow() {
        win = new BrowserWindow({width: 1280, height: 720});
        win.setMenuBarVisibility(false);
        // win.openDevTools();

        // win.loadURL(path.join(__dirname, './login.html'));
        win.loadFile('./src/login.html');

        win.on('close', () => {
                console.log('quit')
                const ses = win.webContents.session;
                ses.clearStorageData();

        })

        win.on('closed', () => {
            win = null;
        });
    };
    

    async startOVPN(){
        let command = '';
        const platform = os.platform();
        const arch = os.arch();
        const self = this;

        if(platform == 'win32'){        // win
            const configOVPN = path.join(__dirname, '/../bin/config.ovpn').replace('app.asar', '');
            if(arch == 'x64') {
                command = path.join(__dirname  ,'/../bin/win32-x64/openvpn.exe');
                command = command.replace('app.asar', '');
            }else if(arch == 'x32' || arch == 'x86') {
                command = path.join(__dirname , '/../bin/win32-x32/openvpn.exe');
                command = command.replace('app.asar', '');
            } else {
                app.quit();
            }

            exec('NET SESSION', function(err,so,se) {
                if(se.length !== 0){
                    // win.loadURL(path.join(__dirname, './error_admin.html'));
                    win.loadFile('./src/error_admin.html');
                    return 0;
                }
            });
            
            // win.loadURL(path.join(__dirname, './open.html'));
            win.loadFile('./src/open.html');
            
    
            openvpn = spawn(command, ['--config', configOVPN], {
                windowsHide: true,
            });
    
            openvpn.stdout.on('data', (data) => {
                win.webContents.executeJavaScript('var vpn_status = document.getElementById("vpn-status");vpn_status.value += `\\r\\n'+data.toString()+'`;vpn_status.scrollTop = vpn_status.scrollHeight;');
    
                if(data.toString().trim().includes('Initialization Sequence Completed')) {
                    request.get('https://api.ipify.org?format=json', (error,response,data) => {
                        if(!error) {
                            var ip = JSON.parse(data);
                            if(ip.ip == '31.220.45.81'){
                                
                                // win.loadURL(path.join(__dirname, './index.html'));
                                win.loadFile('./src/index.html');
                            } else {
                                // win.loadURL(path.join(__dirname, './error_vpn.html'));
                                win.loadFile('./src/error_vpn.html');
                            }
                        }
                    })
                }
            });
            
            openvpn.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
                app.quit();
            });
              
            openvpn.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                // app.quit();
            });
        } else if(platform == 'darwin') {       // mac
            const configOVPN = path.join(__dirname, '/../bin/config.ovpn').replace('app.asar', '');
            const stdout = path.join(__dirname, '/../bin/output.log').replace('app.asar', '');
            if(arch == 'x64') {
                // command = './bin/mac/x64/openvpn/2.4.6/sbin/openvpn';
                command = path.join(__dirname  ,'/../bin/mac/x64/openvpn/2.4.6/sbin/openvpn');
                command = command.replace('app.asar', '');
            } else if(arch == 'x32' || arch == 'x86') {
                command = path.join(__dirname  ,'/../bin/mac/x32/openvpn/2.4.6/sbin/openvpn');
                command = command.replace('app.asar', '');
            } else {
                app.quit();
            }

            // win.loadURL(path.join(__dirname, './open.html'));
            win.loadFile('./src/open.html');


            var sudo = require('sudo-prompt');
            exec('sudo -k', () => {
                command = [command, '--config', configOVPN, '>', stdout].join(' ');
                // console.log(command);

                sudo.exec(command, {name: 'OpenVPN client'},
                    function(error, stdout, stderr) {
                        console.log('error: ' + error);
                        console.log('stdout: ' + JSON.stringify(stdout));
                        console.log('stderr: ' + JSON.stringify(stderr));
                        kill(
                            function() {
                            if (error) throw error;
                            if (stdout !== expected) {
                                throw new Error('stdout != ' + JSON.stringify(expected));
                            }
                            if (stderr !== "") throw new Error('stderr != ""');
                                console.log('OK');
                            }
                        );
                    }
                );
            });

            require('log-timestamp');

            fs.watchFile(stdout, { interval: 500 }, (curr, prev) => {
                fs.readFile(stdout, 'utf8', function(error, data){

                    win.webContents.executeJavaScript('var vpn_status = document.getElementById("vpn-status");vpn_status.value = `'+data.toString()+'`;vpn_status.scrollTop = vpn_status.scrollHeight;');

                    if(data.toString().trim().includes('Initialization Sequence Completed')) {
                        request.get('https://api.ipify.org?format=json', (error,response,data) => {
                            if(!error) {
                                var ip = JSON.parse(data);
                                if(ip.ip == '31.220.45.81'){
                                    
                                    // win.loadURL(path.join(__dirname, './index.html'));
                                    win.loadFile('./src/index.html');
                                } else {
                                    // win.loadURL(path.join(__dirname, './error_vpn.html'));
                                    win.loadFile('./src/error_vpn.html');
                                }
                            }
                        })
                    }
                });
            });

        }
    }
}




app.BrowserMain = module.exports = new Main();