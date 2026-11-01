const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const makeSave = () => {
    const bytes = Buffer.alloc(28960)
    bytes.write('1990.02.19')
    bytes.writeUInt16LE(190, 12)
    for (let i=0; i<255; i++) {
        const base = 32 + i*36
        bytes[base+4] = i*7%100
        bytes[base+5] = i*13%100
        bytes[base+6] = i*11%100
        bytes[base+10] = 255
        bytes[base+11] = i*3%100
        bytes[base+15] = i*5%100
        bytes.writeUInt16LE(1 << (i%16), base+16)
        bytes.writeUInt16LE(1000+i, base+18)
        bytes[base+25] = 170
        bytes[base+26] = i===5 ? 0 : 1
        bytes.write(`O${String(255-i).padStart(3, '0')}`, base+28)
    }
    return bytes
}

const makeTaiki = () => {
    const bytes = Buffer.alloc(6+39*60)
    bytes[0] = 60
    for (let i=0; i<60; i++) {
        const base = 6+i*39
        bytes[base+7] = 50
        bytes[base+28] = 170
        bytes[base+29] = 1
        bytes.write(`T${String(i+1).padStart(3, '0')}`, base+31)
    }
    return bytes
}

const makeLinkedSave = () => {
    const bytes = makeSave()
    const pointer = idx=>idx ? 88+(idx-1)*36 : 0
    const list = (land, key, ids, ruler=255) => {
        const offset = { gov: 2, freeAgent: 4, hideAgent: 6 }[key]
        bytes.writeUInt16LE(pointer(ids[0]), 9874+(land-1)*35+offset)
        for (let i=0; i<ids.length; i++) {
            bytes.writeUInt16LE(pointer(ids[i+1]), 32+(ids[i]-1)*36)
            bytes[32+(ids[i]-1)*36+10] = ruler
        }
        if (key==='gov') bytes[9874+(land-1)*35+16] = ruler
    }
    list(4, 'gov', [2, 41, 42], 1)
    list(5, 'gov', [1, 30], 0)
    list(10, 'gov', [9, 47, 53, 78], 8)
    list(11, 'gov', [16, 83, 110], 8)
    list(12, 'gov', [17, 68, 94], 8)
    list(15, 'gov', [80, 81], 3)
    list(20, 'gov', [255, 254], 15)
    list(13, 'freeAgent', [100, 101])
    list(14, 'hideAgent', [102, 103])
    list(16, 'gov', [104], 8)
    for (const [slot, idx, land, sync] of [[1, 1, 5, 1], [2, 2, 4, 50], [9, 9, 10, 60], [4, 80, 15, 77], [16, 255, 20, 91]]) {
        const base = 9218+(slot-1)*41
        bytes.writeUInt16LE(pointer(idx), base)
        bytes.writeUInt16LE(9930+(land-1)*35, base+2)
        bytes[32+(idx-1)*36+15] = sync
        bytes.writeUInt16LE(1 << (slot-1), 32+(idx-1)*36+16)
    }
    return bytes
}

const loadFileApi = () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    const context = vm.createContext({ TextDecoder })
    vm.runInContext(script.slice(0, script.indexOf('// 화면')) + '\nthis.api = { parseSaveFile, buildSaveFile, parseTaikiFile, buildTaikiFile, changeOfficerRuler, getOfficerLists, getOfficerMoveOptions, moveOfficerAfter }', context)
    return context.api
}

const makeNextSave = () => {
    const bytes = makeLinkedSave()
    bytes.writeUInt16LE(0, 9874+15*35+2)
    bytes[9874+15*35+16] = 255
    return bytes
}

module.exports = { makeSave, makeTaiki, makeLinkedSave, makeNextSave, loadFileApi }
