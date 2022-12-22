import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, 
    IconButton,
    createStyles,
    makeStyles,
    useTheme,
    useMediaQuery,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    TextField,
    // Button,
} from '@material-ui/core';

import {
    TabPanel,
    TabContext,
    TabList
} from '@material-ui/lab'

import {Add} from '@material-ui/icons';

const iconv = require('iconv-lite');

import Page from '../../../core/controls/Page';
import Paragraph from '../../../core/controls/Paragraph'
import Button, {ButtonGroup} from '../../../core/controls/button'
import { T } from '../../../core/utility';
import { useTable } from "react-table";


const useStyles = makeStyles((theme)=>
    createStyles({
        table: {
            backgroundColor: theme.palette.background.paper,
        },
        tab: {
            minWidth:'80px',
            textTransform: 'none',
          },    
    }),
);

function getBaseLog(x, y) {
    const logValue = Math.log(y) / Math.log(x)
    return logValue
}

const setVal = (index, pos, size, value, editable=true) => {
    return { index, pos, size, value, editable, isEdit:false }
}

const idxFromOffset = (offset) => {
    return offset>0?((offset - 88)/36 + 1):0
}

const changeOfficeData = (data, drawData) => {
    let offset = 0
    let officerSize = 36
    // 36 array * 255 array

    // const newData = _.cloneDeep(data)

    for (let i=0; i<data.length; i++) {
        const officer = drawData.find(o=>o.idx===i+1)
        if (officer) {
            
            const keys = Object.keys(officer)
            keys.forEach(k=>{
                if (k!=='idx'&&officer[k].editable) {
                    const obj = officer[k]
                    const value = obj.value
    
                    const pos = officer[k].pos
    
                    if (obj.size===1) {
                        if (k==='rulerNum') {
                            data[i][pos] = value===254?15:value
                        } else {
                            data[i][pos] = value
                        }
                    } else if (obj.size>2 && k==='name') {
                        let nameOriginEncode = iconv.encode(obj.value, 'ks_c_5601-1987')
                        const nameNew = nameOriginEncode.slice(0, 6)
                        data[i][pos] = nameNew[0]
                        data[i][pos+1] = nameNew[1]
                        data[i][pos+2] = nameNew[2]
                        data[i][pos+3] = nameNew[3]
                        data[i][pos+4] = nameNew[4]
                        data[i][pos+5] = nameNew[5]
                        //(new TextDecoder("ks_c_5601-1987").decode(data.slice(pos, pos+6)))
                    } else {
                        let first = 0
                        let last = 0
                        if (k==='family') {
                            if (obj.value!==0) {
                                let f = obj.value-1
                                let pow = Math.pow(2, f)
                                first = pow & 0xff
                                last = (pow>>8) & 0xff
                            }
                        } else {
                            first = value & 0xff
                            last = (value>>8) & 0xff    
                        }
                        data[i][pos] = first
                        data[i][pos+1] = last

                        // console.log(`]]]]] ${data[i][pos]}, ${data[i][pos+1]} === ${newData[i][pos]}, ${newData[i][pos+1]}`)
                    }
                }
            })
            // console.log(`]]]]] origin : ${JSON.stringify(data[i])}`)
            // console.log(`]]]]] new : ${JSON.stringify(newData[i])}`)
    
        }
    }
}

const changeLandData = () => {

}

const parsePersonalData = (index, data, isKor=true) => {
    let pos = 0;
    // next officer address lower
    const nextOfficerLower = setVal(index, pos, 1, data[pos++], false);
    // next officer address upper
    const nextOfficerUpper = setVal(index, pos, 1, data[pos++], false);
    //행동 
    /*
        0x01 : Done / Not Done
        0x02 : Hidden / Not Hidden
        0x04 : unknown
        0x08 : 구호탄랑에 빠진상태 (다음턴에 독립함)
        0x10 : 별 떨어진 상태...  다음 해에 죽는다.
        0x20 : unknown
        0x40 : unknown
        0x80 : unknown
    */
    const action = setVal(index, pos, 1, data[pos++]);
    //건강
    /*
        0x01 : 부상당함 (전투에서 회복하려면 3개월 걸린다.)
        0x02 : 전투중 포로로 잡힘(또는 아플때)
        0x04 : 아프다... 녹색
        0x08 : 아프다... 녹색
        0x10 : unknown
        0x20 : unknown
        0x40 : 전투중 배신 약속된 상태
        0x80 : 아이템 받은 상태 (일시적으로 충성도 하락에 면역)
    */
   let tmp = 0;
    const health = setVal(index, pos, 1, data[pos++]); // 80이면 아이템 가진상태...
    //지력
    const int = setVal(index, pos, 1, data[pos++]);
    //무력
    const war = setVal(index, pos, 1, data[pos++]);
    //매력
    const chm = setVal(index, pos, 1, data[pos++]);
    //인덕
    const trust = setVal(index, pos, 1, data[pos++]);
    //의리
    const good = setVal(index, pos, 1, data[pos++]);
    //야망
    const amb = setVal(index, pos, 1, data[pos++]);
    //모름
    tmp = data[pos++];
    // tmp : 15 > 신군주... 254로 변경해줌. 255는 무소속
    const rulerNum = setVal(index, pos-1, 1, tmp===15?254:tmp);

    const tmp1 = tmp

    // pos++;
    //충성
    const loyalty = setVal(index, pos, 1, data[pos++]);
    //사관
    const off = setVal(index, pos, 1, data[pos++]);
    //침투... 안했으면 0xff
    const hide = setVal(index, pos, 1, data[pos++]);
    //모름... 침투 하면 값이 변경되긴 함.
    const unknown1 = setVal(index, pos, 1, data[pos++]);
    // pos++;
    //상성
    const syn = setVal(index, pos, 1, data[pos++]);
    //모름
    tmp = (data[pos++] | data[pos++] << 8)
    const family = setVal(index, pos-2, 2, (tmp===0?tmp:getBaseLog(2, tmp)+1));
    //병사
    const army = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8));
    //무장
    const weapon = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8));
    //훈련
    const train = setVal(index, pos, 1, data[pos++]);
    //모름
    const unknown2 = setVal(index, pos, 1, data[pos++]);
    // pos++;
    //모름
    const unknown3 = setVal(index, pos, 1, data[pos++]);
    // pos++;
    //생년
    const born = setVal(index, pos, 1, data[pos++]);
    //얼굴
    const faceMainId = setVal(index, pos, 1, data[pos++]);
    //모름
    const faceSubId = setVal(index, pos, 1, data[pos++]);

    const fullFace = setVal(index, pos-2, 2, (faceMainId.value | faceSubId.value << 8), false)

    //이름
    let name = '';
    if (isKor) {
        name = setVal(index, pos, 6, (new TextDecoder("ks_c_5601-1987").decode(data.slice(pos, pos+6))));
        pos += 6;
    } else {
        name = setVal(index, pos, 17, (new TextDecoder().decode(data.slice(pos, pos+17))));
        pos += 17;
    }

    const unknown4 = setVal(index, pos, 1, data[pos++])
    const unknown5 = setVal(index, pos, 1, data[pos++])
    // name = '';

    const offsetIdx = idxFromOffset(nextOfficerLower.value | nextOfficerUpper.value << 8)

    let nextOfficer = setVal(index, 0, 2, offsetIdx, false)

    const officer = {
        nextOfficer,            // 2 2
        action,                 // 1 3
        health,                 // 1 4
        int,                    // 1 5
        war,                    // 1 6
        chm,                    // 1 7
        trust,                  // 1 8
        good,                   // 1 9
        amb,                    // 1 10
        rulerNum,               // 1 11
        loyalty,                // 1 12
        off,                    // 1 13
        hide,                   // 1 14
        unknown1,               // 1 15
        syn,                    // 1 16
        family,                 // 2 18
        army,                   // 2 20
        weapon,                 // 2 22
        train,                  // 1 23
        unknown2,               // 1 24
        unknown3,               // 1 25
        born,                  // 1 26
        faceMainId,             // 1 27
        faceSubId,              // 1 28
        name,                   // isKor ? 6(34) : 17(45)
        unknown4,               // 1 isKor ? 35 : 46
        unknown5,               // 1 isKor ? 36 : 47
        fullFace,               // total isKor ? 36 : 47
    }

    if (rulerNum.value===254) {
        // console.log(`]]]]] 신군주파!! idx: ${index+1}, name : ${name.value}, link : ${offsetIdx}, low : ${nextOfficerLower.value}, high: ${nextOfficerUpper.value}`)
    }


    return officer
};

