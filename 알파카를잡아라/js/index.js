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
 * 게임 설정에 대한 객체
 */
const GameSet = {
    TIME_INTERVAL: 1500,
    SHOW_ALPACA: 1000,
    PLAY_TIME: 60
}
Object.freeze(GameSet);

/**
 * 점수 컨트롤 함수
 */
const controlScore = () => {

}

/**
 * 알파카 생성 함수
 * @param {*} level 레벨이 높아질수록 알파카가 많아짐(기본 5개)
 */
const makeAlpaca = (level) => {
    // 알파카의 상태를 기록한다.
    const alpacaMap = new Map();

    // 가로 5마리, 세로 n(1~3)줄을 생성하고 초기화한다.
    for (let row = 0; row < level; row++) {
        for (let col = 0; col < 5; col++) {

            // 알파카 생성
            const element = document.createElement("div");
            element.style.width = `${ALPACA.width}px`;
            element.style.height = `${ALPACA.height}px`;
            element.style.background = `url("${ALPACA.hide}") no-repeat`;
            element.style.cursor = `pointer`;

            // 알파카를 div#map에 배치한다.
            document.getElementById("map").appendChild(element);

            alpacaMap.set(element, {
                row, col, isShow: false
            });

            // 알파카 클릭 이벤트 생성
            element.onclick = (e) => {
                const element = e.currentTarget;
                const alpaca = alpacaMap.get(element);

                if(alpaca.isShow) {
                    console.log("getcha!")
                    element.style.background = `url("${ALPACA.hide}") no-repeat`;
                    alpaca.isShow = false;
                }
            }
        }
    }

    return alpacaMap;
};

/**
 * 알파카를 랜덤으로 등장시키는 함수
 * @param {*} alpacas 알파카 Map 객체
 */
const alpacaRandomShow = (alpacas) => {
    const elements = alpacas.keys();
    const elementsArr = Array.from(elements);
    const who = Math.floor(Math.random() * alpacas.size);
    
    elementsArr[who].style.background = `url(${ALPACA.show}) no-repeat`;
    alpacas.get(elementsArr[who]).isShow = true;

    setTimeout(() => {
        elementsArr[who].style.background = `url(${ALPACA.hide}) no-repeat`;
        alpacas.get(elementsArr[who]).isShow = false;
    }, GameSet.SHOW_ALPACA);
};

window.onload = () => {
    // 알파카 생성
    const alpacas = makeAlpaca(3);
    const timer = setInterval(() => {
        alpacaRandomShow(alpacas);
    }, GameSet.TIME_INTERVAL) ;
};