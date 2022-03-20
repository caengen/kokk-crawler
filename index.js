const { chromium } = require("playwright");
const fs = require("fs");

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

async function parseAndStorePDF({ name, year }, reponse) {
  let body = await response.body();
  fs.writeFileSync(`./pdfs/${year}/${name}`, body);
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
  // await page.route('**/*', route => {
  //   if (route.request().postData.includes('my-string'))
  //     route.fulfill({ body: 'mocked-data' });
  //   else
  //     route.continue();
  // });

  if (!page) {
    console.log("Connection wasn't established");
  }

  try {
    // const weekMax = 4;
    // const monthMax = 12;
    const weekMax = 1;
    const monthMax = 1;

    const years = [/* 2020, 2021, */ 2022];
    let failAttempts = 0;
    for (let year of years) {
      failAttempts = 0;
      for (let month = 1; month <= monthMax; month++) {
        if (failAttempts > 2) {
          break;
        }
        for (let week = 0; week < weekMax; week++) {
          let { name, path } = getNameAndPathSuggestion(
            year,
            month,
            week,
            "NE"
          );
          let response = await page.goto(path);
          let typeHeader = await response.headerValue("content-type");

          if (typeHeader !== "application/pdf") {
            if (week === 0) {
              failAttempts++;
            }
            // goto next month
            break;
          }

          await parseAndStorePDF({ name, year }, response);
          // download or something
        }
      }
    }
  } finally {
    browser.close();
  }
})();
