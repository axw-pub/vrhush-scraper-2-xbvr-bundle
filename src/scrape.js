const puppeteer = require('puppeteer');
const fs = require('fs');

const sceneIdRegex = /\/scenes\/vrh(?<id>\d+)/;
const fileNameRegex = /vrh(?:\d+)[a-zA-Z0-9_-]+?\.mp4/;
const cachePath = './.cache';

const gotoNextPage = async page => {
  const nextPageLink = await page.$('.pagination-wrap ul.pagination li.active + li a');
  if (nextPageLink) {
    console.info(`visiting: ${await (await nextPageLink.getProperty('href')).jsonValue()}`);

    await nextPageLink.click();
    await page.waitForNavigation();

    return true;
  }

  return false;
};

(async () => {
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath);
  }

  const browser = await puppeteer.launch({ headless: true });
  const scenes = await browser.newPage();
  console.info(`visiting: https://vrhush.com/scenes`);
  await scenes.goto('https://vrhush.com/scenes');

  const disclaimer = await scenes.waitForSelector('.disclaimer-footer-container > a.btn-primary', { visible: true });
  if (disclaimer) {
    await disclaimer.click();
    await scenes.waitForNavigation();
  }

  do {
    await scenes.waitForSelector('.pagination-wrap ul.pagination');

    for (const scene of await scenes.$$('.content-item')) {
      const url = await scene.$eval('p.desc > a', element => element.getAttribute('href'));

      const match = url.match(sceneIdRegex);
      if (!match) {
        console.warning(`No valid id for scene at: ${url}`);
        continue;
      }

      const sceneId = url.match(sceneIdRegex).groups.id;
      const filePath = `${cachePath}/${sceneId}.json`;
      if (fs.existsSync(filePath)) {
        continue;
      }

      const scenePage = await browser.newPage();
      console.info(`visiting: ${url}`);
      await scenePage.goto(url);
      await scenePage.waitForSelector('.latest-scene-title');
      await scenePage.click('.read-more');

      const sceneData = {
        sceneId,
        url,
        date: await scenePage.$eval('.latest-scene-meta-1 > .text-left', date => date.textContent),
        title: await scenePage.$eval('.latest-scene-title', title => title.textContent),
        description: await scenePage.$eval('.full-description', description => description.textContent),
        models: await scenePage.$$eval('.latest-scene-subtitle a', models => models.map(model => model.textContent)),
        tags: await scenePage.$$eval('.tag-container > .label-tag', tags => tags.map(tag => tag.textContent)),
        cover: await scenePage.$eval('deo-video', video => {
          const cover = video.getAttribute('cover-image');
          return cover && cover.startsWith('//') ? 'https:' + cover : cover;
        }),
        images: await scenePage.$$eval('.owl-carousel .owl-item img',
          images => images.map(img => img.src && img.src.startsWith('//') ? 'https:' + img.src : img.src)
        ),
        filenames: (await scenePage.$$eval('deo-video > source', sources => sources.map(source => source.src)))
          .map(src => src.match(fileNameRegex))
          .filter(match => match && match.length === 1)
          .map(match => match[0]),
      };

      fs.writeFileSync(filePath, JSON.stringify(sceneData));
      await scenePage.close();
    }

  } while (await gotoNextPage(scenes));

  await browser.close();
})();