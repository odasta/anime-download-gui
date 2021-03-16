
//import https from 'https';
import fs from 'fs';

import { DownloadCallbacks, defaultCallbacks } from './downloadScript';
import { exec } from 'child_process';

//	TS interface
import { Source } from '../../scripts/getURL/URLExtractor';

export interface ProgressData {
	duration: number | null;
	progressTime: number | null;
	progress: number;
}

// export type DownloadedSegment = Buffer | null;

// const downloadSegment = (url: string, segmentIndex: number, downloadedSegments: Map<number, DownloadedSegment>): Promise<void> => {
// 	return new Promise((resolve, reject) => {
// 		https.get(url, (res) => {
// 			const data: Buffer[] = [];

// 			res.on('error', (err: Error) => {
// 				reject(err);
// 			});

// 			res.on('data', (chunk) => {
// 				data.push(chunk);
// 			});

// 			res.on('close', () => {
// 				downloadedSegments.set(segmentIndex, Buffer.concat(data));
// 				resolve();
// 			});
// 		});
// 	});
// }

// const write = (writeStream: fs.WriteStream, data: Buffer, key: number): Promise<void> => {
// 	return new Promise((resolve) => {
// 		if (!writeStream.write(data)) {
// 			writeStream.once('drain', () => {
// 				resolve();
// 			});
// 		}
// 		else {
// 			resolve();
// 		}
// 	});
// }

// const pipeData = (writtenSegments: number, downloadedSegments: Map<number, DownloadedSegment>, writeStream: fs.WriteStream): Promise<number> => {
// 	return new Promise(async (resolve) => {
// 		const start = writtenSegments;
// 		let count = 0;
// 		for (const segment of downloadedSegments) {
// 			const [key, segmentData] = segment;

// 			if (key === writtenSegments + count && segmentData !== null) {
// 				await write(writeStream, segmentData, key);
// 				count++;
// 			}
// 			else {
// 				break;
// 			}
// 		}

// 		for (let i=start ; i<start+count ; i++) {
// 			downloadedSegments.delete(i);
// 		}
// 		resolve(writtenSegments + count);
// 	});
// }

// export default function (outFilePath: string, source: LevelM3u8, cbs?: DownloadCallbacks): Promise<boolean | null> {
// 	return new Promise(async (resolve, reject) => {
// 		if (!source.segments) reject('err, source is not very good like i wanted jflkfjiezohfnzebnfjb');

// 		// merge .. .
// 		const { forceReject, onData } = { ...defaultCallbacks, ...cbs };

// 		// Create the files and the writeFileStream
// 		try {
// 			fs.accessSync(outFilePath, fs.constants.R_OK | fs.constants.W_OK);
// 		} catch (err) {
// 			console.log(`File ${outFilePath} doesn't exist, creating it`);
// 			try {
// 				const dirPath = outFilePath.replace(/\w*\.\w*$/, '');
// 				fs.mkdirSync(dirPath, { recursive: true });
// 				fs.writeFileSync(outFilePath, '');
// 			} catch (error) {
// 				resolve(false)
// 			}
// 		};

// 		const writeFileStream = fs.createWriteStream(outFilePath);
// 		const length = source.segments.length;
// 		console.log(`playlist size:`, length);

// 		const downloadedSegments: Map<number, DownloadedSegment> = new Map();
// 		let segmentsWritten = 0;

// 		for (let segmentIndex=0 ; segmentIndex<source.segments.length ; segmentIndex++) {
// 			const segment = source.segments[segmentIndex];

// 			/*
// 			*		Callbacks
// 			*/
// 			if (forceReject()) {
// 				downloadedSegments.forEach((segment, index) => { downloadedSegments.delete(index) });
// 				writeFileStream.close();
// 				reject(new Error('download canceled'));
// 				return;
// 			}

// 			const progress = Math.round(100 * segmentsWritten / length);
// 			onData(progress);

// 			// Actual weird download thing ...
// 			if (downloadedSegments.size <= 3) {
// 				downloadedSegments.set(segmentIndex, null);
// 				downloadSegment(segment.url, segmentIndex, downloadedSegments).catch((err: Error) => console.log(err.message));
// 			}
// 			else {
// 				await (new Promise((resolve) => setTimeout(() => { resolve() }, 500)) as Promise<void>);
// 				segmentsWritten = await pipeData(segmentsWritten, downloadedSegments, writeFileStream);

