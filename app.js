import axios from "axios";
import fs from "fs";

async function download(url) {
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
      response.data.pipe(
        fs.createWriteStream(`${Date.now()}.jpg`)
        .on('finish', function (err) {
          resolve(true);
        })
        .on('error', function (err) {
          reject(err);
        })
      )
    });
  })
}

function readFile(callback) {
  let obj = JSON.parse(fs.readFileSync('./demo.json', 'utf8'));
  callback(obj);
}

async function handleOBj(obj) {
  for (let index = 0; index < obj.data.length; index++) {
    const element = obj.data[index];
    for await(const url of element.images) {
      await download('http:' + url);
    }
    console.log('Done ==> ' + obj.data[index].chapter);
  }
}

readFile(handleOBj);

// for (let index = 0; index < listURL.length; index++) {
//   const url = listURL[index];
//   download(url);
// }
