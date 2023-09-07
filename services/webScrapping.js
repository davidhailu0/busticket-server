const puppeteer = require("puppeteer")
const cheerio = require("cheerio")

const StartWebScrapp = async()=>{
    const browser = await puppeteer.launch()

    const page = await browser.newPage()

    await page.goto("https://cbeib.com.et/ARCIB-4/servlet/BrowserServlet")

    await page.type("input[name='UserId']", "input.username");

    await page.type("input[name='Pin']", "input.username");

    const PageData = await page.evaluate(()=>{
        return {
            html:document.documentElement.innerHTML
        }
    })

    const $ = cheerio.load(PageData.html)

    const element = $("input[name='UserId']")

    console.log(element)

    await browser.close()
}

module.exports = StartWebScrapp