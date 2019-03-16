"use strict";

const state = {};
/**
 * state 객체에 프로퍼티들 설정 및 커스텀 클릭 이벤트 리스너 등록
 * 이벤트
 *  - clickview : view에서 발생한 이벤트에 대한 리스너
 */
state.initialize = (row, col) => {
    // map의 크기
    state.row = row;
    state.col = col;

    // cell의 상태를 관리하기위해 복사
    state.cells = [...Array(row)];
    for (let i = 0; i < row; i++) {
        state.cells[i] = [...Array(col)];
        for (let j = 0; j < col; j++) {
            state.cells[i][j] = 0;
        }
    }

    // clickview 이벤트 리스너
    // view에서 발생한 이벤트에 대한 리스너
    document.addEventListener("clickview", (e) => {
        
    });

    // changeCellEvent & changeGenerationEvent
    state.changeCellEvent = document.createEvent("HTMLEvents");
    state.changeGenerationEvent = document.createEvent("HTMLEvents");

    state.generation = 1;
    state.signalGenerationChange(1);

    // 게임 실행 여부 & 게임 실행 Interval 정보
    state.isPlaying = false;
    state.timer = null;
};

/**
 * cell의 상태가 변경되었을때 호출
 * 변경된 cell의 상태에 대해서 view에게 알린다
 */
state.signalCellChange = (row, col, life) => {
    state.changeCellEvent.initEvent("changecell", false, false);
    state.changeCellEvent.detail = {row, col, life};
    document.dispatchEvent(state.changeCellEvent);
};

/**
 * generation의 상태가 변경되었을때 호출
 * 변경된 generation의 상태에 대해서 view에게 알린다
 */
state.signalGenerationChange = (generation) => {
    state.changeGenerationEvent.initEvent("changegeneration", false, false);
    state.changeGenerationEvent.detail = {generation};
    document.dispatchEvent(state.changeGenerationEvent);
};

/**
 * 해당 cell의 주변에 생명이 있는 cell의 수를 구함
 */
state.getSumAround = (row, col) => {
    const x = [0, 1, 1, 1, 0, -1, -1, -1];
    const y = [1, 1, 0, -1, -1, -1, 0, 1];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
        if (state.cells[row + x[i]][col + y[i]]) {
            sum++;
        }
    }
    return sum;
};

/**
 * 모든 cell을 업데이트한다
 */
state.updateAllCell = () => {
    // 상태가 변경되어야 하는 cell들의 배열
    // 업데이트를 위한 getSumAround 값을 확인을 위해서 state.cells의 업데이트는
    // 마지막에 진행하고 view만 변경해준다.
    const changedCell = [];
    for (let i = 0; i < state.row; i++) {
        for (let j = 0; j < state.col; j++) {
            const sum = state.getSumAround(state.cells[i][j]);
            if (sum <= 1 || sum >= 4) {
                if (state.cells[i][j]) {
                    changedCell.push({row:i, col:j});
                    state.signalCellChange(i, j, 0);
                }
            } else if(sum === 3) {
                if (!state.cells[i][j]) {
                    changedCell.push({row:i, col:j});
                    state.signalCellChange(i, j, 1);
                }
            }
        }
    }

    // 수집했던 변경 대상인 cell을 모두 변경한다.
    for (let i = 0; i < changedCell.length; i++) {
        state.cells[changedCell[i].row][changedCell[i].col] ^= 1;
    }

    // generation 값을 업데이트 해준다.
    state.signalGenerationChange(state.generation++);
};

/**
 * cell을 업데이트 한다.
 */
state.updateCell = (row, col, life) => {
    switch (life) {
        case 0:
        case 1:
            if (state.cells[row][col] !== life) {
                state.cells[row][col] = life;
                state.signalCellChange(row, col, life);
            }
            break;
        default:
            state.cells[row][col] ^= 1;
            state.signalCellChange(row, col, state.cells[row][col]);
    }
};

/**
 * cell을 모두 제거한다.
 */
state.clearAllCell = () => {
    for (let i = 0; i < state.row; i++) {
        for (let j = 0; j < state.col; j++) {
            state.updateCell(row, col, 0);
        }
    }

    // 세대도 1로 초기화
    state.signalGenerationChange(1);
};

const view = {};

/**
 * view 객체에 프로퍼티들 설정 및 UI 생성
 * 이벤트
 *  - changecell : state.cell의 변경에 대한 이벤트 리스너
 *  - changegeneration : state.generation의 변경에 대한 이벤트 리스너
 */
view.initialize = (col, row, width, height) => {
};

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

/**
 * 태그 생성
 * @param {*} name 태그 이름
 * @param {*} attributes 태그에 정의할 속성
 */
function makeElement(name, attrs) {
    const node = document.createElement(name);

    if (attrs) {
        for (let attr in attrs) {
            node.setAttribute(attr, attrs[attr]);
        }
    }

    for (let i = 2; i < arguments.length; i++) {
        let child = arguments[i];
        if (typeof child === "string") {
            child = document.createTextNode(child);
        }
        node.appendChild(child);
    }

    return node;
}

/**
 * Life game 기본 환경을 초기화한다.
 * @param {*} parent Life game이 생성될 부모 Element
 * @param {*} cellx Life game map의 x축 좌표 사이즈
 * @param {*} celly Life game map의 y축 좌표 사이즈
 * @param {*} width canvas 너비
 * @param {*} height canvas 높이
 */
const initializeLifeGame = (parent, row, col, width, height) => {
    // Life Game
    const title = makeElement("h1", {class:"title"}, "Life Game");

    // Life Game 조작 툴
    const controllbar = makeElement("div", {class: "controller"});
    for (let name in controller) {
        controller.appendChild(controller[name](state));
    }

    // Life Game map
    const map = "";
    state.initialize(row, col);

    parent.appendChild(makeElement("div", null, title, controllbar, map));
};

window.onload = () => {
    state.patterns = getPatterns();
    // 78열 60행 
    initializeLifeGame(document.body, 60, 78, 780, 600);
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