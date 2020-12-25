
import axios from 'axios';

import extractURLFromPlayer from './extractURLFromPlayer';
import { Anime } from "../../../../stores/animes";

/**
 * 
 * @param anime Anime interface
 * @param version version of the anime
 * @param episode episode number, starting to 1
 */
export default async function (anime: Anime, version: 'vostfr' | 'vf', episode: number): Promise<string> {
	console.log(anime);

	const formattedEpisode = `${episode<10 ? 0: ''}${episode}`;

	console.log(anime.title?.replace(/:|-|\/|\\/g, '')
		.replace(/\./g, ' ')
		.trim());

	//	Check if anime.url exist and then generate url to the episode from it
	if (!anime.url) throw new Error("Sorry, the anime you're looking for isn't reachable");;
	const episodeURL = 'https://neko-sama.fr' + anime.url
		.replace('info', 'episode')
		.replace(version, `${formattedEpisode}-${version}`);

	console.log(episodeURL);

	const animePage: string = (await axios.get(episodeURL)).data;


	const playersSources = animePage.match(/https?:\/\/((www)|(embed))\.((pstream)|(mystream))\.((net)|(to))\/(\w+\/)?\w+/g);

	if (!playersSources) throw new Error(`The episode you're looking for doesn't look like existing`);

	for (let i=playersSources.length-1 ; i>0 ; i--) {
		const url = await extractURLFromPlayer(playersSources[i]);
		if (typeof url === "string") return url;
	}

	throw new Error("Sadly, we blob download isn't supported yet");
}