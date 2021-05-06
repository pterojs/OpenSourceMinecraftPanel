module.exports = {
    getFiles(server, directory, key) {
        return new Promise((res, rej) => {
            require("request").get(`${process.env.PTERO_URL}/api/client/servers/${server}/files/list?directory=${encodeURIComponent(directory || "/")}`, {
                auth: {
                    bearer: key
                }
            }, (err, _res, body) => {
                if (err) return rej(err);

                return res(JSON.parse(body));
            });
        })
    },
    getFileContent(server, directory, key) {
        return new Promise((res, rej) => {
            require("request").get(`${process.env.PTERO_URL}/api/client/servers/${server}/files/contents?file=${encodeURIComponent(directory)}`, {
                auth: {
                    bearer: key
                }
            }, (err, _res, body) => {
                if (err) return rej(err);

                return res(body);
            });
        })
    },
    saveFileContent(server, directory, key, body) {
        return new Promise((res, rej) => {
            require("request").post(`${process.env.PTERO_URL}/api/client/servers/${server}/files/write?file=${encodeURIComponent(directory)}`, {
                auth: {
                    bearer: key
                },
                body,
                headers: {
                    'Content-Type': 'text/plain'
                }
            }, (err, _res, body) => {
                if (err) return rej(err);

                return res(body);
            });
        })
    }
}