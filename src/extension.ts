'use strict';

import * as vscode from 'vscode';
const win32 = process.platform === 'win32';
import * as child_process from 'child_process';
import * as fs from 'fs';

function showWarningMessage(message) {
    vscode.window.showWarningMessage(message);
}

function getAePath() {
    return new Promise((resolve, reject) => {
        if (win32) {
            const ps = child_process.spawn('powershell.exe', ['-Command', `(Get-WmiObject -class Win32_Process -Filter 'Name="AfterFX.exe"').path`]);
            let output = '';

            ps.stdout.on('data', (chunk => {
                output += chunk.toString();
            }));

            ps.on('exit', () => {
                const aePaths: string[] = [];
                for (let aePath of output.split(/\r\n|\r|\n/)) {
                    if (aePath) {
                        aePaths.push(aePath);
                    }
                }
                if (aePaths.length) {
                    resolve(aePaths[0]);
                } else {
                    reject('Please launch After Effects.');
                }
            });

            ps.on('error', (err) => {
                reject(err);
            });

            ps.stdin.end();
        } else {
            reject(`This OS isn't supported.`);
        }
    });
}

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('atarabi.runAeScript', () => {
        getAePath().then((aePath: string) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const document = editor.document;
            const fileName = document.fileName;
            if (fs.existsSync(fileName)) {
                aePath = aePath.indexOf(' ') === -1 ? aePath : `"${aePath}"`;
                child_process.exec(`${aePath} -r ${fileName}`, () => {});
            } else {
                throw 'Please save the file.';
            }
        }).catch(err => {
            showWarningMessage(err);
        });
    });

    context.subscriptions.push(disposable);
}