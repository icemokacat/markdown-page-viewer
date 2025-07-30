# markdown-page-viewer

###


### install (최초 한번 실행)

- `npm install`

### build (typescript)

- `npm run build`

### 환경설정 (.env)

`.env-example` 파일을 복사하여 `.env` 파일로 copy

`PORT` : 이 프로젝트가 실행되는 port 입니다.
`APIURL` : markdown 데이터를 반환해주는 API 의 주소입니다.

### run (local)

- `npm run dev`

- 소스 수정시 자동 반영

### run (product)

- `npm run start`

### pm2 사용시 프로젝트 루트 폴더에서

- `pm2 start npm --name "bruno-viewer" -- start --watch`



