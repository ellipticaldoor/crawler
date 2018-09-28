import { h, app } from 'hyperapp'
import axios from 'axios'
import 'spectre.css'
import './style.sass'
const API_URL = 'http://localhost:3000/flatshares'

const state = {
	flatshares: [],
}

const actions = {
	fetch: () => async (state, actions) => {
		// Sort by newest first
		const { data } = await axios.get(API_URL, { params: { seen: false } })
		actions.addFlatshares(data)
	},
	addFlatshares: flatshares => state => ({ flatshares }),
	markAsSeen: () => async (state, actions) => {
		const response = await axios.patch(
			`${API_URL}/${state.flatshares[0].id}`,
			{ seen: true },
			{ headers: { 'Content-Type': 'application/json' } }
		)
		actions.fetch()
	},
}

// Add pw to pm conversion https://www.richardwestenra.com/weekly-monthly-rental-rate-converter/

const view = ({ flatshares }, actions) => (
	<div id='app' oncreate={() => actions.fetch()}>
		<div id='controls'>
			<button class='btn' onclick={() => actions.markAsSeen()}>mark as seen</button>

			<span>{flatshares.length}</span>

			{!flatshares.length || (
				<span>
					<a href='https://www.spareroom.co.uk/flatshare/?filter=shortlist' target='_blank'>favourites</a>
					<a href={flatshares[0].url} target='_blank' >{flatshares[0].id}</a>
				</span>
			)}
		</div>

		{!flatshares.length || (
			<iframe src={flatshares[0].url}></iframe>
		)}
	</div>
)

app(state, actions, view, document.body)
