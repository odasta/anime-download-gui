
import axios from 'axios';
import { raw } from 'body-parser';

// Store
import { Anime } from '../../../../stores/animes';

/**
 * Example of Episode:
 * {
        "time": "24 min",
        "episode": "Ep. 917",
        "title": "One Piece VOSTFR",
        "url": "\/anime\/episode\/12-one-piece-917-vostfr",
        "url_image": "https:\/\/cdn20.neko-sama.xyz\/one-piece-917-vostfr.jpg"
    },
 */

export interface Episode {
	time: string;
	episode: string;
	title: string;
	url: string;
	url_image: string;
}

export default async function (anime: Anime, episode?: number): Promise<Episode[] | null> {
	if (!anime.url) return null;
	
	const baseURL = process.env['NEKO-SAMA_BASE-URL'];
	const infoPage = (await axios.get(baseURL + anime.url)).data as string;
	const rawEpisodes = infoPage.match(/episodes = \[(\{.*?\},?)*?\]/g)

	if (!rawEpisodes || !rawEpisodes[0]) return null;

	const episodes = JSON.parse(rawEpisodes[0].replace('episodes = ', ''))
	
	if (episode) return episodes[ episode - 1];
	return episodes;
}
