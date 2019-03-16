"use strict";

const state = {};
const view = {};
const controller = {};

/**
 * 외부 파일을 읽어온다.
 * @param {*} filename 읽어올 파일 이름
 * @param {*} filetype 읽어올 파일 확장자
 * @param {*} callback 파일을 모두 읽은 뒤 호출할 callback 함수
 */
const readFile = (filename, filetype, callback) => {
    const req = new XMLHttpRequest();
    req.addEventListener("readystatechange", () => {
        if (req.readyState === 4) {
            if (req.status === 200) {
                callback(req.response, false);
            } else {
                callback(null, true);
            }
        }
    });
    req.open("GET", filename);
    req.responseType = filetype;
    req.send();
};

window.onload = (e) => {
    document.write(JSON.stringify(getPatterns()));
};

// 1. json 파일 가져와서 state에 등록
//      - readFILE 함수 이용
// 2. initializeLifeGame 생성
// 3. state 객체 정의
//      - create
//      - signalCellChange
//      - signalGenerationChange
//      - getSumAround
//      - updateAllCell
//      - updateCell
//      - clearAllCell
// 4. view 객체 정의
//      - create
//      - drawMap
//      - drawCell
//      - updateGeneration
// 5. controller 객체 정의
//      - changeMapColor(맵 색상 변경)
//      - chabgeCellColor(세포 색상 변경)
//      - changePattern(패턴 선택)
//      - createRandomPattern(랜덤 생성)
//      - changeGameSpeed(속도 설정)
//      - playInfinite(연속 재생)
//      - playByStep(다음)
//      - stop(정지)
//      - clearMap(모두 삭제)