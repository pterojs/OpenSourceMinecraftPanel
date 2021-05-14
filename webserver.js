require("dotenv").config();

const express       = require("express");
const app           = express();
const pterodactyl   = require("pterodactyl.js");

const passport      = require("passport");
const { Strategy }  = require("passport-local");
const session       = require("express-session");

const MongoStore    = require("connect-mongo");


// =====================
// Configure Pterodactyl
// =====================
const client = new pterodactyl.Builder(process.env.PTERO_URL, process.env.API_KEY)
    .asAdmin();

// =====================
// Configure Passport
// =====================
passport.use(new Strategy({usernameField: "username", passwordField: "password"},(username, _, done) => {
    process.nextTick(async function() {
        const u = {};
        u.sys = new pterodactyl.Builder(process.env.PTERO_URL, username)
            .asUser();
        u.key = username;

        let userinfo = await u.sys.call("/client/account", "GET");
        u.info = await client.getUser(userinfo.data.attributes.id)
    
        try {
            await u.sys.testConnection();
        } catch (e) {
            return done(JSON.stringify(e));
        }
        return done(null, u);
    });

}));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(id, cb) {
    cb(null, id);
});



// =====================
// Configure Express WS
// =====================

app.use(session({ secret: "cookies", store: MongoStore.create({ mongoUrl: process.env.SESSION_DB_URL, dbName: "OMSP_SESSIONS" }), resave: false, saveUninitialized: false }));
app.set("view engine", "ejs");
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./public"));

// =====================
// Inital Routes
// =====================

app.get("/", async function(req, res) {
    
    if (!req.isAuthenticated()) return res.render("login", { req, url: process.env.PTERO_URL });
    res.redirect("/dashboard");

});

app.post("/login", passport.authenticate("local", { failWithError: true }), function(req, res) {
    res.redirect("/dashboard");
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});


app.get("/dashboard", async function(req, res) {
    if(!req.user) return res.redirect("/");
    const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
        .asUser();

    const servers = await user.getClientServers();
    
    const endList = [];
    for (let server of servers) {
        let srv = (await client.getServers()).find(s => s.identifier === server.identifier);
        const egg = await client.getEgg(srv.nest, srv.egg);
        srv.egg = egg;
        srv.nest = await client.getNest(egg.nest);
        
        endList.push({ ...server, ...srv });
    }

    res.render("index", { servers: endList.filter(s => s.nest.name === "Minecraft"), req });

});

// =====================
// External Routes
// =====================
app.use("/servers", require("./routes/server")(client));


const listener = app.listen(process.env.PORT || 3000, () => {
    console.info(`OSMP is ready and now listening on port ${listener.address().port}.`);
    console.info(`Web URL: http://${require("os").hostname()}:${listener.address().port}/`)
});