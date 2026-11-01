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

const loadFileApi = () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    const context = vm.createContext({ TextDecoder })
    vm.runInContext(script.slice(0, script.indexOf('// 화면')) + '\nthis.api = { parseSaveFile, buildSaveFile, parseTaikiFile, buildTaikiFile }', context)
    return context.api
}

module.exports = { makeSave, makeTaiki, loadFileApi }
