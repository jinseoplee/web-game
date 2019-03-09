"use strict";

/**
 * 알파카 스펙에 대한 객체
 */
const ALPACA = {
    width: 150,
    height: 150,
    show: "./image/ShowAlpaca.png",
    hide: "./image/HideAlpaca.png",

    whiteAlpaca: "./image/ShowAlpaca.png",
    angryAlpaca: "./image/AngryAlpaca.png",
    fence: "./image/HideAlpaca.png"
};
Object.freeze(ALPACA);

/**
 * 게임 기능 요소에 대한 객체
 */
const GameUI = {
    panel: {                    // 게임 컨트롤에 관련된 DOM(난이도, 시작, 타이머, 점수)
        step: document.querySelector("input[name=step]:checked"),
        start: document.getElementById("gameStart"),
        end: document.getElementById("gameEnd"),
        time: document.getElementById("time"),
        score: document.getElementById("score")
    },
    map: document.getElementById("map"), // 게임 Map
    message: {
        INITIAL_MESSAGE: "PRESS THE START BUTTON AT THE TOP",
        RESULT_MESSAGE: (score) => {
            return `GAME OVER!\nSCORE: ${score}`;
        }
    }
};
Object.freeze(GameUI);


/**
 * 게임 세팅값 설정 함수
 * @param {*} level 
 */
const setGameByLevel = (level) => {

    let TIME_INTERVAL = 1500;       // 알파카가 [TIME_INTERVAL]초에 한마리씩 등장
    let PLAY_TIME = 60;             // 플레이 타임
    let SHOW_ALPACA = 1200;         // 알파카가 나온 상태에서 [SHOW_ALPACA]초뒤에 사라짐
    let LEVEL = level;              // 1: EASY, 2: MEDIUM, 3: HARD
    let ALPACA_COUNT = 1;           // 매 턴 등장할 수 있는 최대 알파카 수
    let ANGRY_ALPACA_COUNT = 0;     // 매 턴 등장할 수 있는 최대 화난 알파카 수
    let GOTCHA_ALPACA = 100;        // 알파카를 잡을시 점수
    let GOTCHA_ANGRY_ALPACA = -300; // 화난 알파카를 잡을시 패널티
    let GOTCHA_FENCE = -100;        // 일반 울타리를 잡을시 패널티

    switch (level) {
        case "1" :    // easy
            TIME_INTERVAL = 1500;
            PLAY_TIME = 60;
            SHOW_ALPACA = 1200;
            ALPACA_COUNT = 1;
            ANGRY_ALPACA_COUNT = 0;
            GOTCHA_ALPACA = 100;
            GOTCHA_ANGRY_ALPACA = 0;
            GOTCHA_FENCE = 0;
            break;
        case "2" :    // medium
            TIME_INTERVAL = 1500;
            PLAY_TIME = 60;
            SHOW_ALPACA = 1000;
            ALPACA_COUNT = 2;
            ANGRY_ALPACA_COUNT = 1;
            GOTCHA_ALPACA = 150;
            GOTCHA_ANGRY_ALPACA = 0;
            GOTCHA_FENCE = 0;
            break;
        default :   // hard
            TIME_INTERVAL = 1500;
            PLAY_TIME = 60;
            SHOW_ALPACA = 800;
            ALPACA_COUNT = 3;
            ANGRY_ALPACA_COUNT = 2;
            GOTCHA_ALPACA = 200;
            GOTCHA_ANGRY_ALPACA = 0;
            GOTCHA_FENCE = 0;
    }

    return {
        TIME_INTERVAL,
        PLAY_TIME,
        SHOW_ALPACA,
        ALPACA_COUNT,
        ANGRY_ALPACA_COUNT,
        LEVEL,
        GOTCHA_ALPACA,
        GOTCHA_ANGRY_ALPACA,
        GOTCHA_FENCE
    };
};

/**
 * node의 내부에 있는 node들을 모두 지우는 함수
 * @param {*} node 내부를 청소할 노드
 */
const clearChildren = (node) => {
    
    if (!node) return;

    while (node.childElementCount > 0) {
        const child = node.childNodes.item(0);
        node.removeChild(child);
    }
};

/**
 * 점수 컨트롤 함수
 */
const controlScore = (point) => {
    const score = parseInt(GameUI.panel.score.innerHTML);
    GameUI.panel.score.innerHTML = score + point;
};

/**
 * 알파카 생성 함수
 * @param {*} level 레벨이 높아질수록 알파카가 많아짐(기본 5개)
 */
