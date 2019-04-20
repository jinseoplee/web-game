"use strict";

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
 * state 객체에 프로퍼티들 설정 및 커스텀 클릭 이벤트 리스너 등록
 * 이벤트
 *  - clickview : view에서 발생한 이벤트에 대한 리스너
 */
const state = {};
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
    state.updateCell(e.detail.row, e.detail.col, e.detail.life);
  });

  // changeCellEvent & changeGenerationEvent
  state.changeCellEvent = document.createEvent("HTMLEvents");
  state.changeGenerationEvent = document.createEvent("HTMLEvents");

  state.generation = 1;
  state.signalGenerationChange(1);

  // 게임 실행 여부 & 게임 실행 Interval 정보
  state.isPlaying = false;
  state.timer = null;
  state.timeInterval = 300;
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
    const rowIdx = row + x[i];
    const colIdx = col + y[i];
    if (state.cells[(rowIdx + state.row) % state.row][(colIdx + state.col) % state.col]) {
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
      const sum = state.getSumAround(i, j);
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
      state.updateCell(i, j, 0);
    }
  }

  // 세대도 1로 초기화
  state.signalGenerationChange(1);
};

/**
 * view 객체에 프로퍼티들 설정 및 UI 생성
 * 이벤트
 *  - changecell : state.cell의 변경에 대한 이벤트 리스너
 *  - changegeneration : state.generation의 변경에 대한 이벤트 리스너
 */
const view = {};
view.initialize = (row, col, width, height) => {

  view.layer = [];
  // map의 cell이 그려질 canvas
  view.layer[0] = makeElement("canvas", {id: "mapCell", width, height});
  
  // map의 배경(격자)이 그려질 canvas
  view.layer[1] = makeElement("canvas", {id: "mapBackground", width, height});

  // 격자 크기, 셀 크기, 셀의 반지름
  view.row = row;
  view.col = col;
  view.cellWidth = view.layer[1].width / col;
  view.cellHeight = view.layer[1].height / row;
  view.cellRadius = (Math.min(view.cellWidth, view.cellHeight) / 2) | 0;

  // canvase의 컨텍스트 가져오기
  if (view.ctx) delete view.ctx;
  view.ctx = [];
  for (let i = 0; i < view.layer.length; i++) {
      view.ctx.push(view.layer[i].getContext("2d"));
  }

  // 렌더링 스타일 설정
  view.bgColor        = "#faed7d";    // map의 배경색
  view.cellColor      = "#000";       // cell의 색
  view.strokeStyle    = "#000";       // 격자 선의 색
  view.lineWidth      = "0.2";        // 격자 선의 너비

  // map을 그린다
  view.drawMap();

  // 세대 요소를 생성한다
  view.generation = makeElement("span", {id:"generation"});
  view.status = makeElement("div", {class:"status"}, "세대 : ", view.generation);

  view.clickEvent = document.createEvent("HTMLEvents");
  view.layer[1].addEventListener("click", (e) => {
    const i = Math.floor(e.offsetX / view.cellWidth);
    const j = Math.floor(e.offsetY / view.cellHeight);
    
    view.clickEvent.initEvent("clickview", false, false);
    view.clickEvent.detail = {row:i, col:j, life:2};
    document.dispatchEvent(view.clickEvent);
  });

  // changecell 이벤트 리스너
  document.addEventListener("changecell", (e) => {
    view.drawCell(e.detail.row, e.detail.col, e.detail.life);
  });

  // changegeneration 이벤트 리스너
  document.addEventListener("changegeneration", (e) => {
    view.setGeneration(e.detail.generation);
  });

  return makeElement("div", {class: "map"}, view.layer[0], view.layer[1], view.status);
};

/**
 * Map UI 생성
 */
view.drawMap = () => {
  let c = view.ctx[1];
  c.strokeStyle = view.strokeStyle;
  c.lineWidth = view.lineWidth;

  // 가로 줄 60
  for (let i = 0; i < view.row; i++) {
    c.beginPath();
    c.moveTo(0, i * view.cellHeight);
    c.lineTo(view.col * view.cellWidth, i * view.cellHeight);
    c.stroke();
  }

  // 세로 줄 78
  for (let j = 0; j < view.col; j++) {
    c.beginPath();
    c.moveTo(j * view.cellWidth, 0);
    c.lineTo(j * view.cellWidth, view.row * view.cellHeight);
    c.stroke();
  }
  
  c = view.ctx[0];
  c.fillStyle = view.bgColor;
  c.fillRect(0, 0, view.layer[0].width, view.layer[0].height);
};

/**
 * Cell UI 생성
 */
view.drawCell = (row, col, life) => {
  const c = view.ctx[0];
  c.beginPath();
  if (life) {
    const x = (row + 0.5) * view.cellWidth;
    const y = (col + 0.5) * view.cellHeight;
    const r = view.cellRadius;
    c.fillStyle = view.cellColor;
    c.arc(x, y, r, 0, Math.PI * 2, true);
    c.fill();
  } else {
    const x = row * view.cellWidth;
    const y = col * view.cellHeight;
    c.fillStyle = view.bgColor;
    c.fillRect(x, y, view.cellWidth, view.cellHeight);
  }
};

