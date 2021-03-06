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
    Typography
} from '@material-ui/core';

import {Add} from '@material-ui/icons';

import Page from '../../../core/controls/Page';
import { T } from '../../../core/utility';
import { useTable } from "react-table";
// import { UsersCellPlainText } from './usersCellPlainText';

import fileDownload from 'js-file-download';


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
    const lordNum = tmp===256?0:tmp;
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
    //군자금
    const money = data[pos++] | data[pos++] << 8;
    //군량
    const food = data[pos++] | data[pos++] << 8 | data[pos++] << 16;
    //모름
    pos++;
    //인구
    const pop = data[pos++] | data[pos++] << 8;
    //모름
    pos+=6;
    //토지가치
    const flood = data[pos++];
    //충성도
    const loy = data[pos++];
    //치수도
    const land = data[pos++];
    //명마
    const horse = data[pos++];
    //성채
    const fort = data[pos++];
    //시세
    const rate = data[pos++];
    //
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
        rate,
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

    const [drawAllFace, setDrawAllFace] = useState(false);

    const [,forceRender] = useState({})


    useEffect(()=>{
        if (faceRawData.length>0) {
            console.log(`]]]]] load complete face data : ${faceRawData.length} === (210,240)`);
        }
    }, [faceRawData]);

    useEffect(() => {

        document.querySelector("#read-file").addEventListener('click', function() { 
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
        });

        document.querySelector("#save-file").addEventListener('click', function() { 

        });        

        // setFaceImage('http://localhost:3325/sam2face');
    }, []);

    useEffect(()=>{
        if (!faceLoadComplete) {
            // hexdata.dat 15,108
            // GRPDATA.DAT 46,715
            fetch('http://192.168.10.33:3325/kaodata').then(r => {

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

    const getGenericFaceData = (faceMainId, faceSubId) => {
        // 유요의 경우 main 104(0x68), sub 155(0x9b)를 가지고 있다.
        // 0x68 => 0110 1000, 0x9b => 1001 1011
        // 8 sets with each set containing 
        // 4 upper faces, 
        // 4 lower faces, 
        // 4 pairs of eyes, 
        // 4 noses
        // 4 mouths.
        // 4 colors
    }

    const getFaceData = (faceId) => {

        // Kaodata의 총크기 210,240바이트
        // 총 219개, 1개당 960바이트
        // 8 color (3bit: 000, 001, 010, 011, 100, 101, 110, 111) => (palette : 000000, ff5050, 5050ff, ff50ff, 50f850, fff850, 50f8ff, fff8ff)
        // 3바이트로 8픽셀 표현 
        // 총 24 bit -> 3bit * 8pixe = 24 bit = 3byte
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
            
            // i가 24 mod로 0이면 새로운 줄이다.
            if (i>0 && i%24===0) {
                // new line
                pixelIndex += 256;
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

    const FaceImageFromIndex = (data) => {

        var row = data.row;

        var canvas = document.getElementById(`officer-${row.id}`);
        if (canvas && typeof canvas !== 'undefined') {
            var ctx = canvas.getContext('2d');
            if (faceRawData.length>0) {

                if (row.original.faceSubId>=0x01 && row.original.faceSubId<=0xff) {
                    console.log(`]]]]] main face id : ${row.original.faceMainId}, sub face Id : ${row.original.faceSubId}`);
                    return (
                        <>
                            <>
                                <canvas id={`officer-${row.id}`} width="64" height="80" ></canvas>
                            </>
                            <>
                                sub 1 : {`${row.original.faceMainId}/${row.original.faceSubId}`}
                            </>

                        </>
                    );
                } else {
                    const idx = row.original.faceMainId;
                    const faceData = getFaceData(idx); // 2560 elements
                    var imgData = ctx.createImageData(64, 80); // imgData.data 10240 elements
    
                    for (let i=0; i<faceData.length; i++) {
                        imgData.data[i] = faceData[i];
                    }
                    // ctx.putImageData(imgData, 0, 0);



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
                
            {
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
            }
            {/* <canvas id={`officer-${row.id}`} width="64" height="80" ></canvas> */}
            </>
            
        );
    }

    const loadName = (data) => {
        if (data.row.original.lordNum===0) {
            return <>무소속</>
        } else {
            const lord = drawOfficers.filter(officer=>officer.idx===data.row.original.lordNum);
            return <>{lord[0]&&lord[0].name}</>
        }
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
            <Box>
                <Box display="flex" alignItems="center">
					{T('Home')}
                    <input type="file" id="file" /> <button id="read-file">Read File</button> <button id="save-file">Save File</button>
                </Box>
            </Box>
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
            <canvas id={`allOfficer`} width="1280" height="1120" ></canvas>
            }     
        </Page>
    );
}