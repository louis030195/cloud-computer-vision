const fetch = require('node-fetch')

const body = {
    data: Buffer.from("https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4").toString('base64')
}

const url = 'http://localhost:8080/pubsub/fe?token=ok123456'




async function call() {
    await fetch(url, {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(res => res)
        .then(json => console.log(json))
}
call()