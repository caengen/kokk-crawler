const { chromium } = require("playwright");

(async function () {
  // 2022 legal
  let getPath = (year, month, week, lang = "NE") => {
    switch (year) {
      case 2022:
        return `https://kokkeloren.no/content/uploads/${year}/${
          month > 9 ? month : `0${month}`
        }/NE_samlet${week === 0 ? "" : `-${week}`}.pdf`;
      case 2021:
      case 2020:
        return `https://kokkeloren.no/content/uploads/${year}/${
          month > 9 ? month : `0${month}`
        }/NE-web-samlet${week === 0 ? "" : `-${week}`}.pdf`;
    }
  };

  let browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });
  let context = await browser.newContext({
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  });
  let page = await context.newPage();

  if (!page) {
    console.log("Connection wasn't established");
  }

  const weekMax = 4;
  const monthMax = 12;

  const years = [2020, 2021, 2022];
  let failAttempts = 0;
  for (let year of years) {
    failAttempts = 0;
    for (let month = 1; month <= monthMax; month++) {
      if (failAttempts > 2) {
        break;
      }
      for (let week = 0; week < weekMax; week++) {
        let path = getPath(year, month, week, "NE");
        await page.goto(path);
        let title = await page.title();
        if (title) {
          if (week === 0) {
            failAttempts++;
          }
          // goto next month
          break;
        }
        // download or something
      }
    }
  }
})();
