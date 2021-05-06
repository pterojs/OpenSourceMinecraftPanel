# Open Source Minecraft Panel
*Better known as "OSMP".*

OSMP can run alongside Pterodactyl, or even far away from Pterodactyl. As long as Pterodactyl's API is visible to the public, you can run OSMP.
Manage servers, edit files with a graphical UI, and automatically agree to the EULA that nobody reads anyways.

### Install / Updating
To install OSMP, clone the git repository then install the dependencies needed with it.
```bash
git clone https://github.com/Solixity/OpenSourceMinecraftPanel
# or git clone git@github.com:Solixity/OpenSourceMinecraftPanel.git if you use SSH.
npm install # or yarn install
```
For first installs, clone `.env.example` to become `.env`, and replace `.env` as necessary.
To update, run `git pull`. 

### Running OSMP
OSMP is somewhat lightweight, but it's advised that you have at least:
* 1024 MB (or 1 GB) of RAM
* 2 Cores

To run OSMP, execute `node .`, `npm test`, or if you use PM2 (recommended) - `pm2 start webserver.js --name OSMP`.

### F.A.Q
*No questions were asked yet...*

### Some Fun Facts.
* OSMP runs on EJS & Materalized Bootstrap v5. `/public/css/global.css` allows for the user to edit CSS and let it be applied everywhere. You can add your own `!important` flags, fonts and other stuff in that file. Uncomment a few lines and you have a somewhat working dark mode.