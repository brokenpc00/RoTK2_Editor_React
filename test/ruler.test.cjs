const { makeLinkedSave, loadFileApi } = require('./fixture.cjs')
const api = loadFileApi()
let bytes, data
const officer = idx=>data.officers.find(o=>o.idx===idx)
const move = (idx, slot)=>api.changeOfficerRuler(data.officers, data.lands, data.rulers, idx, slot)
const list = (land, key='gov')=>Array.from(api.getOfficerLists(data.officers, data.lands).find(l=>l.land.idx===land && l.key===key).rows, o=>o.idx)
const saved = ()=>Buffer.from(api.buildSaveFile(new Uint8Array(bytes), data.officers, data.lands))

beforeEach(()=>{
    bytes = makeLinkedSave()
    data = api.parseSaveFile(bytes)
})

test('중간 장수를 군주가 실제 있는 땅의 끝으로 옮기고 모든 자동 값을 설정한다', ()=>{
    move(41, 9)
    expect(list(4)).toEqual([2, 42])
    expect(list(10)).toEqual([9, 47, 53, 78, 41])
    expect(list(11)).toEqual([16, 83, 110])
    expect(list(12)).toEqual([17, 68, 94])
    const expected = { rulerNum: 8, loyalty: 100, army: 10000, weapon: 10000, train: 100, syn: 60, family: 9, nextOfficer: 0 }
    for (const [key, value] of Object.entries(expected)) expect(officer(41)[key].value).toBe(value)

    // 변경할 바이트만 직접 만들어 연결 주소 변환까지 확인한다.
    const out = Buffer.from(bytes)
    out.writeUInt16LE(88+41*36, 32+36)
    out.writeUInt16LE(88+40*36, 32+77*36)
    const base = 32+40*36
    out.writeUInt16LE(0, base)
    out[base+10] = 8
    out[base+11] = 100
    out[base+15] = 60
    out.writeUInt16LE(1 << 8, base+16)
    out.writeUInt16LE(10000, base+18)
    out.writeUInt16LE(10000, base+20)
    out[base+22] = 100
    expect(saved()).toEqual(out)
    expect(bytes).toEqual(makeLinkedSave())
    data = api.parseSaveFile(saved())
    expect(list(4)).toEqual([2, 42])
    expect(list(10)).toEqual([9, 47, 53, 78, 41])
})

test('맨뒤 장수를 옮기면 이전 장수가 목록의 끝이 된다', ()=>{
    move(42, 9)
    expect(list(4)).toEqual([2, 41])
    expect(officer(41).nextOfficer.value).toBe(0)
    expect(list(10)).toEqual([9, 47, 53, 78, 42])
    data = api.parseSaveFile(saved())
    expect(list(4)).toEqual([2, 41])
})

test('맨앞 장수를 옮기면 지역의 시작 주소를 다음 장수로 갱신한다', ()=>{
    move(16, 2)
    expect(list(11)).toEqual([83, 110])
    expect(list(4)).toEqual([2, 41, 42, 16])
    data = api.parseSaveFile(saved())
    expect(list(11)).toEqual([83, 110])
    expect(data.lands[10].gov.value).toBe(88+82*36)
})

test('혼자인 장수를 옮기면 기존 목록은 비워진다', ()=>{
    move(104, 2)
    expect(list(16)).toEqual([])
    expect(list(4)).toEqual([2, 41, 42, 104])
    data = api.parseSaveFile(saved())
    expect(data.lands[15].gov.value).toBe(0)
})

test.each([[100, 13, 'freeAgent', 101], [102, 14, 'hideAgent', 103]])('재야·미발견 목록의 첫 장수 %i도 연결을 갱신한다', (idx, land, key, next)=>{
    move(idx, 2)
    expect(list(land, key)).toEqual([next])
    data = api.parseSaveFile(saved())
    expect(list(land, key)).toEqual([next])
    expect(list(4).at(-1)).toBe(idx)
})

test('기존 목록에 없는 장수는 연결 해제를 건너뛰고 추가한다', ()=>{
    move(120, 2)
    expect(list(4)).toEqual([2, 41, 42, 120])
})

test('군주의 장수 번호가 Rulers 번호와 달라도 올바른 군주·Family를 설정한다', ()=>{
    move(41, 4)
    expect(list(15)).toEqual([80, 81, 41])
    expect(officer(41).rulerNum.value).toBe(3)
    expect(officer(41).family.value).toBe(4)
    expect(officer(41).syn.value).toBe(77)
})

test('1번 군주를 선택하면 파일의 군주 번호 0과 Family 1을 사용한다', ()=>{
    move(41, 1)
    expect(list(5)).toEqual([1, 30, 41])
    expect(officer(41).rulerNum.value).toBe(0)
    expect(officer(41).family.value).toBe(1)
    data = api.parseSaveFile(saved())
    expect(officer(41).rulerNum.value).toBe(0)
    expect(officer(41).family.value).toBe(1)
})

test('16번 신군주의 번호는 254로 표시하고 파일에는 15로 저장한다', ()=>{
    move(41, 16)
    expect(list(20)).toEqual([255, 254, 41])
    expect(officer(41).rulerNum.value).toBe(254)
    expect(officer(41).family.value).toBe(16)
    expect(officer(41).syn.value).toBe(91)
    const out = saved()
    expect(out[32+40*36+10]).toBe(15)
    expect(out.readUInt16LE(32+40*36+16)).toBe(0x8000)
    data = api.parseSaveFile(out)
    expect(list(20)).toEqual([255, 254, 41])
})

test('군주를 그대로 선택하면 값과 연결을 바꾸지 않는다', ()=>{
    move(41, 2)
    expect(saved()).toEqual(bytes)
})

test('같은 목록 안에서 소속만 다른 장수를 이동해도 순환이 생기지 않는다', ()=>{
    officer(41).rulerNum.value = 8
    move(41, 2)
    expect(list(4)).toEqual([2, 42, 41])
})

test.each(['cycle', 'missing ruler land', 'duplicate', 'ruler himself', 'inactive ruler'])('실패하면 일부 값만 변경하지 않는다: %s', reason=>{
    if (reason==='cycle') officer(42).nextOfficer.value = 41
    if (reason==='missing ruler land') data.lands[9].gov.value = 0
    if (reason==='duplicate') data.lands[10].gov.value = 88+40*36
    const before = JSON.stringify(data)
    expect(()=>move(reason==='ruler himself' ? 2 : 41, reason==='inactive ruler' ? 3 : 9)).toThrow()
    expect(JSON.stringify(data)).toBe(before)
})
