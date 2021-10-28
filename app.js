const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const inquirer = require("inquirer");
const figlet = require("figlet");
const chalk = require("chalk");
const request = require("request");

//here we check if the user(config) exists, if it dosent we run firstTimeSetup() to make a config file
if (fs.existsSync("./user.json")) {
  var user = require("./user.json");
  clear();
  startDiscord(user.token);
} else {
  firstTimeSetup()
    .then((user) => {
      clear();
      startDiscord(user.token);
    })
    .catch((err) => {
      console.log(err);
    });
}

async function firstTimeSetup() {
  var prompts = [
    {
      name: "start",
      message: `Seems like this is your first time using discord-mass-emote-downloader!\nI'll run you thru setup \n[Hit enter to continue]`,
    },
    {
      name: "token",
      message:
        "Whats you discord token? (needed fetch emotes and guilds)\nRefer here to find your token: https://i.gangweed.net/QgsmCM\nRight click to paste\n\ntoken: ",
    },
  ];
  await inquirer.prompt(prompts).then((answers) => {
    fs.writeFileSync("./user.json", JSON.stringify(answers), "utf-8");
  });

  var user = require("./user.json");
  return user;
}

//heres where the real fun starts
function startDiscord(token) {
  //once bot is ready we start firing
  client.on("ready", () => {
    //map every guild so we can see name/id to choose
    var guilds = client.guilds.map((a) => {
      return a.name + " id:" + a.id;
    });
    //clears console and shows user, then asks the question
    clear();
    console.log(`Logged in as ${client.user.tag}`);
    inquirer
      .prompt([
        {
          name: "guild_name",
          type: "list",
          message: "What server would you like to steal emotes off? xqcM",
          choices: guilds,
        },
      ])
      .then((answer) => {
        clear();
        //creates folder based off guild chosen
        result = answer.guild_name.split(":");
        tempDir = result[0].replace("/", "");
        dir = tempDir.split(" ");
        console.log(`Creating folder "${dir[0]}" to store emotes in...`);
        makedir(`./emotes`);
        makedir(`./emotes/${dir[0]}`).then(() => {
          //starts downloading all the images
          var emotes = client.guilds.get(result[1]).emojis.map((a) => {
            return a.url;
          });
          succesful = 0;
          failed = 0;
          for (i = 0; emotes.length > i; i++) {
            emoteName = emotes[i].split("/").splice(-1);
            request
              .get(emotes[i])
              .on("error", (err) => {
                console.log(err);
                failed++;
              })
              .pipe(fs.createWriteStream(`./${dir[0]}/${emoteName}`));
            succesful++;
          }
          console.log(
            `${chalk.green(
              `${succesful} emotes succesfully retrieved!`
            )}\n ${chalk.red(
              `${failed} failed.`
            )}\n\nIf you would like to steal more emotes please relaunch`
          );
        });
      });
  });

  //here we actually login...
  client.login(token).catch((err) => {
    if (
      err.toString().includes("Incorrect login details were provided") ||
      err.toString().includes("An invalid token was provided")
    ) {
      console.log("Incorrect login details!\nrelaunch to rerun setup");
      fs.unlinkSync("./user.json");
    } else console.log(err);
  });
}

//clear console and write emote stealer
function clear() {
  process.stdout.write("\033c");
  console.log(
    chalk.red(figlet.textSync("Emote_Stealer", { horizontalLayout: "full" }))
  );
}

//make a new folder for guild to store emotes in
async function makedir(dir) {
  await fs.mkdir(dir, (err) => {
    if (err && err.code != "EEXIST") return console.log(err);
  });
}
