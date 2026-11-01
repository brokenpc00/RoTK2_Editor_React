# 테스트

앱은 계속 `index.html` 한 파일로 실행하며 테스트 의존성은 개발할 때만 사용한다.

Node.js 26.x와 pnpm 11.25.0에서:

```sh
pnpm install
pnpm exec playwright install chromium
pnpm test
```

- `pnpm test` / `npm test`: Jest 단위 테스트와 Playwright UI 테스트 전체.
- `pnpm run test:unit` / `npm run test:unit`: Jest만 실행.
- `pnpm run test:ui` / `npm run test:ui`: Playwright만 실행.

UI 테스트는 `127.0.0.1:8764`에 격리 서버를 자동으로 시작하고 종료한다. 이 포트가 비어 있어야 한다. 실제 게임 파일 대신 합성 세이브·리소스를 사용한다.

키보드 이동·편집·취소, 스크롤·포커스 유지, 정렬 방향, 정렬 후 실제 다운로드 바이트, 얼굴 표시, Lands·Taiki의 공통 편집과 저장을 확인한다. 실패 화면은 `test/.results/`에 남는다.

군주 변경은 중간·처음·끝·혼자 있는 장수, 재야·미발견 목록, 연결되지 않은 장수, 같은 목록 안의 이동, Rulers 번호와 장수 번호가 다른 군주, 신군주를 검증한다. 실패 시 일부 값만 바뀌지 않는지와 저장·재독 후 주소·능력치가 유지되는지도 확인한다.
