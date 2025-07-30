var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import express from 'express';
// dotenv를 사용하여 환경변수를 사용한다.
import dotenv from 'dotenv';
import path from 'path';
//import { fileURLToPath } from 'url';
//import { dirname } from 'path';
// api
import router from './router/api.js';
import { fileURLToPath } from 'url';
// http request
import { getDirectoryInfo, getMarkdownData } from './api/apiFunc.js';
// puppeteer
import puppeteer from 'puppeteer';
const app = express();
app.use(express.json());
app.use('/api', router);
// env 파일에서 포트를 가져온다.
const PORT = (_b = (_a = dotenv.config().parsed) === null || _a === void 0 ? void 0 : _a.PORT) !== null && _b !== void 0 ? _b : 3000;
const __dirname = fileURLToPath(new URL(".", import.meta.url));
// public 에서 정적 파일을 가져온다.
const pbpath = path.join(__dirname, "..", 'public');
app.use('/public', express.static(pbpath));
// 화면 엔진은 ejs를 사용한다.
// 실제로는 __dirname 의 상위폴더 아래에 views 폴더가 있으므로 수정
// e.g. "D:\project\markdown-page-viewer\src\ts\" + "views"
// 하지만 __dirname 은 "D:\project\markdown-page-viewer\src\ts" 이므로
// 실제 views 폴더 위치는 "D:\project\markdown-page-viewer\src\views" 이다.
// ts 가 아닌 상위 폴더의 views 폴더를 사용하기 위해 __dirname 을 수정한다.
const viewpath = path.join(__dirname, '..', 'views');
app.set('views', viewpath);
app.set('view engine', 'ejs');
// home
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [DirectoryInfoResponse] = yield Promise.all([
        getDirectoryInfo()
    ]);
    const isBruFile = false;
    const relativePath = '';
    let directoryInfo;
    let navHtml = "";
    if (DirectoryInfoResponse) {
        // create navHtml
        directoryInfo = DirectoryInfoResponse.data;
        if (directoryInfo) {
            navHtml = generateNavHtml(directoryInfo, isBruFile, relativePath);
        }
        else {
            console.error("directoryInfo is null");
        }
    }
    else {
        console.error("DirectoryInfoResponse is null");
    }
    res.render('home', { navHtml: navHtml });
}));
// list
app.get('/page/**', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const relativePath = req.url.replace('/page/', '');
    //console.log("URI REQ:"+relativePath);
    let isBruFile = false;
    // .bru 요청인지 확인
    if (relativePath.endsWith('.bru')) {
        isBruFile = true;
    }
    let directoryInfo;
    let navHtml = "";
    let markdownData = "";
    try {
        const [DirectoryInfoResponse, BrunoDataResponse] = yield Promise.all([
            getDirectoryInfo(),
            getMarkdownData(relativePath)
        ]);
        if (DirectoryInfoResponse) {
            // create navHtml
            directoryInfo = DirectoryInfoResponse.data;
            if (directoryInfo) {
                navHtml = generateNavHtml(directoryInfo, isBruFile, relativePath);
            }
            else {
                console.error("directoryInfo is null");
            }
        }
        else {
            console.error("DirectoryInfoResponse is null");
        }
        if (BrunoDataResponse) {
            markdownData = BrunoDataResponse.data;
        }
        else {
            console.error("BrunoDataResponse is null");
        }
        res.render('markdown', { navHtml, markdownData });
    }
    catch (e) {
        console.error(e);
        res.render('markdown', { navHtml: "", markdownData: "" });
    }
}));
const serverDomain = 'http://localhost:' + PORT;
app.post('/download-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { html } = req.body; // Receive the <article> content as HTML
        const browser = yield puppeteer.launch();
        const page = yield browser.newPage();
        page.on('request', (request) => {
            console.log('Requesting:', request.url());
        });
        page.on('response', (response) => {
            console.log('Response:', response.url(), response.status());
        });
        //<link rel="stylesheet" href='${serverDomain}/public/css/pdf.css'>
        // Inject the link to the external CSS file
        const fullHtml = `
        <html>
          <head>
            <link rel="stylesheet" href="${serverDomain}/public/css/github-markdown-min.css">
            <link rel="stylesheet" href="${serverDomain}/public/css/pdf.css">
          </head>
          <body>
            ${html}
          </body>
        </html>
        `;
        //await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
        yield page.setContent(fullHtml, { waitUntil: 'networkidle2' });
        // Generate the PDF
        const pdfBuffer = yield page.pdf({
            format: 'A4',
            printBackground: true, // Ensure background styles are applied
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm',
            },
        });
        yield browser.close();
        // Send the PDF back to the client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="article.pdf"',
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer); // Send the PDF file as binary
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
}));
function generateNavHtml(directoryInfo, isBruFile, relativePath) {
    let navHtml = "";
    directoryInfo.forEach((item) => {
        //console.log(item)
        if (item.isBru) {
            navHtml += "<li class='docs'>";
            if (isBruFile && item.directoryPath === relativePath) {
                // .bru 파일 요청한거면 relativePath 와 item.directoryPath 가 같으면 현재 페이지이므로 active 클래스 추가
                navHtml += "<a class='active' href='/page/" + item.directoryPath + "'>" + item.directoryName + "</a>";
            }
            else {
                navHtml += "<a href='/page/" + item.directoryPath + "'>" + item.directoryName + "</a>";
            }
            navHtml += "</li>";
        }
        else {
            navHtml += "<li class='folder'>";
            // 디렉토리는 클릭시 하위 디렉토리를 보여주기만 하면 되므로 href 는 필요없다.
            navHtml += "<a href='javascript:void(0)'>" + item.directoryName + "</a>";
            //console.log(item.subDirectoryList)
            if (item.subDirectoryList != null) {
                navHtml += generateSubDirectoryHtml(item.subDirectoryList, isBruFile, relativePath);
            }
            navHtml += "</li>";
        }
    });
    return navHtml;
}
function generateSubDirectoryHtml(subDirectoryList, isBruFile, relativePath) {
    let subDirectoryHtml = "";
    subDirectoryHtml += "<ul class='submenu'>";
    subDirectoryList.forEach((subDirectory) => {
        //console.log(subDirectory);
        if (subDirectory.isBru) {
            subDirectoryHtml += "<li class='docs'>";
            const uriEncodedPath = encodeURI(subDirectory.directoryPath);
            if (isBruFile && uriEncodedPath === relativePath) {
                // .bru 파일 요청한거면 relativePath 와 item.directoryPath 가 같으면 현재 페이지이므로 active 클래스 추가
                subDirectoryHtml += "<a class='active' href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            }
            else {
                subDirectoryHtml += "<a href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            }
            subDirectoryHtml += "</li>";
        }
        else {
            subDirectoryHtml += "<li class='folder'>";
            //subDirectoryHtml += "<a href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            // 디렉토리는 클릭시 하위 디렉토리를 보여주기만 하면 되므로 href 는 필요없다. 
            subDirectoryHtml += "<a href='javascript:void(0)'>" + subDirectory.directoryName + "</a>";
            if (subDirectory.subDirectoryList) {
                subDirectoryHtml += generateSubDirectoryHtml(subDirectory.subDirectoryList, isBruFile, relativePath);
            }
            subDirectoryHtml += "</li>";
        }
    });
    subDirectoryHtml += "</ul>";
    return subDirectoryHtml;
}
// server 시작시 실행할 함수
const handleListen = () => {
    console.log(`Server is running on http://localhost:${PORT}`);
};
// 지정된 포트로 서버를 열어준다.
app.listen(PORT, handleListen);
