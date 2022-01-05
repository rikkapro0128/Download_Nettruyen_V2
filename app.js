import fs from 'fs';
import {
  handleOBJ,
  analysisURL,
  removeAccents,
  analysisDocumentToTarget,
} from './helper.js';

const urlDemo = 'http://www.nettruyengo.com/truyen-tranh/co-nang-cuong-tinh-nanase-55854';

(async () => {
  const rootPath = 'E:/';
  const nameSaveTarget = 'information';
  try {
    console.time('>>> CRAWL TOTAL TIME');
    console.time('>>> DOWNLOAD TOTAL TIME');
    console.log('>>> Crawling from website...');
    const document = await analysisURL(urlDemo);
    const target = await analysisDocumentToTarget(document);
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
  } catch (error) {
    console.log(error);
  }
})()
