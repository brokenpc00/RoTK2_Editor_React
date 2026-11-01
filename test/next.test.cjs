const { makeLinkedSave, loadFileApi } = require('./fixture.cjs')
const api = loadFileApi()
let bytes, data
const officer = idx=>data.officers.find(o=>o.idx===idx)
const list = (land, key='gov')=>Array.from(api.getOfficerLists(data.officers, data.lands).find(l=>l.land.idx===land && l.key===key).rows, o=>o.idx)
const move = (idx, land, after)=>api.moveOfficerAfter(data.officers, data.lands, data.rulers, idx, land, after)
const saved = ()=>Buffer.from(api.buildSaveFile(new Uint8Array(bytes), data.officers, data.lands))

const expectOnlyLinksChanged = () => {
    const before = Buffer.from(bytes)
    const after = saved()
    for (let i=0; i<255; i++) {
        before.fill(0, 32+i*36, 34+i*36)
        after.fill(0, 32+i*36, 34+i*36)
    }
    for (let i=0; i<41; i++) {
        before.fill(0, 9874+i*35+2, 9874+i*35+8)
        after.fill(0, 9874+i*35+2, 9874+i*35+8)
    }
    expect(after).toEqual(before)
}

beforeEach(()=>{
    bytes = makeLinkedSave()
    data = api.parseSaveFile(bytes)
})

test('현재 소속 군주의 통치지역과 각 태수를 고른다', ()=>{
    const { territories } = api.getOfficerMoveOptions(data.officers, data.lands, data.rulers, 53)
    expect(Array.from(territories, l=>l.land.idx)).toEqual([10, 11, 12, 16])
    expect(Array.from(territories, l=>l.rows[0].idx)).toEqual([9, 16, 17, 104])
})

test('다른 통치지역의 태수 뒤에 넣고 링크 주소 외에는 바꾸지 않는다', ()=>{
    move(53, 11, 16)
    expect(list(10)).toEqual([9, 47, 78])
    expect(list(11)).toEqual([16, 53, 83, 110])
    const expected = Buffer.from(bytes)
    expected.writeUInt16LE(88+77*36, 32+46*36)
    expected.writeUInt16LE(88+82*36, 32+52*36)
    expected.writeUInt16LE(88+52*36, 32+15*36)
    expect(saved()).toEqual(expected)
    expectOnlyLinksChanged()
    data = api.parseSaveFile(saved())
    expect(list(10)).toEqual([9, 47, 78])
    expect(list(11)).toEqual([16, 53, 83, 110])
})

const chain = [9, 47, 53, 78]
const pairs = chain.flatMap(idx=>chain.filter(after=>after!==idx).map(after=>[idx, after]))
test.each(pairs)('같은 목록의 %i번을 %i번 뒤에 넣어도 순환·누락이 없다', (idx, after)=>{
    const expected = chain.filter(n=>n!==idx)
    expected.splice(expected.indexOf(after)+1, 0, idx)
    move(idx, 10, after)
    expect(list(10)).toEqual(expected)
    expectOnlyLinksChanged()
    data = api.parseSaveFile(saved())
    expect(list(10)).toEqual(expected)
})

test('이미 선택한 장수 바로 뒤에 있으면 저장 파일이 그대로다', ()=>{
    move(53, 10, 47)
    expect(saved()).toEqual(bytes)
})

test('맨앞 장수의 이전 지역 시작 주소를 갱신하고 목적지 끝에 넣는다', ()=>{
    move(16, 10, 78)
    expect(list(11)).toEqual([83, 110])
    expect(list(10)).toEqual([9, 47, 53, 78, 16])
    expectOnlyLinksChanged()
    data = api.parseSaveFile(saved())
    expect(data.lands[10].gov.value).toBe(88+82*36)
})

test('혼자 있는 장수의 이전 목록은 빈 목록이 된다', ()=>{
    move(104, 11, 83)
    expect(list(16)).toEqual([])
    expect(list(11)).toEqual([16, 83, 104, 110])
    expectOnlyLinksChanged()
})

test('군주 본인도 같은 소속의 다른 지역으로 링크만 옮길 수 있다', ()=>{
    move(9, 12, 17)
    expect(list(10)).toEqual([47, 53, 78])
    expect(list(12)).toEqual([17, 9, 68, 94])
    expectOnlyLinksChanged()
})

test.each([[100, 13, 'freeAgent', 101], [102, 14, 'hideAgent', 103]])('소속이 있는 재야·미발견 장수 %i의 기존 시작 주소를 갱신한다', (idx, land, key, next)=>{
    bytes[32+(idx-1)*36+10] = 8
    data = api.parseSaveFile(bytes)
    move(idx, 11, 16)
    expect(list(land, key)).toEqual([next])
    expect(list(11)).toEqual([16, idx, 83, 110])
    expectOnlyLinksChanged()
})

test('어떤 목록에도 없는 장수는 연결 해제를 건너뛰고 넣는다', ()=>{
    bytes[32+119*36+10] = 8
    data = api.parseSaveFile(bytes)
    move(120, 11, 16)
    expect(list(11)).toEqual([16, 120, 83, 110])
    expectOnlyLinksChanged()
})

test('신군주의 254번 표시를 지역의 15번 소속과 맞춘다', ()=>{
    const options = api.getOfficerMoveOptions(data.officers, data.lands, data.rulers, 254)
    expect(Array.from(options.territories, l=>l.land.idx)).toEqual([20])
    move(255, 20, 254)
    expect(list(20)).toEqual([254, 255])
    expectOnlyLinksChanged()
})

test.each(['self', 'foreign land', 'wrong officer', 'cycle', 'duplicate source', 'duplicate target', 'no ruler'])('잘못된 선택은 값을 일부만 바꾸지 않는다: %s', reason=>{
    if (reason==='cycle') officer(78).nextOfficer.value = 9
    if (reason==='duplicate source') data.lands[15].gov.value = 88+52*36
    if (reason==='duplicate target') data.lands[15].gov.value = 88+15*36
    if (reason==='no ruler') officer(53).rulerNum.value = 255
    const before = JSON.stringify(data)
    const land = reason==='foreign land' ? 4 : 11
    const after = reason==='self' ? 53 : reason==='wrong officer' ? 17 : 16
    expect(()=>move(53, land, after)).toThrow()
    expect(JSON.stringify(data)).toBe(before)
})