const makeAlpaca = (gameSetting) => {

    // 알파카의 상태를 기록한다.
    const alpacaMap = new Map();

    // map 내부의 노드를 모두 제거한다.
    clearChildren(GameUI.map);

    // 가로 5마리, 세로 n(1~3)줄을 생성하고 초기화 한다.
    for (let row = 0; row < gameSetting.LEVEL; row++) {
        for (let col = 0; col < 5; col++) {

            // 알파카 생성
            const element = document.createElement("div");
            element.style.width = `${ALPACA.width}px`;
            element.style.height = `${ALPACA.height}px`;
            element.style.background = `url("${ALPACA.hide}") no-repeat`;
            element.style.cursor = `pointer`;

            // 알파카를 div#map에 배치한다.
            GameUI.map.appendChild(element);

            alpacaMap.set(element, {
                row, col, isShow: false
            });

            // 알파카 클릭 이벤트 생성
            element.addEventListener("click", (e) => {
                const element = e.currentTarget;
                const alpaca = alpacaMap.get(element);

                if(alpaca.isShow) {
                    element.style.background = `url("${ALPACA.hide}") no-repeat`;
                    alpaca.isShow = false;

                    // 점수 추가
                    controlScore(500);
                }
            });
        }
    }

    return alpacaMap;
};

/**
 * 알파카를 랜덤으로 등장시키는 함수
 * @param {*} alpacas 알파카 Map 객체
 */
const showAlpacaRandomly = (alpacas, gameSetting) => {
    const elements = alpacas.keys();
    const elementsArr = Array.from(elements);
    const who = Math.floor(Math.random() * alpacas.size);
    
    elementsArr[who].style.background = `url(${ALPACA.show}) no-repeat`;
    alpacas.get(elementsArr[who]).isShow = true;
    
    setTimeout(() => {
        elementsArr[who].style.background = `url(${ALPACA.hide}) no-repeat`;
        alpacas.get(elementsArr[who]).isShow = false;
    }, gameSetting.SHOW_ALPACA);
};

/**
 * 게임진행에 대한 안내 메세지를 p 태그로 생성하는 함수
 * @param {*} message 게임 진행에 대한 안내 메세지
 */
const makeMessageElement = (message) => {
    const element = document.createElement("p");
    element.innerText = message;
    element.style.fontSize = "40px";
    element.style.fontWeight = 700;
    element.style.padding = "80px 0";
    element.style.textAlign = "center";
    return element;
};

/**
 * 게임 진행 관련 버튼 세팅 및 시간 초와 점수 관련 이벤트 초기화 함수
 */
const initPanel = () => {

    // 게임 시작 초기 메세지
    GameUI.map.appendChild(makeMessageElement(GameUI.message.INITIAL_MESSAGE));

    // 알파카 등장 인터벌 및 게임 진행시간 카운트 변수
    let alpacaInterval = undefined;
    let gameCountdown = undefined;

    // 게임 시작 버튼
    GameUI.panel.start.addEventListener("click", () => {

        // 게임 난이도별 세팅 구하기
        let level = document.querySelector("input[name=step]:checked").value;
        const GameSetting = setGameByLevel(level);
        
        // 게심 시작시 timer를 PLAY_TIME으로 초기화, 스코어를 0으로 초기화한다.
        GameUI.panel.time.innerHTML = `${GameSetting.PLAY_TIME}S`;
        GameUI.panel.score.innerHTML = 0;

        // 알파카 생성 및 Interval 실행
        const alpacas = makeAlpaca(GameSetting);
        alpacaInterval = setInterval(() => {
            showAlpacaRandomly(alpacas, GameSetting);
        }, GameSetting.TIME_INTERVAL);

        // 게임 타이머 설정
        let s = GameSetting.PLAY_TIME;
        gameCountdown = setInterval(() => {

            // 타이머 카운트 다운
            GameUI.panel.time.innerHTML = `${--s}s`;
            
            // 카운트 다운이 끝나면 알파카 Interval과 게임 타이머 clear
            if (s < 1) {
                clearInterval(alpacaInterval);
                clearInterval(gameCountdown);
                
                // 게임 맵 초기화 후 게임 오버 메세지와 스코어 점수 게시
                clearChildren(GameUI.map);
                GameUI.map.appendChild(makeMessageElement(GameUI.message.RESULT_MESSAGE(GameUI.panel.score.innerHTML)));
            }
        }, 1000);
    });

    // 게임 종료 버튼
    GameUI.panel.end.addEventListener("click", () => {

        // 인터벌 모두 제거
        clearInterval(alpacaInterval);
        clearInterval(gameCountdown);

        // 게임 맵 초기화 후 게임 오버 메세지와 스코어 점수 게시
        clearChildren(GameUI.map);
        GameUI.map.appendChild(makeMessageElement(GameUI.message.RESULT_MESSAGE(GameUI.panel.score.innerHTML)));
    });
};

window.onload = () => {
    initPanel();
};