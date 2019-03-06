"use strict";

/**
 * 알파카 스펙에 대한 객체
 */
const ALPACA = {
    width: 150,
    height: 150,
    show: "./image/ShowAlpaca.png",
    hide: "./image/HideAlpaca.png"
};
Object.freeze(ALPACA);

/**
 * 게임 기능 요소에 대한 객체
 */
const Game = {
    set: {  // 게임 기본 설정 프로퍼티
        TIME_INTERVAL: 1500,
        SHOW_ALPACA: 1000,
        PLAY_TIME: 60
    },
    steps: { // 게임 난이도 프로퍼티
        EASY: {},
        MEDIUM: {},
        HARD: {}
    },
    panel: { // 게임 컨트롤에 관련된 DOM(난이도, 시작, 타이머, 점수)
        start: document.getElementById("gameStart"),
        time: document.getElementById("time"),
        score: document.getElementById("score")
    },
    map: document.getElementById("map") // 게임 Map
};
Object.freeze(Game);

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
    const score = parseInt(Game.panel.score.innerHTML);
    Game.panel.score.innerHTML = score + point;
};

/**
 * 알파카 생성 함수
 * @param {*} level 레벨이 높아질수록 알파카가 많아짐(기본 5개)
 */
const makeAlpaca = (level) => {
    // 알파카의 상태를 기록한다.
    const alpacaMap = new Map();

    // map 내부의 노드를 모두 제거한다.
    clearChildren(Game.map);

    // 가로 5마리, 세로 n(1~3)줄을 생성하고 초기화 한다.
    for (let row = 0; row < level; row++) {
        for (let col = 0; col < 5; col++) {

            // 알파카 생성
            const element = document.createElement("div");
            element.style.width = `${ALPACA.width}px`;
            element.style.height = `${ALPACA.height}px`;
            element.style.background = `url("${ALPACA.hide}") no-repeat`;
            element.style.cursor = `pointer`;

            // 알파카를 div#map에 배치한다.
            Game.map.appendChild(element);

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
const showAlpacaRandomly = (alpacas) => {
    const elements = alpacas.keys();
    const elementsArr = Array.from(elements);
    const who = Math.floor(Math.random() * alpacas.size);
    
    elementsArr[who].style.background = `url(${ALPACA.show}) no-repeat`;
    alpacas.get(elementsArr[who]).isShow = true;

    setTimeout(() => {
        elementsArr[who].style.background = `url(${ALPACA.hide}) no-repeat`;
        alpacas.get(elementsArr[who]).isShow = false;
    }, Game.set.SHOW_ALPACA);
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
    return element;
};

/**
 * 게임 진행 관련 버튼 세팅 및 시간 초와 점수 관련 이벤트 초기화 함수
 */
const initPanel = () => {

    Game.map.appendChild(makeMessageElement("PRESS THE START BUTTON AT THE TOP"));

    // 게임 시작 버튼
    Game.panel.start.addEventListener("click", () => {

        // 게심 시작시 timer를 PLAY_TIME으로 초기화, 스코어를 0으로 초기화한다.
        Game.panel.time.innerHTML = `${Game.set.PLAY_TIME}S`;
        Game.panel.score.innerHTML = 0;

        // 알파카 생성 및 Interval 실행
        const alpacas = makeAlpaca(3);
        const alpacaInterval = setInterval(() => {
            showAlpacaRandomly(alpacas);
        }, Game.set.TIME_INTERVAL);

        // 게임 타이머 설정
        let s = Game.set.PLAY_TIME;
        const gameCountdown = setInterval(() => {

            // 타이머 카운트 다운
            Game.panel.time.innerHTML = `${--s}s`;
            
            // 카운트 다운이 끝나면 알파카 Interval과 게임 타이머 clear
            if (s < 1) {
                clearInterval(alpacaInterval);
                clearInterval(gameCountdown);
                
                // 게임 맵 초기화 후 게임 오버 메세지와 스코어 점수 게시
                clearChildren(Game.map);
                Game.map.appendChild(makeMessageElement(`GAME OVER!\nSCORE: ${Game.panel.score.innerHTML}`));
            }
        }, 1000);
    });
};

window.onload = () => {
    initPanel();
};