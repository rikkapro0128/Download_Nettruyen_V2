import fs from 'fs';
// import { WebSocketServer } from 'ws';
import {
  handleOBJ,
  analysisURL,
  removeAccents,
  analysisDocumentToTarget,
} from './helper.js';

// const wss = new WebSocketServer({ port: 3300 });

const urlManga = 'http://www.nettruyengo.com/truyen-tranh/quai-vat-khong-ten-25197';

(async () => {
  const rootPath = 'E:/';
  const nameSaveTarget = 'information';
  try {
    console.time('>>> CRAWL TOTAL TIME');
    console.time('>>> DOWNLOAD TOTAL TIME');
    console.log('>>> Crawling from website...');
    const document = await analysisURL(urlManga);
    const target = await analysisDocumentToTarget(document);
    target.data = target.data.reverse();
    const parserTargetToJSON = JSON.stringify(target);
    console.timeEnd('>>> CRAWL TOTAL TIME');
    console.log('>>> Start download file...\n');
    console.log('>>> ---------------------- <<<\n');
    await handleOBJ(target, rootPath);
    const pathSaveFile = `${rootPath}${removeAccents(target.nameManga)}/${nameSaveTarget}`
    fs.mkdirSync(pathSaveFile, { recursive: true });
    fs.writeFileSync(`${pathSaveFile}/desc.json`, parserTargetToJSON, { mode: 777 });
    console.log('>>> Saved File!');
    console.timeEnd('>>> DOWNLOAD TOTAL TIME');
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
})()

// wss.on('connection', function connection(ws) {
//   console.log('>>> Client is has been connected!');
//   ws.on('message', async function(data) {
//     const { linkManga } = JSON.parse(data);
//     await downloadByURL(linkManga);
//   })
// });
