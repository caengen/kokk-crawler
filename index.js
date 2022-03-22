import { chromium } from "playwright";
import fs from "fs";
import fetch from "node-fetch";

//download all recipes
let getNameAndPathSuggestion = (year, month, week, lang = "NE") => {
  let name = undefined;
  let path = undefined;
  switch (year) {
    case 2022:
      name = `NE_samlet${week === 0 ? "" : `-${week}`}.pdf`;
      path = `https://kokkeloren.no/content/uploads/${year}/${
        month > 9 ? month : `0${month}`
      }/${name}`;
      break;
    case 2021:
    case 2020:
      name = `NE-web-samlet${week === 0 ? "" : `-${week}`}.pdf`;
      path = `https://kokkeloren.no/content/uploads/${year}/${
        month > 9 ? month : `0${month}`
      }/${name}`;
      break;
  }
  return { name, path };
};

async function parseAndStorePDF({ name, month, year }, path, page) {
  page.pause();
  fs.mkdir(`./pdfs/${year}/${month}`, { recursive: true }, (err) => {
    if (err) throw err;
  });
  const res = await fetch(path);
  const fileStream = fs.createWriteStream(`pdfs/${year}/${month}/${name}`);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
  // fs.writeFileSync(`pdfs/${year}/${name}`, body);
}

(async function () {
  let browser = await chromium.launch({
    headless: true,
    /* slowMo: 1000, */
  });
  let context = await browser.newContext({
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  });

  let page = await context.newPage();
  page.route = ("**/*.{html,js,jpg,jpeg,png}", (route) => route.abort());

  if (!page) {
    console.log("Connection wasn't established");
  }

  try {
    const weekMax = 4;
    const monthMax = 12;

    const years = [2020, 2021, 2022];
    let failAttempts = 0;
    for (let year of years) {
      failAttempts = 0;
      for (let month = 1; month <= monthMax; month++) {
        // we tried
        if (failAttempts > 1) {
          failAttempts = 0;
          break;
        }
        for (let week = 0; week < weekMax; week++) {
          let { name, path } = getNameAndPathSuggestion(
            year,
            month,
            week,
            "NE"
          );
          let response = undefined;
          try {
            response = await page.goto(path);
          } catch (error) {
            failAttempts++;
            continue;
          }

          let typeHeader = await response.headerValue("content-type");

          if (typeHeader !== "application/pdf") {
            if (week === 0) {
              failAttempts++;
            }
            break;
          }

          await parseAndStorePDF({ name, year, month }, path, page);
        }
      }
    }
  } finally {
    await browser.close();
  }
})();