/**
 * Generation 세팅
 */
view.setGeneration = (generation) => {
  view.generation.innerHTML = generation;
}


const controller = {};

/**
 * 패턴 선택
 */
controller.selectPattern = (state) => {
    
  const placePattern = (pattern) => {
    const arr = pattern.points;
    const max = [0, 0];
    const min = [state.row - 1, state.col - 1];

    // 패턴을 map의 한 가운데 그리기 위해서 패턴의 영역중 가장 작은 좌표 큰 좌표를 이용한다
    for (let i = 0; i < arr.length; i++) {
      for (let d = 0; d < 2; d++) {
        if (arr[i][d] > max[d]) max[d] = arr[i][d];
        if (arr[i][d] < min[d]) min[d] = arr[i][d];
      }
    }

    // 모든 cell 제거
    state.clearAllCell();
    for (let i = 0; i < arr.length; i++) {
      const ix = arr[i][0] + Math.floor((state.col - min[0] - max[0]) / 2);
      const iy = arr[i][1] + Math.floor((state.row - min[1] - max[1]) / 2);
      state.updateCell(ix, iy, 1);
    }
    state.signalGenerationChange(state.generation = 1);
  };

  const select = makeElement("select");
  select.appendChild(makeElement("option", null, "choice pattern"));
  for (let i = 0; i < state.patterns.length; i++) {
    const patternName = state.patterns[i].name;
    select.appendChild(makeElement("option", {value:patternName}, patternName));
  }
  select.selectedIndex = 0;
  select.addEventListener("change", (e) => {
    if (state.isPlaying) {
      clearInterval(state.timer);
      state.isPlaying = false;
    }
    if (select.selectedIndex !== 0) {
      placePattern(state.patterns[select.selectedIndex - 1]);
    }
  });
  return select;
};

/**
 * 속도 설정
 */
controller.selectLoopInterval = (state) => {
  const select = makeElement("select");
  const options = [
    {name: "20ms", value: 20},
    {name: "100ms", value: 100},
    {name: "300ms", value: 300},
    {name: "600ms", value: 500}
  ];
  for (let i = 0; i < options.length; i++) {
    const option = makeElement("option", {value: options[i].value}, options[i].name);
    select.appendChild(option);
  }
  select.selectedIndex = 2;
  select.addEventListener("change", (e) => {
    state.timeInterval = select.value;
    if (state.isPlaying) {
      clearInterval(state.timer);
      state.timer = setInterval(state.updateAllCell, state.timeInterval);
    }
  });
  return select;
};

/**
 * 모두 삭제
 */
controller.clear = (state) => {
  const button = makeElement("button", {type:"button"}, "clear");
  button.addEventListener("click", (e) => {
    if (state.isPlaying) {
      clearInterval(state.timer);
      state.isPlaying = false;
    }
    state.clearAllCell();
  });
  return button;
};

/**
 * 자동 진행
 */
controller.infiniteLoopPlay = (state) => {
  const button = makeElement("button", {type:"button"}, "infinite loop");
  button.addEventListener("click", (e) => {
    if (!state.isPlaying) {
      state.timer = setInterval(state.updateAllCell, state.timeInterval);
      state.isPlaying = true;
    }
  });
  return button;
};

/**
 * 단계별 진행
 */
controller.stepPlay = (state) => {
  const button = makeElement("button", {type:"button"}, "step");
  button.addEventListener("click", (e) => {
    if (state.isPlaying) {
      clearInterval(state.timer);
      state.isPlaying = false;
    }
    state.updateAllCell();
  });
  return button;
};

/**
 * 정지
 */
controller.stop = (state) => {
  const button = makeElement("button", {type:"button"}, "stop");
  button.addEventListener("click", (e) => {
    clearInterval(state.timer);
    state.isPlaying = false;
  });
  return button;
};

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
    controllbar.appendChild(controller[name](state));
  }

  const header = makeElement("header", null, title, controllbar);

  // Life Game map
  const map = view.initialize(row, col, width, height);
  
  // state 초기화
  state.initialize(row, col);

  parent.appendChild(makeElement("div", {class:"wrap"}, header, map));
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
//      - initialize
//      - signalCellChange
//      - signalGenerationChange
//      - getSumAround
//      - updateAllCell
//      - updateCell
//      - clearAllCell
// 4. view 객체 정의
//      - initialize
//      - drawMap
//      - drawCell
//      - setGeneration
// 5. controller 객체 정의
//      - selectMapColor(맵 색상 변경)
//      - selectCellColor(세포 색상 변경)
//      - selectPattern(패턴 선택)
//      - createRandomPattern(랜덤 생성)
//      - selectLoopInterval(속도 설정)
//      - infiniteLoopPlay(자동 재생)
//      - stepPlay(단계별 진행)
//      - stop(정지)
//      - clearMap(모두 삭제)