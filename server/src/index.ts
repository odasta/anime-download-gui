
require('dotenv').config();
import express from 'express';

/*
*		Import middlewares
*/
import api from './routes/api';
import clientRouter from './routes/client';
import logger from './logger';
import cors from './cors';

/*
*		Import Config
*/
import { PORT } from './config/constants';
import initScript from './scripts/init';

console.log('Server is loading...');

/*
*		Server Declaration	
*/
const app = express();

/*
*		Midlewares declarations
*/

//	Logger
app.use(logger);

// Cors
app.use(cors);

//	Routers
app.use('/api/', api);
app.use('/', clientRouter);


/*
*		Start
*/

console.log('Server loaded, initializing data...');

initScript()
	.then(() => {
		app.listen(PORT, 'localhost',  () => {
			console.log('Server Loaded.');
			console.log(`\nServer listening on port ${PORT}`);
		});
	})
	.catch(() => {
		console.error('An error occurred during data loading, you should verify your internet connection');
	});

