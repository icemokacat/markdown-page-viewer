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
import {getDirectoryInfo,getMarkdownData,DirectoryInfoResponse,BrunoDataResponse} from './api/apiFunc.js';

// puppeteer
import puppeteer from 'puppeteer';

const app = express();
app.use(express.json());
app.use('/api',router);


// env 파일에서 포트를 가져온다.
const PORT = dotenv.config().parsed?.PORT ?? 3000;

const __dirname = fileURLToPath(new URL(".", import.meta.url));  

// public 에서 정적 파일을 가져온다.
const pbpath    = path.join(__dirname,"..",'public');

app.use('/public',express.static(pbpath));

// 화면 엔진은 ejs를 사용한다.
// 실제로는 __dirname 의 상위폴더 아래에 views 폴더가 있으므로 수정
// e.g. "D:\project\markdown-page-viewer\src\ts\" + "views"
// 하지만 __dirname 은 "D:\project\markdown-page-viewer\src\ts" 이므로
// 실제 views 폴더 위치는 "D:\project\markdown-page-viewer\src\views" 이다.
// ts 가 아닌 상위 폴더의 views 폴더를 사용하기 위해 __dirname 을 수정한다.
const viewpath = path.join(__dirname,'..','views');
app.set('views', viewpath);
app.set('view engine','ejs');

// home
app.get('/', async (req, res) => {

    const[DirectoryInfoResponse] = await Promise.all([
        getDirectoryInfo()       
    ]);

    const isBruFile : boolean = false;
    const relativePath = '';

    let directoryInfo;
    let navHtml = "";

    if (DirectoryInfoResponse) {
        // create navHtml
        directoryInfo = DirectoryInfoResponse.data;
        if(directoryInfo) {
            navHtml = generateNavHtml(directoryInfo,isBruFile,relativePath);
        }else{
            console.error("directoryInfo is null");
        }
    }else{
        console.error("DirectoryInfoResponse is null");
    }

    res.render('home', {navHtml : navHtml});
});

// list
app.get('/page/**', async (req, res) => {
    const relativePath = req.url.replace('/page/','');
    //console.log("URI REQ:"+relativePath);

    let isBruFile : boolean = false;
    // .bru 요청인지 확인
    if(relativePath.endsWith('.bru')) {
        isBruFile = true;
    }

    let directoryInfo;
    let navHtml = "";
    let markdownData = "";
    try {
        const[DirectoryInfoResponse, BrunoDataResponse] = await Promise.all([
            getDirectoryInfo(), 
            getMarkdownData(relativePath)
        ]);

        if (DirectoryInfoResponse) {
            // create navHtml
            directoryInfo = DirectoryInfoResponse.data;
            if(directoryInfo) {
                navHtml = generateNavHtml(directoryInfo,isBruFile,relativePath);
            }else{
                console.error("directoryInfo is null");
            }
        }else{
            console.error("DirectoryInfoResponse is null");
        }

        if (BrunoDataResponse) {
            markdownData = BrunoDataResponse.data;
        }else{
            console.error("BrunoDataResponse is null");
        }

        res.render('markdown', {navHtml, markdownData});

    }catch(e) {
        console.error(e);
        res.render('markdown', {navHtml : "",markdownData : ""});
    }

});

const serverDomain = 'http://localhost:' + PORT;
app.post('/download-pdf', async (req, res) => {
    try {
        const { html } = req.body;  // Receive the <article> content as HTML
    
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

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
        await page.setContent(fullHtml, { waitUntil: 'networkidle2' });
    
        // Generate the PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true, // Ensure background styles are applied
          margin: {
            top: '10mm',
            bottom: '10mm',
            left: '10mm',
            right: '10mm',
          },
        });
    
        await browser.close();
    
        // Send the PDF back to the client
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="article.pdf"',
          'Content-Length': pdfBuffer.length,
        });
    
        res.end(pdfBuffer);  // Send the PDF file as binary
    
      } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
      }
});

function generateNavHtml(directoryInfo: any,isBruFile: boolean,relativePath: string) {
    let navHtml = "";
    directoryInfo.forEach((item: any) => {
        //console.log(item)
        if(item.isBru) {
            
            navHtml += "<li class='docs'>";

            if(isBruFile && item.directoryPath === relativePath) {
                // .bru 파일 요청한거면 relativePath 와 item.directoryPath 가 같으면 현재 페이지이므로 active 클래스 추가
                navHtml += "<a class='active' href='/page/" + item.directoryPath + "'>" + item.directoryName + "</a>";
            }else{
                navHtml += "<a href='/page/" + item.directoryPath + "'>" + item.directoryName + "</a>";
            }
            
            navHtml += "</li>";
        }else{
            navHtml += "<li class='folder'>";

            // 디렉토리는 클릭시 하위 디렉토리를 보여주기만 하면 되므로 href 는 필요없다.
            navHtml += "<a href='javascript:void(0)'>" + item.directoryName + "</a>";
            
            //console.log(item.subDirectoryList)
            if(item.subDirectoryList != null){
                navHtml += generateSubDirectoryHtml(item.subDirectoryList,isBruFile,relativePath);
            }            
            navHtml += "</li>";
        }
    });    
    return navHtml;
}

function generateSubDirectoryHtml(subDirectoryList: any,isBruFile: boolean,relativePath: string) {
    let subDirectoryHtml = "";

    subDirectoryHtml += "<ul class='submenu'>";

    subDirectoryList.forEach((subDirectory: any) => {
        //console.log(subDirectory);
        if(subDirectory.isBru) {
            subDirectoryHtml += "<li class='docs'>";

            const uriEncodedPath = encodeURI(subDirectory.directoryPath);

            if(isBruFile && uriEncodedPath === relativePath) {
                // .bru 파일 요청한거면 relativePath 와 item.directoryPath 가 같으면 현재 페이지이므로 active 클래스 추가
                subDirectoryHtml += "<a class='active' href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            }else{
                subDirectoryHtml += "<a href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            }
            
            subDirectoryHtml += "</li>";
        }else{
            subDirectoryHtml += "<li class='folder'>";
            //subDirectoryHtml += "<a href='/page/" + subDirectory.directoryPath + "'>" + subDirectory.directoryName + "</a>";
            // 디렉토리는 클릭시 하위 디렉토리를 보여주기만 하면 되므로 href 는 필요없다. 
            
            subDirectoryHtml += "<a href='javascript:void(0)'>" + subDirectory.directoryName + "</a>";

            if(subDirectory.subDirectoryList){
                subDirectoryHtml += generateSubDirectoryHtml(subDirectory.subDirectoryList,isBruFile,relativePath);
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
}

// 지정된 포트로 서버를 열어준다.
app.listen(PORT, handleListen);