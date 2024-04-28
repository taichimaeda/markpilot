import axios from 'axios';
import * as cheerio from 'cheerio';
import { program } from 'commander';
import * as fs from 'fs';

const MODELS_PATH = 'src/api/models';
const OPENAI_MODELS_PATH = `${MODELS_PATH}/openai.json`;
const OPEN_ROUTER_MODELS_PATH = `${MODELS_PATH}/openrouter.json`;
const OLLAMA_MODELS_PATH = `${MODELS_PATH}/ollama.json`;

async function scrapeOpenRouterModels() {
	const response = await axios.get('https://openrouter.ai/docs');
	const selector = cheerio.load(response.data);
	const rows = selector('#models > div > table > tbody > tr');
	const data: Record<string, object> = {};
	for (const row of rows) {
		const model = selector(row)
			.find('td:nth-child(1) > code')
			.first()
			.text()
			.trim();
		const inputCost = selector(row)
			.find('td:nth-child(2) > div')
			.contents()
			.first()
			.text()
			.trim()
			.replace('$', '');
		const outputCost = selector(row)
			.find('td:nth-child(3) > div')
			.contents()
			.first()
			.text()
			.trim()
			.replace('$', '');
		data[model] = {
			// Normalise to per 1k token to 1M token.
			inputCost: parseFloat(inputCost) * 1_000,
			outputCost: parseFloat(outputCost) * 1_000,
		};
	}
	const json = JSON.stringify(data, null, 2);
	fs.writeFileSync(OPEN_ROUTER_MODELS_PATH, json);
}

async function scrapeOllamaModels() {
	const response = await axios.get('https://ollama.com/library');
	const selector = cheerio.load(response.data);
	const rows = selector('#repo > ul > li');
	const data: Record<string, object> = {};
	for (const row of rows) {
		const model = selector(row).find('a > h2').first().text().trim();
		const inputCost = 0;
		const outputCost = 0;
		data[model] = {
			inputCost,
			outputCost,
		};
	}
	const json = JSON.stringify(data, null, 2);
	fs.writeFileSync(OLLAMA_MODELS_PATH, json);
}

async function main(options: Options) {
	switch (options.provider) {
		case 'openai':
			// OpenAI's pricing information is not available for some models,
			// and even if they are available, they are not in a structured format and come with
			// unpredictable naming patterns e.g. `gpt-4-turbo` pointing to `gpt-4-turbo-2024-04-09`.
			// So for now we resort to manually update the models JSON file.
			console.error(
				`OpenAI provider is not supported for scraping.\nPlease update the JSON file at ${OPENAI_MODELS_PATH} manually by checking https://openai.com/pricing and https://platform.openai.com/docs/models.`,
			);
			break;
		case 'openrouter':
			await scrapeOpenRouterModels();
			break;
		case 'ollama':
			await scrapeOllamaModels();
			break;
		default:
			console.error('Invalid provider');
	}
}

interface Options {
	provider: string;
}
program.option('-p, --provider <PROVIDER>', 'Provider to scrape');
program.parse();
const options = program.opts() as Options;

main(options);
