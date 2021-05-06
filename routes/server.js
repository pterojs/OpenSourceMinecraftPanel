const { getFiles, getFileContent, saveFileContent } = require("../extendedAPI");
const pterodactyl  = require("pterodactyl.js");
module.exports = function(client) {

    const app = require("express").Router();

    app.get("/:server_id", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send(`Server not found.`);

        const server = (await client.getServers()).find(a => a.identifier === s.identifier)
        const egg = await client.getEgg(server.nest, server.egg);
        const nest = await client.getNest(server.nest);

        server.egg = egg;
        server.nest = nest;
        
        const node = await client.getNode("1");

        const allocations = []
        for (var i = 0; (await node.getAllocations())[0].pagination.totalPages > i; i++) {
            let allo = await node.getAllocations(i);
            for (let a of allo) {
                allocations.push(a)
            }
        }

        
        let eula = await getFileContent(server.identifier.split("-")[0], "/eula.txt", req.user.key);
        console.log(eula)
        let isEulaAgreedTo = eula.split("\n")[1].split("=")[1];

        const { ip, port } = allocations.find(a => a.id === server.allocation);
        require("request").get(`https://api.mcsrvstat.us/2/${ip}:${port}`, (err, _res, body) => {
            if (_res.headers["content-type"] == "application/json") {
                server.extra = JSON.parse(body);
                if(!server.extra.online) {
                    server.extra = {
                        ip,
                        port,
                        players: { online: 0, max: 0 }
                    }
                }
            }   else {
                server.extra = {
                    ip,
                    port,
                    players: { online: 0, max: 0 }
                }
            }
            return res.render("server", { server: {...s,...server},isEulaAgreedTo });
        });
        
        
    });

    app.get("/:server_id/properties", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send(`Server not found.`);

        const server = (await client.getServers()).find(a => a.identifier === s.identifier)
        const egg = await client.getEgg(server.nest, server.egg);
        const nest = await client.getNest(server.nest);

        server.egg = egg;
        server.nest = nest;
        
        const properties = await getFileContent(server.identifier.split("-")[0], "/server.properties", req.user.key);
        return res.render("editor/properties", { server: {...s, ...server}, properties });
        
        
    });

    app.get("/:server_id/start", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send(`Server not found.`);

        s.start();
        return res.redirect("back");
        
        
    });

    app.get("/:server_id/agreeEula", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send(`Server not found.`);

        await saveFileContent(s.identifier.split("-")[0], "/eula.txt", req.user.key, "\neula=true")
        return res.redirect("back");
        
        
    });

    return app;
}