const parseCountryData = (index, data, isKor=true) => {

    let pos = 0;
    // 통치자의 다음 도시
    const nextCity = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8), false)

    // 태수
    const gov = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8), false)

    // 재야장수
    const freeAgent = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8))

    // 탐색가능한 장수
    const hideAgent = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8))

    // 군자금
    const gold = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8))
    // 군량
    const food = setVal(index, pos, 4, (data[pos++] | data[pos++] << 8 | data[pos++] << 16 | data[pos++] << 24));
    // 인구
    const pop = setVal(index, pos, 2, (data[pos++] | data[pos++] << 8))
    // 군주
    const ruler = setVal(index, pos, 1, data[pos++])
    // 전쟁중인 군주
    const warRuler = setVal(index, pos, 1, data[pos++])
    // 위임
    // 0 : 직할 (위임안함)
    // 4 : 전권형위임 (생산+군사+인사)
    // 5 : 생산형위임
    // 6 : 군사형위임
    // 7 : 인사형위임
    const provInfo1 = setVal(index, pos, 1, data[pos++])
    // 모름
    const provInfo2 = setVal(index, pos, 1, data[pos++])
    // 군사형위임시 전쟁할 땅
    const warProvince = setVal(index, pos, 1, data[pos++])
    // 생산형위임시 돈과쌀 모으는 땅
    const sendProvince = setVal(index, pos, 1, data[pos++])
    // 치수도
    const land = setVal(index, pos, 1, data[pos++])
    // 충성도
    const loy = setVal(index, pos, 1, data[pos++])
    // 토지가치
    const flood = setVal(index, pos, 1, data[pos++])
    // 명마
    const horse = setVal(index, pos, 1, data[pos++])
    // 성채
    const forts = setVal(index, pos, 1, data[pos++])
    // 시세
    const riceRate = setVal(index, pos, 1, data[pos++])
    // 모름
    const unknown1 = setVal(index, pos, 1, data[pos++])
    // prov x pos
    const posX = setVal(index, pos, 1, data[pos++])
    // prov y pos
    const posY = setVal(index, pos, 1, data[pos++])
    // prov name index (0~13) [name-number]
    // 幽州幷州冀州青州兗州司州雍州涼州徐州予州荊州揚州益州交州
    // 유주병주기주청주연주사주옹주양주서주예주형주양주익주교주
    const provPos = ['유주(幽州)', '병주(幷州)', '기주(冀州)', '청주(靑州)', '연주(兗州)', '사주(司州)', '옹주(雍州)', '양주(涼州)', '서주(徐州)', '예주(予州)', '형주(荊州)', '양주(揚州)', '익주(益州)', '교주(交州)']

    // 모름
    const unknown2 = setVal(index, pos, 1, data[pos++])
    // 모름
    const unknown3 = setVal(index, pos, 1, data[pos++])
    // 모름
    const unknown4 = setVal(index, pos, 1, data[pos++])

    const provNo = setVal(index, pos, 1, data[pos++])
    const provName = provPos[provNo.value]

    return {
        nextCity,               // 2 2
        gov,                    // 2 4
        freeAgent,              // 2 6
        hideAgent,              // 2 8
        gold,                   // 2 10
        food,                   // 4 14
        pop,                    // 2 16
        ruler,                  // 1 17
        warRuler,               // 1 18
        provInfo1,                // 1 19
        provInfo2,                  // 1 20
        warProvince,            // 1 21
        sendProvince,           // 1 22
        land,                   // 1 23
        loy,                    // 1 24
        flood,                  // 1 25
        horse,                  // 1 26
        forts,                  // 1 27
        riceRate,               // 1 28
        unknown1,               // 1 29
        posX,                   // 1 30
        posY,                   // 1 31
        unknown2,               // 1 32
        unknown3,               // 1 33
        unknown4,               // 1 34
        provNo,                 // 1 35
        provName,
    }
}




