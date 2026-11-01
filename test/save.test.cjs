const { makeSave, makeTaiki, loadFileApi } = require('./fixture.cjs')
const api = loadFileApi()

test('정렬한 장수 목록으로 저장해도 수정하지 않은 파일은 바이트까지 같다', () => {
    const bytes = makeSave()
    const { officers, lands } = api.parseSaveFile(bytes)
    const sorted = [...officers].sort((a, b)=>b.int.value-a.int.value)
    expect(sorted[0].idx).not.toBe(officers[0].idx)
    expect(Buffer.from(api.buildSaveFile(bytes, sorted, lands))).toEqual(bytes)
    expect(officers[0].idx).toBe(1)
})

test('정렬 후 수정은 화면 행 번호 대신 원래 장수의 파일 위치에 기록한다', () => {
    const bytes = makeSave()
    const { officers, lands } = api.parseSaveFile(bytes)
    const sorted = [...officers].sort((a, b)=>b.war.value-a.war.value)
    const officer = sorted[0]
    officer.int.value = 211
    const expected = Buffer.from(bytes)
    expected[32+(officer.idx-1)*36+4] = 211
    expect(Buffer.from(api.buildSaveFile(bytes, sorted, lands))).toEqual(expected)
})

test('TAIKI 저장도 원래 장수의 바이트 위치를 유지한다', () => {
    const bytes = makeTaiki()
    const rows = api.parseTaikiFile(bytes)
    rows[39].born.value = 171
    const expected = Buffer.from(bytes)
    expected[6+39*39+28] = 171
    expect(Buffer.from(api.buildTaikiFile(bytes, rows))).toEqual(expected)
})
