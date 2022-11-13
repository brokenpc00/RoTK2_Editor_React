import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, 
    IconButton,
    createStyles,
    makeStyles,
    useTheme,
    useMediaQuery,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    TextField,
    // Button,
} from '@material-ui/core';

import {Add} from '@material-ui/icons';

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
    }),
);

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
  }

const parsePersonalData = (data, isKor=true) => {
    let pos = 0;
    // next officer address lower
    const nextOfficerLower = data[pos++];
    // next officer address upper
    const nextOfficerUpper = data[pos++];
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
    const action = data[pos++];
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
    const health = data[pos++]; // 80이면 아이템 가진상태...
    //지력
    const int = data[pos++];
    //무력
    const war = data[pos++];
    //매력
    const chm = data[pos++];
    //인덕
    const trust = data[pos++];
    //의리
    const good = data[pos++];
    //야망
    const amb = data[pos++];
    //모름
    tmp = data[pos++]+1;
    const lordNum = tmp===256?0:tmp===16?255:tmp;
    // pos++;
    //충성
    const loyalty = data[pos++];
    //사관
    const off = data[pos++];
    //침투... 안했으면 0xff
    const hide = data[pos++];
    //모름... 침투 하면 값이 변경되긴 함.
    const unknown2 = data[pos++];
    // pos++;
    //상성
    const syn = data[pos++];
    //모름
    tmp = (data[pos++] | data[pos++] << 8)
    const family = tmp===0?tmp:getBaseLog(2, tmp)+1;
    //병사
    const army = data[pos++] | data[pos++] << 8;
    //무장
    const weapon = data[pos++] | data[pos++] << 8;
    //훈련
    const train = data[pos++];
    //모름
    const unknown5 = data[pos++];
    // pos++;
    //모름
    const unknown6 = data[pos++];
    // pos++;
    //생년
    const birth = data[pos++];
    //얼굴
    const faceMainId = data[pos++];
    //모름
    const faceSubId = data[pos++];

    const fullFace = faceMainId | faceSubId << 8 

    //이름
    let name = '';
    if (isKor) {
        name = new TextDecoder("ks_c_5601-1987").decode(data.slice(pos, pos+6));
        pos += 6;
    } else {
        name = new TextDecoder().decode(data.slice(pos, pos+17));
        pos += 17;
    }
    // name = '';


    return {
        nextOfficerLower,
        nextOfficerUpper,
        action,
        health,
        int,
        war,
        chm,
        trust,
        good,
        amb,
        loyalty,
        hide,
        off,
        syn,
        army,
        weapon,
        train,
        birth,
        faceMainId,
        faceSubId,
        fullFace,
        name,
        lordNum,
        unknown2,
        family,
        unknown5,
        unknown6,
    }
};

