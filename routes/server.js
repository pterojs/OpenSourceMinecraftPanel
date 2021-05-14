const { getFiles, getFileContent, saveFileContent } = require("../extendedAPI");
const pterodactyl  = require("pterodactyl.js");

module.exports = function(client) {

    const app = require("express").Router();

    app.get("/:server_id", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send("Server not found.");

        const server = (await client.getServers()).find(a => a.identifier === s.identifier);
        const egg = await client.getEgg(server.nest, server.egg);
        const nest = await client.getNest(server.nest);

        server.egg = egg;
        server.nest = nest;
        
        const node = await client.getNode("1");

        const allocations = [];
        for (var i = 0; (await node.getAllocations())[0].pagination.totalPages > i; i++) {
            let allo = await node.getAllocations(i);
            for (let a of allo) {
                allocations.push(a);
            }
        }

        
 

        let mods = [];
        let ModsFolder = await getFiles(server.identifier.split("-")[0], "/plugins", req.user.key);


        if (ModsFolder.data.length >= 1) {
            for (let mod of ModsFolder.data) {
                if (mod.attributes.is_file) mods.push(mod.attributes.name);
            }
        }
    

        const { ip, port } = allocations.find(a => a.id === server.allocation);
        require("request").get(`https://api.mcsrvstat.us/2/${ip}:${port}`, (err, _res, body) => {
            if (_res.headers["content-type"] == "application/json") {
                server.extra = JSON.parse(body);
                if(!server.extra.online) {
                    server.extra = {
                        ip,
                        port,
                        players: { online: 0, max: 0 }
                    };
                }
            }   else {
                server.extra = {
                    ip,
                    port,
                    players: { online: 0, max: 0 }
                };
            }
            return res.render("server", { server: {...s,...server}, mods });
        });
        
        
    });

    app.get("/:server_id/properties", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send("Server not found.");

        const server = (await client.getServers()).find(a => a.identifier === s.identifier);
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

        if (!s) return res.status(404).send("Server not found.");

        s.start();
        return res.redirect("back");
        
        
    });

    

    app.get("/:server_id/files", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send("Server not found.");

        let files = [];
        for ( let file of (await getFiles(s.identifier.split("-")[0], req.query.path || "/", req.user.key)).data) {
            files.push(file.attributes);
        }

        return res.render("editor/files", { server: s, files, curPath: req.query.path || "/" });
    });

    app.get("/:server_id/console", async function(req, res) {
        if(!req.user) return res.redirect("/");

        const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
            .asUser();

        const s = await user.getClientServer(req.params.server_id);

        if (!s) return res.status(404).send("Server not found.");

        const server = (await client.getServers()).find(a => a.identifier === s.identifier);

        const WSReturn = await user.call(`/client/servers/${s.identifier.split("-")[0]}/websocket`, "GET").catch(console.error);

        
        let { token, socket } = WSReturn.data;
        return res.render("console", { req, server, userServer: s, baseUrl: process.env.PTERO_URL, token, socket });
    });

    return app;
};