// 				segmentIndex--;
// 			}
// 		}

// 		while (downloadedSegments.size > 0) {
// 			await (new Promise((resolve) => setTimeout(() => { resolve() }, 500)) as Promise<void>);
// 			segmentsWritten = await pipeData(segmentsWritten, downloadedSegments, writeFileStream);

// 			// Still update in front end
// 			const progress = Math.round(100 * segmentsWritten / length);
// 			onData(progress);
// 		}

// 		// Here, the download should be done
// 		writeFileStream.close();
// 		resolve(true);
// 	});
// }

const durationRegExp = /Duration: (\d+:)+/;
	const progressTimeRegExp = /time=(\d+:)+/;

//	Returns the duration in milliseconds
const getDuration = (message: string): number | null => {
	if (!durationRegExp.test(message)) return null;

	const matches = message.match(durationRegExp);
	if (!matches) return null;

	const rawDurationString = matches[0] as string;
	const durationString = rawDurationString.replace("Duration: ", "");

	const times = durationString.split(":");

	//	Feels dirty to read, may for sure be improved
	let acc = 0;
	for (let i=times.length-1 ; i>=0 ; i--) acc+=parseInt(times[i]) | 0;

	return acc;
}
const getProgressTime = (message: string): number | null => {

	if (!progressTimeRegExp.test(message)) return null;

	const matches = message.match(progressTimeRegExp);
	if (!matches) return null;

	const rawProgressTimeString = matches[0] as string;
	const progressTimeString = rawProgressTimeString.replace("time=", "");

	const times = progressTimeString.split(":");

	//	Feels dirty to read, may for sure be improved
	let acc = 0;
	for (let i=times.length-1 ; i>=0 ; i--) acc+=parseInt(times[i]) | 0;

	return acc;
}


export default function (outFilePath: string, source: Source, cbs?: DownloadCallbacks): Promise<boolean | null> {
	return new Promise(async (resolve, reject) => {
		console.log("Start download M3U8");
		if(source.type !== "M3U8") {
			reject(new Error(`Trying to download M3U8 playlist but this is ${source.type} source.`));
		}

		try {
			fs.accessSync(outFilePath, fs.constants.R_OK | fs.constants.W_OK);
		} catch (err) {
			console.log(`File ${outFilePath} doesn't exist, creating it`);
			try {
				const dirPath = outFilePath.replace(/\w*\.\w*$/, '');
				fs.mkdirSync(dirPath, { recursive: true });
				fs.writeFileSync(outFilePath, '');
			} catch (error) {
				resolve(false)
			}
		};

		const { onData, forceReject } = { ...defaultCallbacks, ...cbs };  

		const ffmpegHeaders = [
			"'Accept-Encoding: gzip, deflate, br'",
			"'Accept-Language: en-US,en;q=0.5'",
			"'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'"
		];

		//const userAgent = '"Mozilla/5.0 (X11; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0"'

		const ffmpegCommand = `ffmpeg -y -headers ${ffmpegHeaders.join("$'\r\n'")} -i "${source.URL}" -c copy "${outFilePath}"`;
		console.log("FFMPEG Command: ");
		console.log(ffmpegCommand);

		const progressData: ProgressData = {
			duration: null,
			progressTime: null,
			progress: 0
		};

		const ffmpegProcess = exec(ffmpegCommand, (err: any) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log(`${outFilePath}.mp4 downloaded.`);
	  });

		ffmpegProcess.on("spawn", () => {
			console.log("FFMPEG Download Started")
			ffmpegProcess.stderr?.on("data", (chunk: string) => {
				const messageString = chunk;//.toString("utf-8");

				if (!progressData.duration && durationRegExp.test(messageString)) {
					progressData.duration = getDuration(messageString);
				}

				if (progressTimeRegExp.test(messageString)) {
					progressData.progressTime = getProgressTime(messageString);
				}

				if (progressData.duration && progressData.progressTime) {
					progressData.progress = Math.ceil(100 * progressData.progressTime / progressData.duration);
				}

				onData(progressData.progress);

				if (forceReject()) {
					const killSuccess = ffmpegProcess.kill();
					if (!killSuccess) console.log("kill didn't succeed, don't know why and hjflkjqhfjkldsqh");
				}
			});
		});

		ffmpegProcess.on("exit", () => {
			resolve(true);
		});
	});
}