const parseCountryData = (data, isKor=true) => {

    let pos = 0;
    // 통치자의 다음 도시 하위
    const nextCityLow = data[pos++];
    // 통치자의 다음 도시 상위
    const nextCityUpper = data[pos++];
    // 태수 하위
    const govLow = data[pos++];
    // 태수 상위
    const govHigh = data[pos++];
    // 재야장수 하위
    const freeAgentLow = data[pos++];
    // 재야장수 상위
    const freeAgentUpper = data[pos++];
    // 탐색가능한 장수 하위
    const hideAgentLow = data[pos++];
    // 탐색가능한 장수 상위
    const hideAgentUpper = data[pos++];
    // 군자금
    const money = data[pos++] | data[pos++] << 8;
    // 군량
    const food = data[pos++] | data[pos++] << 8 | data[pos++] << 16 | data[pos++] << 24;
    // 인구
    const pop = data[pos++] | data[pos++] << 8;
    // 군주
    const ruler = data[pos++];
    // 전쟁중인 군주
    const warRuler = data[pos++]
    // 위임
    // 0 : 직할 (위임안함)
    // 4 : 전권형위임 (생산+군사+인사)
    // 5 : 생산형위임
    // 6 : 군사형위임
    // 7 : 인사형위임
    const delegate = data[pos++];
    // 모름
    const unknown1 = data[pos++];
    // 군사형위임시 전쟁할 땅
    const warProvince = data[pos++];
    // 생산형위임시 돈과쌀 모으는 땅
    const sendProvince = data[pos++];
    // 치수도
    const land = data[pos++];
    // 충성도
    const loy = data[pos++];
    // 토지가치
    const flood = data[pos++];
    // 명마
    const horse = data[pos++];
    // 성채
    const fort = data[pos++];
    // 시세
    const riceRate = data[pos++];
    // 모름
    const unknown2 = data[pos++];
    // prov x pos
    const posX = data[pos++];
    // prov y pos
    const posY = data[pos++];
    // prov name index (0~13) [name-number]
    // 幽州幷州冀州青州兗州司州雍州涼州徐州予州荊州揚州益州交州
    // 유주병주기주청주연주사주옹주양주서주예주형주양주익주교주

    const provName = data[pos++]
    return {
        nextCityLow,
        nextCityUpper,
        govLow,
        govHigh,
        freeAgentLow,
        freeAgentUpper,
        hideAgentLow,
        hideAgentUpper,
        money,
        food,
        pop,
        flood,
        loy,
        land,
        horse,
        fort,
        riceRate,
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
    const [dummy2, setDummy2] = useState([]);
    const [isLoadComplete, setIsLoadComplete] = useState(false);

    const [fileLoadComplete, setFileLoadComplete] = useState(false);

    const [faceLoadComplete, setFaceLoadComplete] = useState(false);
    const [faceRawData, setFaceRawData] = useState([]);

    const [montageLoadComplete, setMontageLoadComplete] = useState(false)
    const [montageData, setMontageData] = useState([])

    const [drawAllFace, setDrawAllFace] = useState(false);

    const [,forceRender] = useState({})


    useEffect(()=>{
        if (faceRawData.length>0) {
            console.log(`]]]]] load complete face data : ${faceRawData.length} === (210,240)`);
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
            fetch('http://localhost/kaodata').then(r => {

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
            // return;
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
            fetch('http://localhost/montage').then(r=>{
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

                const headerSize = offset;
                console.log(`]]]]] headerSize : ${headerSize} === ${headerArray.length})`);

                const officerArray = [];
                const drawOfficeArray = [];
                for (let i=0; i<255; i++) {
                    start = offset;
                    length = 36;
                    offset = start + length;
                    const officer = parsePersonalData(data.slice(start, offset));
                    officerArray.push(officer);
                    totalSum += length;

                    if ((officer.action===0 || officer.action===1) && (officer.health===0 || officer.health===1) && officer.faceMainId>0) {
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
                console.log(`]]]]] offierSize : ${officerSize} === ${officerArray.length}x36(${officerArray.length*36})`);


                start = offset;
                length = 662;
                offset = start + length;
                var unKnownDummy1 = data.slice(start, offset);
                setDummy1(unKnownDummy1);
                totalSum += length;

                const dummy1Size = offset-headerSize-officerSize;
                console.log(`]]]]] dummy1Size : ${dummy1Size} === ${unKnownDummy1.length}(668)`);

                const landArray = [];
                for (let i=0; i<41; i++) {
                    start = offset;
                    length = 35;
                    offset = start + length;
                    const landInfo = parseCountryData(data.slice(start, offset));
                    landArray.push(landInfo);
                    totalSum += length;

                    // console.log(`]]]]] Country: No:${i+1} >>> ${JSON.stringify(landInfo)}`);
                }
                setLands(landArray);

                const landSize = offset-headerSize-officerSize-dummy1Size;
                console.log(`]]]]] landSize : ${landSize} === ${landArray.length}x35(${landArray.length*35})`);


                start = offset;
                length = data.length-start;
                offset = start+length;
                var unKnownDummy2 = data.slice(start, offset);
                setDummy2(unKnownDummy2);
                totalSum += length;

                const dummy2Size = offset-headerSize-officerSize-dummy1Size-landSize;
                console.log(`]]]]] dummy2Size : ${dummy2Size} === ${unKnownDummy2.length}`);

                console.log(`]]]]] totalSize (${data.length}) === sum(${headerSize+officerSize+dummy1Size+landSize+dummy2Size}) === ${totalSum}`);
                setIsLoadComplete(true);
            } else {
                console.log(`]]]]] invalid file`);
                setIsLoadComplete(false);
            }
            
        }
    }, [saveData]);

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
        const group = fullFace&0x07
        let setLength = 6336;

        let start = group*setLength;
        let offset = start + setLength;

        const sd = montageData.slice(start, offset);

        // upper*4 > lower*4 > eye*4 > mouth*4 > nose*4

        // 6336 bytes = 50688 bits
        // 50688 bits = 1set에 16896 pixels 을 표현가능
        const upperType = (fullFace>>3)&0x03
        const lowerType = (fullFace>>5)&0x03
        const eyeType = (fullFace>>7)&0x03
        const noseType = (fullFace>>9)&0x03
        const mouthType = (fullFace>>11)&0x03
        const faceType = (fullFace>>13)&0x07

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


    const FaceImageFromIndex = (data) => {

        var row = data.row;

        var canvas = document.getElementById(`officer-${row.id}`);
        if (canvas && typeof canvas !== 'undefined') {
            var ctx = canvas.getContext('2d');
            if (faceRawData.length>0) {

                if (row.original.faceSubId>=0x01 && row.original.faceSubId<=0xff) {
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
                                sub 1 : {`${row.original.faceMainId}/${row.original.faceSubId}`}
                            </> */}

                        </>
                    );
                } else {
                    const idx = row.original.faceMainId;
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
                row.original.faceSubId!==0 &&
                <>
                    sub 2 : {row.original.faceMainId}/{row.original.faceSubId}
                </>
            }
            {
                row.original.faceSubId===0 &&
                <>
                    main : {row.original.faceMainId}/{row.original.faceSubId}
                </>
            } */}
            {/* <canvas id={`officer-${row.id}`} width="64" height="80" ></canvas> */}
            </>
            
        );
    }

    const loadName = (data) => {
        const lord = drawOfficers.filter(officer=>officer.idx===data.row.original.lordNum);
        const name = lord[0]&&lord[0].name || '무소속'
        return <>{name}</>
    }

    const columns = useMemo(
        () => [
            {
                Header: 'No',
                accessor: 'idx',
            },
            {
                Header: T('Name'),
                accessor: 'name',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Action'),
                accessor: 'action',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Health'),
                accessor: 'health',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Face'),
                accessor: 'face',
                Cell: (data) => FaceImageFromIndex(data),
            },
            {
                Header: T('FaceId'),
                accessor: 'faceMainId',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('INT'),
                accessor: 'int',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('WAR'),
                accessor: 'war',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Charm'),
                accessor: 'chm',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Trust'),
                accessor: 'trust',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Good'),
                accessor: 'good',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Ambitious'),
                accessor: 'amb',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Loyalty'),
                accessor: 'loyalty',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Office'),
                accessor: 'off',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Sync'),
                accessor: 'syn',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Army'),
                accessor: 'army',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Weapon'),
                accessor: 'weapon',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Training'),
                accessor: 'train',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Birth'),
                accessor: 'birth',
                // Cell: (data) => UsersCellPlainText({cellData: data}),
            },
            {
                Header: T('Lord Name'),
                // accessor: 'lordNum',
                Cell: (data) => loadName(data),
            },
            {
                Header: T('Lord'),
                accessor: 'lordNum',
            },
            {
                Header: T('Ex2'),
                accessor: 'unknown2',
            },
            {
                Header: T('Famliy'),
                accessor: 'family',
            },
            {
                Header: T('Ex5'),
                accessor: 'unknown5',
            },
            {
                Header: T('Ex6'),
                accessor: 'unknown6',
            },
        ],
        [officers]
    );

    const {
        getTableProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data: drawOfficers,
    });    
	


    const renderHeader = () => headerGroups.map((headerGroup, index) => (
        <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, idx) => {
                return (
                    <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
                        {column && column.render('Header')}
                    </TableCell>
                )
            })}
        </TableRow>
    ));    

    const renderRows = () => rows.map((row, rowIndex)=>{
        prepareRow(row);
        return (
            <TableRow key={`row-${rowIndex}`} {...row.getRowProps()}>
                {row.cells.map((cell, cellIndex) => {
                    return (
                        <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()}>
                            {cell && cell.render('Cell')}
                        </TableCell>
                    );
                })}
            </TableRow>
        );
    });    

    useEffect(()=>{

        if (fileLoadComplete) {



        } else {
            setHeader([]);
            setOfficers([]);
            setDummy1([]);
            setLands([]);
            setDummy2([]);
            setDrawOfficers([]);
        }

    }, [fileLoadComplete]);
    
    

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
                actions={[<TextField key={1} type='file' id='file' label={'File Open'} />, <ButtonGroup key={2}
                    items={[
                        {
                            label: 'Read File',
                            onClick: ()=>{
                                // no file selected to read 
                                if(document.querySelector("#file").value == '') { 
                                    console.log('No file selected'); return; 
                                } 
                                
                                var file = document.querySelector("#file").files[0]; 
                                var fileData = new Blob([file]);
                                
                                var reader = new FileReader(); 
                                reader.readAsArrayBuffer(fileData);
                                reader.onload = function(event) { 
                                    // binary data 
                                    const bytes = new Uint8Array(event.target.result);
                                    const len = bytes.byteLength;

                                    console.log(`]]]]] file length : ${len}`);

                                    setOfficers([]);
                                    setDrawOfficers([]);
                                    setSaveData(bytes);

                                }; 
                                reader.onerror = function(error) { 
                                    // error occurred 
                                    console.log('Error : ' + error.type); 
                                }; 
                                // reader.readAsBinaryString(file);                                 
                            }
                        },
                        {
                            label : 'Save File',
                            onClick: ()=>{}
                        }
                    ]}
                />]}
            >
                <Box display={'flex'} width={'100%'}>
                    <Box height={'10px'}/>
                    <Box height={'10px'}/>
            <Box>
            {isLoadComplete ?
            <Table stickyHeader {...getTableProps()}  className={classes.table}>
                <TableHead>
                    {renderHeader()}
                </TableHead>
                <TableBody>
                    {renderRows()}
                </TableBody>
            </Table>
            :
                        <div>
            <canvas id={`allOfficer`} width="1280" height="1120" ></canvas>
                            <canvas id={`genericResource`} width="1280" height="1120" ></canvas>
                        </div>
            }     
                    </Box>                      
                </Box>
                {/* <Box>
                    <Box display="flex" alignItems="center">
                        {T('Home')}
                        <input type="file" id="file" /> <button id="read-file">Read File</button> <button id="save-file">Save File</button>
                    </Box>
                </Box> */}

            </Paragraph>
        </Page>
    );
}