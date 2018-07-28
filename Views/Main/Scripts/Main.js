const {desktopCapturer} = require('electron');
const Peer = require("peerjs");
const Guid = require("guid");

// MATCH LIB ==================

const matched = subject => ({
    on: () => matched(subject),
    otherwise: () => subject
})

const match = subject => ({
    on: (predicate, handler) => predicate(subject) ? matched(handler(subject)) : match(subject),
    otherwise: handler => handler(subject)
})

const matchReciver = subjectObtainer => {
    const comparator = {
        value: null,
        set: new_value => value = new_value
    }

    return {
        is: value => option => comparator.set(value) == subjectObtainer(option),
        not: value => option => comparator.set(value) != subjectObtainer(option)
    }
}

// ============================

const minWidthInput  = document.querySelector("#video-min-width");
const maxWidthInput  = document.querySelector("#video-max-width");
const minHeightInput = document.querySelector("#video-min-height");
const maxHeightInput = document.querySelector("#video-max-height");
const userIdInput    = document.querySelector("#user-id");
const clientIdInput  = document.querySelector("#client-id");
const registerButton = document.querySelector("#register-button");
const connectButton  = document.querySelector("#connect-button");

let peer = null;
let connection = null;

const userId = Guid.raw();

const peerConfig = {
    key: '8q4fi0nhuqt49529'
};

registerButton.addEventListener("click", registerPeer);

const getMediaSources = (options = { types: ['screen'] }) => new Promise((resolve, reject) => {
    desktopCapturer.getSources(options, (error, sources) => error ? reject(error) : resolve(sources))
});

const handleMessage = recivedPackage => {
    const message = matchReciver(data => data.message)

    return match(recivedPackage)
        .on(message.is("HANDSHAKE"),   ({data}) => console.log(data))
        .on(message.is("FILESHARE"),   ({data}) => console.log(data))
        .on(message.is("MOUSE_MOVE"),  ({x, y}) => console.log(x, y))
        .on(message.is("MOUSE_CLICK"), ({x, y}) => console.log(x, y))
        .otherwise(() => console.log("NONE"))
};

const messages = {
    service: {
        handshake: "HANDSHAKE"
    },
    request: {
        sources: { message: "GET_SOURCES" }
    },
    control: {
        keyboard: {

        },
        mouse: {

        }
    }
}

async function registerPeer() {
    peer = new Peer(userId, peerConfig);

    const sources = await getMediaSources();

    peer.on("connection", async connection => {
        connection.on("data", handleMessage);
        connection.send(messages.request.sources);
    }).on("call", async call => {

    });
}