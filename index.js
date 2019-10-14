const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
function setResponse(username, repos) {
	return `<h2>${username} has ${repos} Github repos </h2>`;
}

// Make request to github for data.
async function getRepos(req, res, next) {
	try {
		console.log('Fetching Data...');

		const { username } = req.params;

		// fetch
		const response = await fetch(`https://api.github.com/users/${username}`);

		// parse data json to object
		const data = await response.json();

		const repos = data.public_repos;

		// API Set data pada Redis
		// key, expire(ms), data/value 
		client.setex(username, 3600, repos);

		res.send(setResponse(username, repos));
	} catch(err) { 
		console.log(err);
		res.status(500);
	}
}

// Cache middleware
function cache(req, res, next) {
	const { username } = req.params;

	// API GET pada redis
	// get key
	client.get(username, (err, data) => {
		if(err) throw err;
		if(data !== null ) {
			res.send(setResponse(username, data));
		} else {
			next();
		}
	});
}

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => console.log(`server running on port ${PORT}`));