export default (props) => {
	useEffect(async () => {
		
	});

    const classes = useStyles();


    const [saveData, setSaveData] = useState([]);
    const [header, setHeader] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [drawOfficers, setDrawOfficers] = useState([]);
    const [dummy1, setDummy1] = useState([]);
    const [lands, setLands] = useState([]);
    const [drawLands, setDrawLands] = useState([]);
    const [dummy2, setDummy2] = useState([]);
    const [isLoadComplete, setIsLoadComplete] = useState(false);

    const [fileLoadComplete, setFileLoadComplete] = useState(false);

    const [fileName, setFileName] = useState('')

    const [faceLoadComplete, setFaceLoadComplete] = useState(false);
    const [faceRawData, setFaceRawData] = useState([]);

    const [montageLoadComplete, setMontageLoadComplete] = useState(false)
    const [montageData, setMontageData] = useState([])

    const [drawAllFace, setDrawAllFace] = useState(false);

    const [needRefresh, forceRender] = useState({})

    const [currentYear, setCurrentYear] = useState(0)
    const [currentMonth, setCurrentMonth] = useState(0)

    const [tab, setTab] = useState('1')


    useEffect(()=>{
        if (faceRawData.length>0) {
            // console.log(`]]]]] load complete face data : ${faceRawData.length} === (210,240)`);
        }
    }, [faceRawData]);

    useEffect(() => {

        // document.querySelector("#read-file").addEventListener('click', function() { 
        //     // no file selected to read 
        //     if(document.querySelector("#file").value == '') { 
        //         console.log('No file selected'); return; 
        //     } 
            
        //     var file = document.querySelector("#file").files[0]; 
        //     var fileData = new Blob([file]);
            
        //     var reader = new FileReader(); 
        //     reader.readAsArrayBuffer(fileData);
        //     reader.onload = function(event) { 
        //         // binary data 
        //         const bytes = new Uint8Array(event.target.result);
        //         const len = bytes.byteLength;

        //         console.log(`]]]]] file length : ${len}`);

        //         setOfficers([]);
        //         setDrawOfficers([]);
        //         setSaveData(bytes);

        //     }; 
        //     reader.onerror = function(error) { 
        //         // error occurred 
        //         console.log('Error : ' + error.type); 
        //     }; 
        //     // reader.readAsBinaryString(file); 
        // });

        // document.querySelector("#save-file").addEventListener('click', function() { 

        // });        

        // setFaceImage('http://localhost:3325/sam2face');
    }, []);

    useEffect(()=>{
        if (!faceLoadComplete) {
            fetch('http://dev.site/speech-dashboard/kaodata').then(r => {

                const reader = r.body.getReader();

                reader.read().then(({done, value})=>{
                    setFaceRawData(value);
                    setFaceLoadComplete(true);
                }).catch(e=>{
                    setFaceRawData([]);
                });
            });            
        } else {
            // let faceData = faceRawData.slice();
            return;
            var canvas = document.getElementById('allOfficer');
            var ctx = canvas.getContext('2d');
            let posX = 0;
            let posY = 0;
            const totalGenericCount = 219;
            // const totalGenericCount = 276;
            for (let i=1; i<=totalGenericCount; i++) {
                const faceData = getFaceData(i);
                var imgData = ctx.createImageData(64, 80); // imgData.data 10240 elements

                for (let j=0; j<faceData.length; j++) {
                    imgData.data[j] = faceData[j];
                }
                if (posX==20) posX=0;
                
                posY = parseInt((i-1)/20);
                ctx.putImageData(imgData, posX*64, 80*posY);
                posX++;
            }
        }
    }, [faceLoadComplete]);

    useEffect(()=>{
        if (!montageLoadComplete) {
            fetch('http://dev.site/speech-dashboard/montage').then(r=>{
                const reader = r.body.getReader();
                
                reader.read().then(({done, value})=>{
                    setMontageData(value)
                    setMontageLoadComplete(true);
                }).catch(e=>{
                    setMontageData([])
                })
            })
        } else {
            var canvas = document.getElementById('genericResource');
            var ctx = canvas.getContext('2d');
            let posX = 0;
            let posY = 0;
            // const totalGenericCount = 219;
            // // const totalGenericCount = 276;
            // for (let i=1; i<=totalGenericCount; i++) {
            //     const faceData = getFaceData(i);
            //     var imgData = ctx.createImageData(64, 80); // imgData.data 10240 elements

            //     for (let j=0; j<faceData.length; j++) {
            //         imgData.data[j] = faceData[j];
            //     }
            //     if (posX==20) posX=0;
                
            //     posY = parseInt((i-1)/20);
            //     ctx.putImageData(imgData, posX*64, 80*posY);
            //     posX++;
            // }
        }
    }, [montageLoadComplete])

    useEffect(()=>{
        if (saveData && saveData.length>20) {
            const data = saveData.slice();
            let start = 0;
            let length = 10;
            let offset = start+length;
            let totalSum = 0;
            const signature = data.slice(start, offset);
            const signString = new TextDecoder().decode(signature);
            if (signString==='1990.02.19') {

                start = 0;
                length = 32;
                offset = start + length;
                const headerArray = data.slice(start, offset);
                setHeader(headerArray);
                totalSum += length;

                setCurrentYear(headerArray[12])
                setCurrentMonth(headerArray[14]+1)

                const headerSize = offset;
                // console.log(`]]]]] headerSize : ${headerSize} === ${headerArray.length})`);

                const officerArray = [];
                const drawOfficeArray = [];
                for (let i=0; i<255; i++) {
                    start = offset;
                    length = 36;
                    offset = start + length;
                    const officerData = data.slice(start, offset)
                    const officer = parsePersonalData(i, officerData);
                    officerArray.push(officerData);
                    totalSum += length;

                    if ((officer.action.value===0 || officer.action.value===1) && (officer.health.value===0 || officer.health.value===1) && officer.faceMainId.value>0) {
                        // console.log(`]]]]] Person No: ${i+1} >>> ${JSON.stringify(officer)}`);
                        const drawOff = {
                            idx:i+1,
                            ...officer
                        }
                        drawOfficeArray.push(drawOff);
                    }                    
                }
                setOfficers(officerArray);
                setDrawOfficers(drawOfficeArray);
                
                const officerSize = offset-headerSize;
                // console.log(`]]]]] offierSize : ${officerSize} === ${officerArray.length}x36(${officerArray.length*36})`);


                start = offset;
                length = 662;
                offset = start + length;
                var unKnownDummy1 = data.slice(start, offset);
                setDummy1(unKnownDummy1);
                totalSum += length;

                const dummy1Size = offset-headerSize-officerSize;
                // console.log(`]]]]] dummy1Size : ${dummy1Size} === ${unKnownDummy1.length}(668)`);

                const landArray = [];
                const drawLandArray = [];
                for (let i=0; i<41; i++) {
                    start = offset;
                    length = 35;
                    offset = start + length;
                    const landData = data.slice(start, offset)
                    const landInfo = parseCountryData(i, landData);
                    landInfo.idx = i+1
                    drawLandArray.push(landInfo)
                    landArray.push(landData);
                    totalSum += length;

                    // console.log(`]]]]] Country: No:${i+1} >>> ${JSON.stringify(landInfo)}`);
                }
                setLands(landArray);
                setDrawLands(drawLandArray)

                const landSize = offset-headerSize-officerSize-dummy1Size;
                // console.log(`]]]]] landSize : ${landSize} === ${landArray.length}x35(${landArray.length*35})`);


                start = offset;
                length = data.length-start;
                offset = start+length;
                var unKnownDummy2 = data.slice(start, offset);
                setDummy2(unKnownDummy2);
                totalSum += length;

                const dummy2Size = offset-headerSize-officerSize-dummy1Size-landSize;
                // console.log(`]]]]] dummy2Size : ${dummy2Size} === ${unKnownDummy2.length}`);

                // console.log(`]]]]] totalSize (${data.length}) === sum(${headerSize+officerSize+dummy1Size+landSize+dummy2Size}) === ${totalSum}`);
                setIsLoadComplete(true);
            } else {
                console.log(`]]]]] invalid file`);
                setIsLoadComplete(false);
            }
            
        }
    }, [saveData]);

    const onTab = (e, tab) => {

        setTab(tab)
    }

    const byteTo8BitArray = (b) => {
        b = b & 0xff;
        const b1 = (b & 0x80) ? 1 : 0;
        const b2 = (b & 0x40) ? 1 : 0;
        const b3 = (b & 0x20) ? 1 : 0;
        const b4 = (b & 0x10) ? 1 : 0;
        const b5 = (b & 0x8) ? 1 : 0;
        const b6 = (b & 0x4) ? 1 : 0;
        const b7 = (b & 0x2) ? 1 : 0;
        const b8 = (b & 0x1) ? 1 : 0;

        return [b1, b2, b3, b4, b5, b6, b7, b8];
    }

    const colorToArray = (r, g, b) => {
        const color = (r << 2) | (g << 1) | b;
        
        switch (color) {
            case 1: return [0xff, 0x50, 0x50];
            case 2: return [0x50, 0x50, 0xff];
            case 3: return [0xff, 0x50, 0xff];
            case 4: return [0x50, 0xf8, 0x50];
            case 5: return [0xff, 0xf8, 0x50];
            case 6: return [0x50, 0xf8, 0xff];
            case 7: return [0xff, 0xf8, 0xff];
            default: return [0x00, 0x00, 0x00];
        }
    }

    // const genBuffers = (width, height, type, sd, offset, pixelIndex, allowAlpha, out) => {
    //     const pixel = width * height
    //     const sPixel = pixel * 4
    //     const sBytes = sPixel * 3 / 8

    //     const buffers = sd.slice(offset, offset+sBytes)

    //     const length = sBytes/4
    //     const bytes = buffers.slice(type*length, type*length+length)

    //     const lineBytes = width*4

    //     let lineCount = 1

    //     for (let i=0; i<srcByte.length; i+=3) {

    //         const greenArray = byteTo8BitArray(srcByte[i]);
    //         const blueArray = byteTo8BitArray(srcByte[i+1]);
    //         const redArray = byteTo8BitArray(srcByte[i+2]);

    //         for (let j=0; j<8; j++) {
    //             // 2줄씩이라. 다음줄도 똑같이 그린다.
    //             const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
    //             if (allowAlpha && (rgb[0]===0&&rgb[1]===0&&rgb[2]===0)) {
    //                 pixelIndex += 4
    //             } else {
    //                 out[pixelIndex] = rgb[0];
    //                 out[pixelIndex+lineBytes] = rgb[0];
    //                 pixelIndex++;
    //                 out[pixelIndex] = rgb[1];
    //                 out[pixelIndex+lineBytes] = rgb[1];
    //                 pixelIndex++;
    //                 out[pixelIndex] = rgb[2];
    //                 out[pixelIndex+lineBytes] = rgb[2];
    //                 pixelIndex++;
    //                 out[pixelIndex] = 0xff; // alpha
    //                 out[pixelIndex+lineBytes] = 0xff; // alpha
    //                 pixelIndex++;    
    //             }
    //         }                
            
    //         const max = (3*width/8)
    //         // i가 max mod로 0이면 새로운 줄이다.
    //         if (i>0 && i%max===0) {
    //             // new line
    //             pixelIndex += lineBytes;
    //             lineCount++
    //         }
    //     }        

    //     return offset + bytes
    // }

    const getGenericFaceData = (width, height, data) => {
        
        const {idx, name, fullFace} = data

        // 8 가지 sets의 pointer (50688 / 8 = 6336 bytes)
        const group = fullFace.value&0x07
        let setLength = 6336;

        let start = group*setLength;
        let offset = start + setLength;

        const sd = montageData.slice(start, offset);

        // upper*4 > lower*4 > eye*4 > mouth*4 > nose*4

        // 6336 bytes = 50688 bits
        // 50688 bits = 1set에 16896 pixels 을 표현가능
        const upperType = (fullFace.value>>3)&0x03
        const lowerType = (fullFace.value>>5)&0x03
        const eyeType = (fullFace.value>>7)&0x03
        const noseType = (fullFace.value>>9)&0x03
        const mouthType = (fullFace.value>>11)&0x03
        const faceType = (fullFace.value>>13)&0x07

        // console.log(`]]]]] ${name}[${faceType}] > Offset : ${offset}, UpperType : ${upperType}, LowerType : ${lowerType}, EyeType : ${eyeType}, NoseType : ${noseType}, MouthType : ${mouthType}`)

        let byteOffset = 0
        // sd(set data)는 윗면 4개 + 아랫면 4개 + 눈 4개 + 입 4개 + 코 4개의 이미지를 표현할 수 있다

        // 윗면 64*18=1152 pixel
        const upperPixel =  width*18
        // 1 set에 윗면 4개이므로 1152*4 = 4608 pixel
        const sUpperPixel = upperPixel * 4
        // 4608 pixel = 4608 * 3 bits = 13824 bits = 1728 bytes
        const sUpperBytes = sUpperPixel * 3 / 8
        // 1728 bytes가 1개 세트의 4개 윗면 픽셀 데이터임.

        const upperBuffers = sd.slice(byteOffset, byteOffset+sUpperBytes);
        byteOffset += sUpperBytes

        // 1개 type의 윗면 데이터는 432 bytes
        const upperByteLength = sUpperBytes/4
        const upperBytes = upperBuffers.slice(upperType*upperByteLength, upperType*upperByteLength+upperByteLength)
        
        // 아랫면 64*22=1408 pixel
        const lowerPixel = width*22
        // 1 set에 아랫면 4개이므로 1408*4 = 5632 pixel
        const sLowerPixel = lowerPixel * 4
        // 5632 pixel = 5632 * 3 bits = 16896 bits = 2112 bytes
        const sLowerBytes = sLowerPixel * 3 / 8
        // 2112 bytes가 1개 세트의 4개 아랫면 픽셀 데이터임

        const lowerBuffers = sd.slice(byteOffset, byteOffset+sLowerBytes)
        byteOffset += sLowerBytes

        // 1개 type의 아랫면 데이터는 528 bytes
        const lowerByteLength = sLowerBytes/4
        const lowerBytes = lowerBuffers.slice(lowerType*lowerByteLength, lowerType*lowerByteLength+lowerByteLength)


        const srcByte = [...upperBytes, ...lowerBytes]

        const out = new Array(width*height*4*2);

        let pixelIndex = 0;

        const lineBytes = width*4

        let lineCount = 1

        for (let i=0; i<srcByte.length; i+=3) {

            const greenArray = byteTo8BitArray(srcByte[i]);
            const blueArray = byteTo8BitArray(srcByte[i+1]);
            const redArray = byteTo8BitArray(srcByte[i+2]);

            for (let j=0; j<8; j++) {
                // 2줄씩이라. 다음줄도 똑같이 그린다.
                const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
                out[pixelIndex] = rgb[0];
                out[pixelIndex+lineBytes] = rgb[0];
                pixelIndex++;
                out[pixelIndex] = rgb[1];
                out[pixelIndex+lineBytes] = rgb[1];
                pixelIndex++;
                out[pixelIndex] = rgb[2];
                out[pixelIndex+lineBytes] = rgb[2];
                pixelIndex++;
                out[pixelIndex] = 0xff; // alpha
                out[pixelIndex+lineBytes] = 0xff; // alpha
                pixelIndex++;
            }
            
            const max = (3*width/8)
            // i가 max mod로 0이면 새로운 줄이다.
            if (i>0 && i%max===0) {
                // new line
                pixelIndex += lineBytes;
                lineCount++
            }
        }


        const eyePixel = width*8
        const sEyePixel = eyePixel * 4
        const sEyeBytes = sEyePixel * 3 / 8
        const eyeBuffers = sd.slice(byteOffset, byteOffset+sEyeBytes)
        byteOffset += sEyeBytes

        // 1개 type의 눈 데이터는 192 bytes
        const eyeByteLength = sEyeBytes/4
        const eyeBytes = eyeBuffers.slice(eyeType*eyeByteLength, eyeType*eyeByteLength+eyeByteLength)

        let posY = 20
        pixelIndex = lineBytes*posY

        for (let i=0; i<eyeBytes.length; i+=3) {

            const greenArray = byteTo8BitArray(eyeBytes[i]);
            const blueArray = byteTo8BitArray(eyeBytes[i+1]);
            const redArray = byteTo8BitArray(eyeBytes[i+2]);

            for (let j=0; j<8; j++) {
                // 2줄씩이라. 다음줄도 똑같이 그린다.
                const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
                if (rgb[0]===0&&rgb[1]===0&&rgb[2]===0) {
                    pixelIndex += 4
                } else {
                    out[pixelIndex] = rgb[0];
                    out[pixelIndex+lineBytes] = rgb[0];
                    pixelIndex++;
                    out[pixelIndex] = rgb[1];
                    out[pixelIndex+lineBytes] = rgb[1];
                    pixelIndex++;
                    out[pixelIndex] = rgb[2];
                    out[pixelIndex+lineBytes] = rgb[2];
                    pixelIndex++;
                    out[pixelIndex] = 0xff; // alpha
                    out[pixelIndex+lineBytes] = 0xff; // alpha
                    pixelIndex++;    
                }
            }
            
            const max = (3*width/8)
            // i가 max mod로 0이면 새로운 줄이다.
            if (i>0 && i%max===0) {
                // new line
                pixelIndex += lineBytes;
                lineCount++
            }
        }

        const mouthPixel = width*10
        const sMouthPixel = mouthPixel * 4
        const sMouthBytes = sMouthPixel * 3 / 8
        const mouthBuffers = sd.slice(byteOffset, byteOffset+sMouthBytes)
        byteOffset += sMouthBytes

        // 1개 type의 코 데이터는 192 bytes
        const mouthByteLength = sMouthBytes/4
        const mouthBytes = mouthBuffers.slice(mouthType*mouthByteLength, mouthType*mouthByteLength+mouthByteLength)

        const nosePixel = width*8
        const sNosePixel = nosePixel * 4
        const sNoseBytes = sNosePixel * 3 / 8
        const noseBuffers = sd.slice(byteOffset, byteOffset+sNoseBytes)
        byteOffset += sNoseBytes

        // 1개 type의 코 데이터는 192 bytes
        const noseByteLength = sNoseBytes/4
        const noseBytes = noseBuffers.slice(noseType*noseByteLength, noseType*noseByteLength+noseByteLength)

        posY = 20+12
        pixelIndex = lineBytes*posY


        for (let i=0; i<noseBytes.length; i+=3) {

            const greenArray = byteTo8BitArray(noseBytes[i]);
            const blueArray = byteTo8BitArray(noseBytes[i+1]);
            const redArray = byteTo8BitArray(noseBytes[i+2]);

            for (let j=0; j<8; j++) {
                // 2줄씩이라. 다음줄도 똑같이 그린다.
                const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
                if (rgb[0]===0||rgb[1]===0||rgb[2]===0) {
                    pixelIndex += 4
                } else {
                    out[pixelIndex] = rgb[0];
                    out[pixelIndex+lineBytes] = rgb[0];
                    pixelIndex++;
                    out[pixelIndex] = rgb[1];
                    out[pixelIndex+lineBytes] = rgb[1];
                    pixelIndex++;
                    out[pixelIndex] = rgb[2];
                    out[pixelIndex+lineBytes] = rgb[2];
                    pixelIndex++;
                    out[pixelIndex] = 0xff; // alpha
                    out[pixelIndex+lineBytes] = 0xff; // alpha
                    pixelIndex++;    
                }
            }
            
            const max = (3*width/8)
            // i가 max mod로 0이면 새로운 줄이다.
            if (i>0 && i%max===0) {
                // new line
                pixelIndex += lineBytes;
                lineCount++
            }
        }                      

        posY = 20+12+12
        pixelIndex = lineBytes*posY


        for (let i=0; i<mouthBytes.length; i+=3) {

            const greenArray = byteTo8BitArray(mouthBytes[i]);
            const blueArray = byteTo8BitArray(mouthBytes[i+1]);
            const redArray = byteTo8BitArray(mouthBytes[i+2]);

            for (let j=0; j<8; j++) {
                // 2줄씩이라. 다음줄도 똑같이 그린다.
                const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
                if (rgb[0]===0&&rgb[1]===0&&rgb[2]===0) {
                    pixelIndex += 4
                } else {
                    out[pixelIndex] = rgb[0];
                    out[pixelIndex+lineBytes] = rgb[0];
                    pixelIndex++;
                    out[pixelIndex] = rgb[1];
                    out[pixelIndex+lineBytes] = rgb[1];
                    pixelIndex++;
                    out[pixelIndex] = rgb[2];
                    out[pixelIndex+lineBytes] = rgb[2];
                    pixelIndex++;
                    out[pixelIndex] = 0xff; // alpha
                    out[pixelIndex+lineBytes] = 0xff; // alpha
                    pixelIndex++;    
                }
            }
            
            const max = (3*width/8)
            // i가 max mod로 0이면 새로운 줄이다.
            if (i>0 && i%max===0) {
                // new line
                pixelIndex += lineBytes;
                lineCount++
            }
        }    


        return out;            
    }

    const getFaceData = (faceId) => {

        // Kaodata의 총크기 210,240바이트
        // 총 219개, 1개당 960바이트
        // 8 color (3bit: 000, 001, 010, 011, 100, 101, 110, 111) => (palette : 000000, ff5050, 5050ff, ff50ff, 50f850, fff850, 50f8ff, fff8ff)
        // 3바이트로 8픽셀 표현 
        // 총 24 bit -> 3bit * 8pixel = 24 bit = 3byte
        // 한줄 64 픽셀 8픽셀 8묶음...8픽셀에 3byte이므로 3byte * 8묶음.. 곧 한줄에 24byte
        // green / blue / red 순서로 되어 있다..

        let length = 960;

        let start = (faceId-1)*length;
        let offset = start + length;
        let height = 40; // 원래 80인데 한줄로 out에 2줄씩 그린다.        
        let cx = 64;

        const srcByte = faceRawData.slice(start, offset);
        const out = new Array(cx*height*4*2);
        // const out = new Array(cx*height*4);

        let pixelIndex = 0;
        const width = 64

        for (let i=0; i<srcByte.length; i+=3) {

            const greenArray = byteTo8BitArray(srcByte[i]);
            const blueArray = byteTo8BitArray(srcByte[i+1]);
            const redArray = byteTo8BitArray(srcByte[i+2]);

            for (let j=0; j<8; j++) {
                // 2줄씩이라. 다음줄도 똑같이 그린다.
                const rgb = colorToArray(redArray[j], greenArray[j], blueArray[j]);
                out[pixelIndex] = rgb[0];
                out[pixelIndex+256] = rgb[0];
                pixelIndex++;
                out[pixelIndex] = rgb[1];
                out[pixelIndex+256] = rgb[1];
                pixelIndex++;
                out[pixelIndex] = rgb[2];
                out[pixelIndex+256] = rgb[2];
                pixelIndex++;
                out[pixelIndex] = 0xff; // alpha
                out[pixelIndex+256] = 0xff; // alpha
                pixelIndex++;
            }
            
            const max = (3*width/8)
            // i가 max mod로 0이면 새로운 줄이다.
            if (i>0 && i%max===0) {
                // new line
                pixelIndex += (width*4);
            }
        }

        return out;
    }

    function resizeImageData(imageData, width, height) {
        const resizeWidth = width >> 0;
        const resizeHeight = height >> 0;
        const ibm = window.createImageBitmap(imageData, 0, 0, imageData.width, imageData.height, {resizeWidth, resizeHeight});

        const canvas = document.createElement('canvas');
        canvas.width = resizeWidth;
        canvas.height = resizeHeight;
        const ctx = canvas.getContext('2d');
        ctx.scale(resizeWidth/imageData.width, resizeHeight/imageData.height);
        ctx.drawImage(ibm, 0, 0);
        return ctx.getImageData(0, 0, resizeWidth, resizeHeight);
    }

    function dec2bin(dec) {
        return (dec >>> 0).toString(2);
    }


    const renderOfficeFace = (data) => {

        // return <></>

        var row = data.row;

        var canvas = document.getElementById(`officer-${row.id}`);
        if (canvas && typeof canvas !== 'undefined') {
            var ctx = canvas.getContext('2d');
            if (faceRawData.length>0) {

                if (row.original.faceSubId.value>=0x01 && row.original.faceSubId.value<=0xff) {
                    const width = 64
                    const height = 40
                    const faceData = getGenericFaceData(width, height, row.original)
                    var imgData = ctx.createImageData(width, height*2); // imgData.data 10240 elements
                    for (let i=0; i<faceData.length; i++) {
                        imgData.data[i] = faceData[i];
                    }
                    ctx.putImageData(imgData, 0, 0);

                    return (
                        <>
                            <>
                                <canvas id={`officer-${row.id}`} width={`${width}`} height={`${height*2}`} ></canvas>
                            </>
                            {/* <>
                                sub 1 : {`${row.original.faceMainId.value}/${row.original.faceSubId.value}`}
                            </> */}

                        </>
                    );
                } else {
                    const idx = row.original.faceMainId.value;
                    const faceData = getFaceData(idx); // 2560 elements
                    var imgData = ctx.createImageData(64, 80); // imgData.data 10240 elements
    
                    for (let i=0; i<faceData.length; i++) {
                        imgData.data[i] = faceData[i];
                    }
                    ctx.putImageData(imgData, 0, 0);



                    // const resizeImgData = resizeImageData(imgData, 64, 80);
                    // ctx.drawImage()
                    // ctx.scale(1.0, 2.0);
                    // ctx.putImageData(resizeImgData, 0, 0);
                    // ctx.scale(9, 3);
                    // ctx.setTransform(1, 0, 0, 2, 0, 0);
                }
            }
        }

        return (
            <>
                <>
            <canvas id={`officer-${row.id}`} width="64" height="80" ></canvas>
                </>
                
            {/* {
                row.original.faceSubId.value!==0 &&
                <>
                    sub 2 : {row.original.faceMainId.value}/{row.original.faceSubId.value}
                </>
            }
            {
                row.original.faceSubId.value===0 &&
                <>
                    main : {row.original.faceMainId.value}/{row.original.faceSubId.value}
                </>
            } */}
            {/* <canvas id={`officer-${row.id}`} width="64" height="80" ></canvas> */}
            </>
            
        );
    }

    const linkOfficer = (data, field) => {
        const officer = drawOfficers.find(o=>o.idx===data.row.original[field].value)
        if (officer) {
            // console.log(`]]]]] find officer = ${officer.name.value}`)
        }
        return officer
    }

    const loadName = (data) => {
        const ruler = drawOfficers.find(o=>o.idx===data.row.original.rulerNum.value+1)
        if (ruler) {
            if (ruler.idx===data.row.original.idx) {
                return <>{'군주'}</>
            } else {
                const rulersruler = drawOfficers.find(o=>o.idx===ruler.rulerNum.value+1)
                if (rulersruler) {
                    if (rulersruler.idx===ruler.idx) {
                        // 군주는 최상위이므로 군주의 군주는 자기 자신이어야 한다.
                return <a onClick={e=>{
                    e.preventDefault();
                    const el = document.getElementById(`officer${ruler.idx}`)
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}>{ruler.name.value}</a>
                    } else {
                        // 군주의 군주가 자기 자신이 아니라면 버그... 또는 뭔가 이상한 경우.. 그래서 군주일듯...
                        return <>{`${ruler.name.value}(이)라고 하는데 군주일듯`}</>
                    }
                } else {
                    return <>{'무소속'}</>
                }
            }
        } else return <>{'무소속'}</>
    }
    
    const renderCell = ({rowData, field}) => {
        const cellData = rowData[field]
        
        if (cellData) {
            const pos = cellData.pos
            const offset = cellData.index
            // console.log(`]]]]] [${offset}][${pos}] ${field} : ${cellData.value}`)
                // console.log(`]]]]] ${field} cell data : ${JSON.stringify(cellData)}`)
            
            
            if (cellData.isEdit || false) {
                return <TextField value={cellData.value} onChange={e=>{
                    cellData.value = e.target.value
                    forceRender({})
                }} onBlur={e=>{
                    cellData.isEdit = false
                    forceRender({})
                }}/>
            } else {
                return <Typography onClick={e=>{
                    drawOfficers.forEach(e=>{
                        Object.keys(e).forEach(k=>{
                            if (k!=='idx') {
                                e[k].isEdit = false
                            }
                        })
                    })

                    cellData.isEdit = true
                    forceRender({})
                }}>{cellData.value}</Typography>    
            }

        } else return ''
    }

    const getOfficeCell = (data, field) => {
        const cellData = data.row.original[field]
        const pos = cellData.pos
        const row = cellData.index
        const size = cellData.size
        const cell = size===2?(officers[row][pos] | officers[row][pos+1] << 8):officers[row][pos]
        return cell
    }

    const columns = useMemo(
        () => {
            if (tab==='1') {
                return [
            {
                Header: 'No',
                // accessor: 'idx',
                Cell: (data) => {
                    return <div id={`officer-element${data.row.original.idx}`} style={{position: 'relative'}}>
                        <div id={`officer${data.row.original.idx}`} style={{position: 'absolute', top: '-100px', left: '0px'}}>
                        </div>
                        <div >{data.row.original.idx}</div>
                    </div>
                },
            },
            {
                Header: T('Name'),
                // accessor: 'name.value',
                // Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'name'}),
                Cell: (data) => {
                    const cellData = data.row.original
                    return <a onClick={e=>{
                        e.preventDefault();
                        const el = document.getElementById(`next${cellData.idx}`)
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                    }}>{cellData.name.value}</a> 
                }
            },
            {
                Header: T('Old'),
                // accessor: 'born',
                Cell: (data) => {
                    const cellData = data.row.original.born
                    const old = currentYear - cellData.value + 1
                    const pos = cellData.pos
                    const row = cellData.index
                    const size = cellData.size
                            // const cell = size===2?(officers[row][pos] | officers[row][pos+1] << 8):officers[row][pos]
                    // console.log(`]]]]] old(${row}) ${cell} === ${cellData.value}`)
                    return <>{old}</>
                },
            },
            // {
            //     Header: T('Face'),
            //     accessor: 'face',
            //     Cell: (data) => renderOfficeFace(data),
            // },
            {
                Header: T('Action'),
                // accessor: 'action.value',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'action'}),
            },
            {
                Header: T('Health'),
                // accessor: 'health.value',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'health'}),
            },
            {
                Header: T('FaceId'),
                // accessor: 'faceMainId',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'faceMainId'}),
            },
            {
                Header: T('INT'),
                // accessor: 'int',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'int'}),
            },
            {
                Header: T('WAR'),
                // accessor: 'war',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'war'}),
            },
            {
                Header: T('Charm'),
                // accessor: 'chm',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'chm'}),
            },
            {
                Header: T('Trust'),
                // accessor: 'trust',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'trust'}),
            },
            {
                Header: T('Good'),
                // accessor: 'good',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'good'}),
            },
            {
                Header: T('Ambitious'),
                // accessor: 'amb',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'amb'}),
            },
            {
                Header: T('Loyalty'),
                // accessor: 'loyalty',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'loyalty'}),
            },
            {
                Header: T('Office'),
                // accessor: 'off',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'off'}),
            },
            {
                Header: T('Sync'),
                // accessor: 'syn',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'syn'}),
            },
            {
                Header: T('Army'),
                // accessor: 'army',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'army'}),
            },
            {
                Header: T('Weapon'),
                // accessor: 'weapon',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'weapon'}),
            },
            {
                Header: T('Training'),
                // accessor: 'train',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'train'}),
            },
            // {
            //     Header: T('Born'),
            //     // accessor: 'born',
            //     Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'born'}),
            // },
            {
                Header: T('Ruler Name'),
                // accessor: 'rulerNum',
                Cell: (data) => loadName(data),
            },
            {
                Header: T('다음'),
                // accessor: 'name.value',
                Cell: (data) => {
        
                    const nextOfficer = linkOfficer(data, 'nextOfficer')
                    if (nextOfficer) {
                        return <div id={`next-element${nextOfficer.idx}`} style={{position: 'relative'}}>
                            <div id={`next${nextOfficer.idx}`} style={{position: 'absolute', top: '-100px', left: '0px'}}>
                            </div>
                            <div >
                                <a onClick={e=>{
                                    e.preventDefault();
                                    const el = document.getElementById(`officer${nextOfficer.idx}`)
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }}>{nextOfficer.name.value}</a>                                
                            </div>
                        </div>
                    }
        
                    return <>{'-'}</>
                    // const ruler = linkOfficer(data, 'rulerNum')
                    // if (ruler) {
                    //     const nextOfficer = linkOfficer(data, 'nextOfficer')
                    //     if (nextOfficer) {
                    //         return <a onClick={e=>{
                    //             e.preventDefault();
                    //             const el = document.getElementById(`officer${nextOfficer.idx}`)
                    //             el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    //         }}>{nextOfficer.name.value}</a>
                    //     } else {
                    //         if (ruler.idx===data.row.original.idx) {
                    //             return <>{'-'}</>
                    //         } else {
                    //             return <a onClick={e=>{
                    //                 e.preventDefault();
                    //                 const el = document.getElementById(`officer${ruler.idx}`)
                    //                 el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    //             }}>{`처음(${ruler.name.value})`}</a>        
                    //         }
                    //     }
                    // } else {
                    //     return <>{'-'}</>
                    // }
                },
            },                
            // {
            //     Header: T('Ruler'),
            //     // accessor: 'rulerNum',
            //     Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'rulerNum'}),
            // },
            {
                Header: T('Famliy'),
                // accessor: 'family',
                Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'family'}),
            },
                    {
                        Header: T('Ex1'),
                        accessor: 'unknown1',
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown1'}),
                    },
                    {
                        Header: T('Ex2'),
                        accessor: 'unknown2',
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown2'}),
                    },
                    {
                        Header: T('Ex3'),
                        accessor: 'unknown3',
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown3'}),
                    },
                    {
                        Header: T('Ex4'),
                        accessor: 'unknown4',
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown4'}),
                    },
                    {
                        Header: T('Ex5'),
                        accessor: 'unknown5',
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown5'}),
                    },
                
                ]
            } else {
                // console.log(`]]]]] lands info : ${JSON.stringify(drawLands.map(e=>{
                //     return {
                //         ...e.provNo,
                //         name: e.provName
                //     }
                // }))}`)

                return [
                    {
                        Header: 'No',
                        accessor: 'idx',
                    },
                    {
                        Header: T('Province Nanme'),
                        Cell: (data) => {return <>{`${data.row.original.provName}(${data.row.original.idx})`}</>},
                    },
                    {
                        Header: T('Goverment'),
                        Cell: (data) => {
                            const agentOffset = data.row.original.gov.value
                            if (agentOffset>0) {
                                const officerIdx = idxFromOffset(agentOffset)
                                const officer = drawOfficers.find(o=>o.idx===officerIdx)
                                return <>{((officer||{}).name||{}).value || '-'}</>
                            } else {
                                return <>{'-'}</>
                            }
                        },
                    },
                    {
                        Header: T('Gold'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'gold'}),
                    },
                    {
                        Header: T('food'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'food'}),
                    },
                    {
                        Header: T('Population'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'pop'}),
                    },
                    {
                        Header: T('Ruler'),
                        Cell: (data) => {
                            const rulerNo = data.row.original.ruler.value
                            if (rulerNo===255) {
                                return <>{'-'}</>    
                            } else {
                                if (rulerNo===15) {
                                    const officer = drawOfficers.find(e=>e.idx===255)
                                    return <>{((officer||{}).name||{}).value || '-'}</>
                                } else {
                                    const officer = drawOfficers[rulerNo]
                                    return <>{((officer||{}).name||{}).value || '-'}</>
                                }
                            }
                        },
                    },
                    {
                        Header: T('Ruler In WAR'),
                        Cell: (data) => {
                            const rulerNo = data.row.original.warRuler.value
                            if (rulerNo===255) {
                                return <>{'-'}</>    
                            } else {
                                if (rulerNo===15) {
                                    const officer = drawOfficers.find(e=>e.idx===255)
                                    return <>{((officer||{}).name||{}).value || '-'}</>
                                } else {
                                    const officer = drawOfficers[rulerNo]
                                    return <>{((officer||{}).name||{}).value || '-'}</>
                                }
                            }
                        },
                    },
                    {
                        Header: T('Province Info 1'),
                        Cell: (data) => {
                            const provInfo1Value = data.row.original.provInfo1.value
                            const turnOver = (provInfo1Value&0x80)&&'턴종료'||''
                            return <>{`${turnOver}`}</>
                            
                        },
                    },
                    {
                        Header: T('Province Info 2'),
                        Cell: (data) => {
                            const provInfo2 = data.row.original.provInfo2.value
                            const existMerchant = provInfo2 & 0x01
                            return <>{`${provInfo2}${existMerchant?' (상인상시거주)':''}`}</>
                        },
                    },
                    {
                        Header: T('Province In WAR'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'warProvince'}),
                    },
                    {
                        Header: T('Province Tribute'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'sendProvince'}),
                    },
                    {
                        Header: T('Land Develop'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'land'}),
                    },
                    {
                        Header: T('Flood Control'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'flood'}),
                    },
                    {
                        Header: T('Loyalty'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'loy'}),
                    },
                    {
                        Header: T('Horse'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'horse'}),
                    },
                    {
                        Header: T('Fortress'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'forts'}),
                    },
                    {
                        Header: T('Rice Rate'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'riceRate'}),
                    },
                    {
                        Header: T('PosX'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'posX'}),
                    },
                    {
                        Header: T('PosY'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'posY'}),
                    },
                    {
                        Header: T('Ex1'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown1'}),
                    },
                    {
                        Header: T('Ex2'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown2'}),
                    },
                    {
                        Header: T('Ex3'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown3'}),
                    },
                    {
                        Header: T('Ex4'),
                        Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'unknown4'}),
                    },
            // {
                    //     Header: T('Province No'),
                    //     Cell: (data) => renderCell({fullData: data, rowData:data.row.original, field:'provNo'}),
            // },
                    {
                        Header: T('Free Agent'),
                        Cell: (data) => {
                            const agentOffset = data.row.original.freeAgent.value
                            if (agentOffset>0) {
                                const officerIdx = idxFromOffset(agentOffset)
                                const officer = drawOfficers.find(o=>o.idx===officerIdx)
                                return <>{((officer||{}).name||{}).value || 'Wrong Data'}</>
                            } else {
                                return <>{'-'}</>
                            }

                        },
                    },
                    {
                        Header: T('Hide Agent'),
                        Cell: (data) => {
                            const agentOffset = data.row.original.hideAgent.value
                            if (agentOffset>0) {
                                const officerIdx = idxFromOffset(agentOffset)
                                const officer = drawOfficers.find(o=>o.idx===officerIdx)
                                return <>{((officer||{}).name||{}).value || 'Wrong Data'}</>
                            } else {
                                return <>{'-'}</>
                            }

                        },
                    },                    
                    {
                        Header: T('Next City'),
                        Cell: (data) => {
                            if (data.row.original.nextCity.value>0) {
                                const nextCityIndex = (data.row.original.nextCity.value-9895)/35-1
                                const nextCity = drawLands[nextCityIndex]
                                return <>{`${nextCity.provName}(${nextCity.idx})`}</>
                            } else {
                                return <>{'-'}</>
                            }
                        },
                    },
                ]
            }
        },
        [officers, drawLands, tab]
    );

    const {
        getTableProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data: tab==='1'?drawOfficers:drawLands,
    });    
	


    const renderHeader = () => headerGroups.map((headerGroup, index) => (
        <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, idx) => {
                if (idx<2) {
                    return <TableCell key={`column-${idx}`} {...column.getHeaderProps()} style={{
                        position:'sticky',
                        left: 0,
                        zIndex: 200
                    }}>
                        {column && column.render('Header')}
                    </TableCell>
                } else {
                return (
                    <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
                        {column && column.render('Header')}
                    </TableCell>
                    )    
                }
            })}
        </TableRow>
    ));    

    const renderRows = () => rows.map((row, rowIndex)=>{
        prepareRow(row);
        return (
            <TableRow key={`row-${rowIndex}`} {...row.getRowProps()}>
                {row.cells.map((cell, cellIndex) => {
                    if (cellIndex<2) {
                        return (
                            <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()} style={{
                                position:'sticky',
                                left: 0,
                                background: 'white',
                                zIndex: 100
                            }}>
                                {cell && cell.render('Cell')}
                            </TableCell>
                        )    
                    } else {
                    return (
                        <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()}>
                            {cell && cell.render('Cell')}
                        </TableCell>
                        )    
                    }
                })}
            </TableRow>
        );
    });    

    useEffect(()=>{

        return () => {
            setHeader([]);
            setOfficers([]);
            setDummy1([]);
            setLands([]);
            setDummy2([]);
            setDrawOfficers([]);
        }

    }, [fileLoadComplete]);

    const onFileOpen = (e) => {
                    var file = e.target.files[0]
                    if (file) {
                        var fileData = new Blob([file]);
                        setFileName(file.name)
                        
                        var reader = new FileReader(); 
                        reader.readAsArrayBuffer(fileData);
                        reader.onload = function(event) { 
                            // binary data 
                            const bytes = new Uint8Array(event.target.result);
                            const len = bytes.byteLength;

                            // console.log(`]]]]] file length : ${len}`);

                            setOfficers([]);
                            setDrawOfficers([]);
                            setSaveData(bytes);

                        }; 
                        reader.onerror = function(error) { 
                            // error occurred 
                            console.log('Error : ' + error.type); 
                        };     
                    }
    }
    
    const reloadFile = () => {
                                if (saveData && saveData.length>0) {
                                    setOfficers([]);
                                    setDrawOfficers([]);
                                    setSaveData(_.cloneDeep(saveData));
                            }
    }

    const saveFile = () => {

                                /*
                                data : {
                                    headerArray(32): {
                                        signature(0~10),
                                        ...
                                    },
                                    officerArray(36*255)[
                                        officer(36): {

                                        }
                                    ],
                                    unknown1(662),
                                    landArray(35*41)[]: {
                                        landInfo(35): {

                                        }
                                    },
                                    unknown2(rest)
                                }
                                header.length + officers.length + dummy1.length + lands.length + dummy2.length = saveData.length
                                */

                                const bytes = new Uint8Array(saveData.length);
                                let offset = 0
                                bytes.set(header)
                                offset += header.length
        changeOfficeData(officers, drawOfficers)
                                officers.forEach(e=>{
                                    bytes.set(e, offset)
                                    offset += e.length
                                })
                                bytes.set(dummy1, offset)
                                offset += dummy1.length
        // changeLandData()
                                lands.forEach(e=>{
                                    bytes.set(e, offset)
                                    offset += e.length
                                })
                                bytes.set(dummy2, offset)
                                // const len = bytes.byteLength;
                                // const newData = new Uint8Array(saveData);

                                const downloadURL = function(data, fileName) {
                                    var a;
                                    a = document.createElement('a');
                                    a.href = data;
                                    a.download = fileName;
                                    document.body.appendChild(a);
                                    a.style = 'display: none';
                                    a.click();
                                    a.remove();
                                };

                                const blob = new Blob([bytes], {
                                    type: 'application/octet-stream'
                                  })
                                const url = window.URL.createObjectURL(blob)
                                downloadURL(url, `${fileName}_save`)
                                setTimeout(()=>{
                                    return window.URL.revokeObjectURL(url)
                                }, 1000)
        
        console.log(`]]]]] header(${header.length}) + officers(${officers.length*36}) + unknown1(${dummy1.length}) + lands(${lands.length*35}) + unknown2(${dummy2.length}) (${header.length+officers.length*36+dummy1.length+lands.length*35+dummy2.length}) = ${saveData.length}`)
    }

    return (
        <Page 
            breadcrumbs={[
                {
                    title: T('Home')                    
                            }
            ]}
        >
            <Paragraph
                title={T('Home')}
                actions={[<TextField key={1} type='file' id='file' label={'File Open'} onChange={onFileOpen} />, <ButtonGroup key={2}
                    items={[
                        {
                            label: 'Read File',
                            onClick: reloadFile
                        },
                        {
                            label : 'Save File',
                            onClick: saveFile
                        }
                    ]}
                />]}
            >
                <Box width={'100%'}>
                    <Box height={'30px'} />
                    <TabContext value={tab}>
                        <TabList indicatorColor="primary" onChange={onTab}>
                            <Tab className={classes.tab} label={<Typography variant="body2">Officers</Typography>} value="1" />
                            <Tab className={classes.tab} label={<Typography variant="body2">Lands</Typography>} value="2" />
                        </TabList>
                        <TabPanel value="1">
                            <Box width={'100%'}>
                                <Box height={'20px'}/>
                                <Box width={'100%'} height={'400px'} style={{overflowX:'auto', overflowY:'auto'}}>
                                    {
                                    isLoadComplete && <Table stickyHeader {...getTableProps()}  className={classes.table} >
                                        <TableHead>
                                            {renderHeader()}
                                        </TableHead>
                                        <TableBody>
                                            {renderRows()}
                                        </TableBody>
                                    </Table>
                                    }     
                                </Box>
                            </Box>
                        </TabPanel>
                        <TabPanel value="2">
                            <Box width={'100%'}>
                                <Box height={'20px'}/>
                                <Box width={'100%'} height={'400px'} style={{overflowX:'auto', overflowY:'auto'}}>
                                    {
                                    isLoadComplete && <Table stickyHeader {...getTableProps()}  className={classes.table}>
                            <TableHead>
                                {renderHeader()}
                            </TableHead>
                            <TableBody>
                                {renderRows()}
                            </TableBody>
                        </Table>
                        }     
                                </Box>
                    </Box>                      
                        </TabPanel>
                    </TabContext>
                    <Box height={'10px'}/>
                    <Box height={'10px'}/>
                    <Box>
                        <div>
                            <canvas id={`allOfficer`} width="10" height="10" ></canvas>
                            <canvas id={`genericResource`} width="10" height="10" ></canvas>
                            {/* <canvas id={`allOfficer`} width="1280" height="1120" ></canvas>
                            <canvas id={`genericResource`} width="1280" height="1120" ></canvas> */}
                        </div>
                </Box>
                    </Box>
            </Paragraph>
        </Page>
    );
}