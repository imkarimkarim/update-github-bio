import "dotenv/config";
import axios from "axios";

const GITHUB_API_URL = "https://api.github.com";
const WAKATIME_API_URL = "https://wakatime.com/api/v1";

const ENDPOINTS = {
  GITHUB: `${GITHUB_API_URL}/user`,
  WAKATIME: `${WAKATIME_API_URL}/users/current/summaries`,
} as const;

function getToday() {
  const localDate = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = months[localDate.getMonth()];
  const currentDay = localDate.getDate();

  return currentMonth + " " + currentDay;
}

async function getWakatimeTotalTime(): Promise<string | undefined | null> {
  try {
    const res = await axios({
      method: "GET",
      url: ENDPOINTS.WAKATIME,
      params: {
        api_key: process.env["WAKATIME_API_KEY"],
        scope: "read_logged_time",
        start: new Date(Date.now()),
        end: new Date(Date.now()),
      },
    });

    const data = res.data.data[0];
    const h = data.grand_total.hours,
      m = data.grand_total.minutes;
    if (h > 0) {
      if ((h + m) % 60 === 0) {
        return (h + m) / 60 + "h";
      }
      return (h + m / 60).toFixed(1) + "h";
    } else if (m == 0) {
      return null;
    } else {
      return m + "m";
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown";
    console.error(`Could not get Wakatime stats: ${errorMessage}`);
  }
}

async function updateBio(message: string) {
  try {
    await axios({
      method: "PATCH",
      url: ENDPOINTS.GITHUB,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env["GH_TOKEN"]}`,
      },

      data: {
        bio: message,
      },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown";
    console.error(`Could not update GitHub bio: ${errorMessage}`);
  }
}

async function init() {
  _checkEnv();

  try {
    const total = await getWakatimeTotalTime();
    const today = getToday();
    let message = "";
    if (total !== null || typeof total !== "undefined" || total !== "undefined") {
      message = `coded ${total} today(${today})`;
      const bioMessage = `internet crawler 🔭, ${message}`;
      await updateBio(bioMessage);
    }


  } catch (e) {
    console.error(e);
  }
}

/* updates bio every 15minutes */
init();
setInterval(init, 60 * 1000 * 15);

function _checkEnv() {
  if (!process.env["GH_TOKEN"]) {
    throw new Error("`GH_TOKEN` is a required `.env` item");
  }

  if (!process.env["WAKATIME_API_KEY"]) {
    throw new Error("`WAKATIME_API_KEY` is a required `.env` item");
  }
}
