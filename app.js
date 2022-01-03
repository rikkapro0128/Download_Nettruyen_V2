import axios from "axios";
import fs from "fs";

function removeAccents(str) {
  return String(str).normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

async function download(url, folder) {
  const writer = fs.createWriteStream(`${folder}/${Date.now()}.jpg`)
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url,
      responseType: 'stream',
      headers: {
        'Referer': 'http://www.nettruyengo.com/'
      }
    })
    .then(function (response) {
      response.data.pipe(writer)
      writer.on('error', function (err) {
        writer.close();
        reject(err);
      })
      writer.on('close', function () {
        resolve(true);
      })
    });
  })
}

function readFile(callback) {
  console.log('Reading file...!');
  let obj = JSON.parse(fs.readFileSync('./demo.json', 'utf8'));
  console.log('Done read this file...!');
  console.log('Downloading...!');
  callback(obj);
}

function createFolder(path) {
  console.log('Create folder...!');
  if(!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
    console.log(`Done create folder by path: '${path}'`);
    return path;
  }else {
    console.log('Don\'t need create folder, because duplicate name...!\nEXIT!');
    return false;
  }
}

async function handleOBj(obj) {
  const rootFolder = './' + removeAccents(obj.name);
  const pathByName = createFolder(rootFolder);
  if(!pathByName) { return; }
  for (let index = 0; index < obj.data.length; index++) {
    const element = obj.data[index];
    const pathByChapter = createFolder(pathByName + '/' + element.chapter);
    if(!pathByChapter) { return; }
    for await(const url of element.images) {
      await download('http:' + url, pathByChapter);
    }
    console.log('Done ==> ' + element.chapter);
  }
}

readFile(handleOBj);
