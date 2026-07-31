import { copyFileSync } from 'node:fs';

copyFileSync('REPLY/REPLY_HTML.html', 'REPLY/REPLY_HTML.txt');
console.log('REPLY/REPLY_HTML.html -> REPLY/REPLY_HTML.txt synced');
