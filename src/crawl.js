const puppeteer = require('puppeteer')
const axios = require('axios')
const ZONES_TO_SEARCH = 'E9,E3,E2,N4,N5'
const SPAREROOM_URL = 'https://www.spareroom.co.uk/'
const API_URL = 'http://localhost:3000/flatshares'

const fastLoad = request => {
	request.resourceType() === 'document' ? request.continue() : request.abort()
}

const nextPage = () => {
	const next = document
		.getElementsByClassName('navnext')[0]
		.getElementsByTagName('a')[0]

	if (next) {
		next.click()
	}

	return next ? true : false
}

const scrapFlatShares = () => Array
	.from(document.querySelectorAll('[data-listing-id]'))
	.map(listing => {
		const id = listing.getAttribute('data-listing-id')
		const url = `https://www.spareroom.co.uk/flatshare/flatshare_detail.pl?flatshare_id=${id}`

		return { id , url, date_added: Date.now(), seen: false }
	})

const storeFlatshares = flatshares => flatshares.map(async share => {
	try {
		await axios.get(`${API_URL}/${share.id}`)
	}
	catch (err) {
		await axios.post(
			API_URL,
			share,
			{ headers: { 'Content-Type': 'application/json' } }
		)

		console.log(share.url)
	}
})

const database = []

;(async () => {
	// Open browser
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.setJavaScriptEnabled(false)
	await page.setRequestInterception(true)
	page.on('request', fastLoad)


	// Search flats in area
	await page.goto(SPAREROOM_URL)
	await page.type('#search_by_location_field', ZONES_TO_SEARCH)
	await page.click('#search_by_location_submit_button')
	await page.waitForNavigation()


	// Advanced search
	await page.click('#wholeProperty')
	await page.click('#wholeWeek')
	await page.click('#adsWithPhoto')
	await page.click('#livingRoomPreferred')
	await page.click('#doubleRoom')

	await page.evaluate(() => {
		document.getElementsByClassName('primary-standard aside-form_foot_btn')[0].click()
	})
	await page.waitForNavigation()


	// Scrap flats
	console.log('Flat Search URL:', page.url())
	flatshares = await page.evaluate(scrapFlatShares)
	storeFlatshares(flatshares)

	let navigate = await page.evaluate(nextPage)

	if (navigate) {
		await page.waitForNavigation()
		flatshares = await page.evaluate(scrapFlatShares)
		storeFlatshares(flatshares)

		while (navigate) {
			navigate = await page.evaluate(nextPage)

			if (navigate) {
				await page.waitForNavigation()
				flatshares = await page.evaluate(scrapFlatShares)
				storeFlatshares(flatshares)
			}
		}
	}

	await browser.close()
})()
