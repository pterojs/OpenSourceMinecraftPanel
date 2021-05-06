require("dotenv").config();

const express       = require("express");
const app           = express();
const pterodactyl   = require("pterodactyl.js");

const passport      = require("passport");
const { Strategy }  = require("passport-local");
const session       = require("express-session");
const bp            = require("body-parser");

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
        const u = {}
        u.sys = new pterodactyl.Builder(process.env.PTERO_URL, username)
            .asUser();
        u.key = username;
    
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

    cb(null, id)
});



// =====================
// Configure Express WS
// =====================

app.use(session({ secret: "cookies", saveUninitialized: false, resave: false }));
app.set("view engine", "ejs");
app.use(passport.initialize());
app.use(passport.session());
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());
app.use(express.static("./public"));

// =====================
// Inital Routes
// =====================

app.get("/", async function(req, res, next) {
    if (!req.isAuthenticated()) return res.render("login", { req, url: process.env.PTERO_URL });
    res.redirect("/dashboard")
});

app.post("/login", passport.authenticate('local', { failWithError: true }), function(req, res) {

    res.redirect("/dashboard");
});


app.get("/dashboard", async function(req, res) {
    if(!req.user) return res.redirect("/");
    const user = new pterodactyl.Builder(process.env.PTERO_URL, req.user.key)
        .asUser();

    const servers = await user.getClientServers();
    
    const endList = [];
    for (let server of servers) {
        server = { ...server, ...(await client.getServers()).find(s => s.identifier === server.identifier)};
        // const egg = await client.getEgg(server.nest, server.egg);
        // server.egg = egg;
        // server.nest = await client.getNest(egg.nest);
        endList.push(server);
    }
    
    res.render("index", { servers: endList });

})

// =====================
// External Routes
// =====================
app.use("/servers", require("./routes/server")(client))


app.listen(3000);