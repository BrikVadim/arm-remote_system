const {desktopCapturer} = require('electron')
const Peer = require("peerjs")

const sourceOptions = {
    types: ['window', 'screen']
}

const minWidthInput = document.getElementById("video-min-width")
const maxWidthInput = document.getElementById("video-max-width")
const minHeightInput = document.getElementById("video-min-height")
const maxHeightInput = document.getElementById("video-max-height")
const userIdInput = document.getElementById("user-id")
const clientIdInput = document.getElementById("client-id")
const registerButton = document.getElementById("register-button")
const connectButton = document.getElementById("connect-button")

let peer = null
let connection = null

registerButton.addEventListener("click", function () {
    peer = new Peer(userIdInput.value, {
        key: '8q4fi0nhuqt49529'
    })

    peer.on('connection', function (conn) {
        alert("К вам подключились")

        conn.on("data", function(data) {
            switch (data) {
                case "HANDSHAKE":
                    alert("HANDSHAKE")
                    connection = peer.connect(data.data)

                    connection.on("open", () => {
                        connection.on("data", data => {
                            alert(data)
                        })

                        connection.send("Мы друзья!")
                    })

                    break;
                case "GET_SOURCES": 
                    desktopCapturer.getSources(sourceOptions, (error, sources) => {
                        if (error) {
                            throw error
                        }

                        conn.send({
                            message: "GET_SOURCES_ANSWER",
                            data: sources
                        })
                    })
                    break;
            }
        })
    })

    peer.on('call', function (call) {
        desktopCapturer.getSources(sourceOptions, (error, sources) => {
            if (error) {
                throw error
            }

            navigator.mediaDevices
                .getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sources[0].id,
                            minWidth: minWidthInput.value,
                            maxWidth: maxWidthInput.value,
                            minHeight: minHeightInput.value,
                            maxHeight: maxHeightInput.value
                        }
                    }
                })
                .then(handleStream)
                .catch(handleError)
        })

        function handleStream(stream) {
            console.log(stream.constructor.name)
            call.answer(stream)
        }

        function handleError(e) {
            console.log(e)
        }
    })
})

connectButton.addEventListener("click", function () {
    desktopCapturer.getSources(sourceOptions, (error, sources) => {
        if (error) {
            throw error
        }

        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[0].id,
                        minWidth: minWidthInput.value,
                        maxWidth: maxWidthInput.value,
                        minHeight: minHeightInput.value,
                        maxHeight: maxHeightInput.value
                    }
                }
            })
            .then(handleStream)
            .catch(handleError)

        function handleStream(stream) {
            const conn = peer.connect(clientIdInput.value)

            conn.on('open', function () {
                conn.on('data', function (data) {
                    alert(data);
                    switch (data) {
                        case "GET_SOURCES_ANSWER":
                            sources.forEach(source => {
                                const sourceItem = document.createElement("li")

                                sourceItem.innerHTML = `<a href="${source.id}">${source.name}</a>`
                                document.getElementById("sources").append(sourceItem)
                            })
                            break
                    }
                })

                conn.send({
                    message: "HANDSHAKE",
                    data: userIdInput.value
                })

                conn.send({
                    message: "GET_SOURCES"
                })
            })
            
            const call = peer.call(clientIdInput.value, stream)
            
            call.on('stream', function (stream) {
                document.querySelector('video').src = URL.createObjectURL(stream);
            });
        }

        function handleError(e) {
            console.log(e)
        }
    })
})