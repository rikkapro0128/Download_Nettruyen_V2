import axios from "axios";
import fs from "fs";
import cheerio from "cheerio";
import { resolve } from "path";
import { throws } from "assert";
import { Stream } from "stream";

const urlDemo = 'http://www.nettruyengo.com/truyen-tranh/nai-ba-la-chien-than-manh-nhat-43048';

function removeAccents(str) {
  /*
    handle string vietnamese to no character special
  */ 
  return String(str).normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

async function download(url, folder) {
  /*
    handle request to image and download this image
    and save image depend on by url and folder 
  */ 
  return new Promise(async (resolve, reject) => {
    await axios({
      method: 'get',
      url,
      responseType: 'stream',
      headers: {
        'Referer': 'http://www.nettruyengo.com/' // tag header important to void reuest failure (403)
      }
    })
    .then(function (response) {
      response.data.pipe( // create pipe to writeable
        fs.createWriteStream(`${folder}/${Date.now()}.jpg`)
        .on('error', function (err) {
          this.close();
          reject(err);
        })
        .on('close', function () {
          resolve(true);
        })
      )
    })
    .catch(function (error) {
      // handle error
      reject(error);
    })
  })
}

function readFile(callback) {
  /*
    function handle read file contain information manga
  */
  let obj = JSON.parse(fs.readFileSync('./demo.json', 'utf8')); // read file from path
  console.log('<<< START DOWNLOAD >>>!');
  callback(obj); // callback hanlde loop chapter and image to download 
}

function createFolder(path) {
  /*
    Create folder by path
  */
  if(!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
    return path;
  }else {
    console.log('Don\'t need create folder, because duplicate name...!\nEXIT!');
    return false;
  }
}

async function handleOBJ(target) {
  /*
    function handle Object of target to download from website
  */
  const rootFolder = 'E:/' + removeAccents(target.name); // declare root folder t storage image and more information
  const pathByName = createFolder(rootFolder);  // create root folder
  if(!pathByName) { return; }
  for (let index = 0; index < target.data.length; index++) { // loop chapter
    const element = target.data[index];
    const pathByChapter = createFolder(pathByName + '/' + element.chapter); // create folder for one chapter
    if(!pathByChapter) { return; }
    for await(const url of element.images) { // loop for images for one chapter
      const newURL = new RegExp('https:|http:', 'g').test(url) ? url : `http:${url}`;
      try {
        await download(newURL, pathByChapter)
      } catch (error) {
        // catch error is has and log terminal url error when node crawl
        console.log(`<<< ERROR URL: ${newURL} >>>`);
        continue;
      }
    }
    console.log(`<<< DONE: ${element.chapter} >>>`);
  }
}

function analysisURL(URL) {
  return new Promise(async (resolve, reject) => {
    await axios.get(URL, {
      headers: {
        'Referer': 'http://www.nettruyengo.com/' // tag header important to void reuest failure (403)
      },
      responseType: 'document',
    })
    .then((response) => {
      resolve(response.data)
    })
    .catch((error) => {
      reject({ code: error.response.status, message: error.response.statusText });
    })
  })
}

function analysisDocumentToTarget(HTML) {
  return new Promise(async (resolve, reject) => {
    if(!HTML) { reject(new Error('No import HTML to Function')) }
    const $ = cheerio.load(HTML);
    const dataChapter = new Array();
    const nameManga = $('#item-detail > h1.title-detail').text() || 'NO-NAME';
    const nameOther = $('.detail-info .list-info .other-name').text() || 'NO-NAME-OTHER';
    const cover = $('.detail-info .col-image img').attr('src') || 'NO-COVER';
    const desc = $('.detail-content p').text();
    let author = $('.detail-info .list-info .author .col-xs-8 a').map(function (i, el) { return $(this).text() }).toArray();
    let genres = $('.detail-info .list-info .kind .col-xs-8 a').map(function (i, el) { return $(this).text() }).toArray();
    author = author.length ? author : 'NO-AUTHOR';
    genres = genres.length ? genres : 'NO-GENRES';
    const listChapterElement = $('.list-chapter li.row').not('.heading');
    listChapterElement.each(function(i, element) {
      const title = cheerio.load(element)('div.chapter a').text();
      const number_chapter = /[C|c]hapter \d*\.?\d*/g.exec(String(title));
      const title_chapter = String(title).split(String(number_chapter[0]))[1].split(':')[1] || 'NO-TITLE-CHAPTER';
      const linkChapter = cheerio.load(element)('div.chapter a').attr('href');
      this.push({ chapter: number_chapter[0], link: linkChapter, title: title_chapter });
    }.bind(dataChapter))
    for (let [index, chapter] of dataChapter.entries()) {
      const loadDOM = cheerio.load(await analysisURL(chapter.link));
      const allImages = loadDOM('.page-chapter img[data-index]').map(function (i, el) { return $(this).attr('src') }).toArray();
      dataChapter[index].images = allImages;
    }
    resolve({ nameManga, nameOther, author, genres, desc, cover, data: dataChapter });
  })
}

// readFile(handleOBJ);
(async () => {
  try {
    console.time('CRAWL TOTAL TIME');
    const document = await analysisURL(urlDemo);
    const target = JSON.stringify(await analysisDocumentToTarget(document));
    fs.writeFile(`./${Date.now()}.json`, target, { encoding: 'utf8', mode: 777 }, function() {
      console.log('<<< CRAWL DONE >>>')
    });
    console.timeEnd('CRAWL TOTAL TIME');
  } catch (error) {
    console.log(error);
  }
})()
