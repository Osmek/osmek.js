'use strict';

var request = require('request'),
	fs = require('fs'),
	util = require('util'),
	md5 = require('md5');

class Osmek {
	constructor(api_key, cache_path) {
		this.api_key = api_key;
		this.cache_path = cache_path;
		this.cache = new OsmekCache(cache_path);
		this.api_url = 'http://api.osmek.com/';
	}

	get(bin_id, options) {
		var payload = Object.assign({ 
				api_key: this.api_key,
				bin_id: bin_id
			}, options || {}),
			api_url = this.api_url + 'feed';

		return new Promise((resolve, reject) => {
			console.log('Osmek.get', bin_id);

			var makeCall = () => {
				request
					.post({ 
							url: api_url, 
							form: payload
						}, 
						(error, response, body) => {
							if (!error && response.statusCode == 200) {
								if(this.cache_path) this.cache.write(payload, body);
								resolve(JSON.parse(body));
							}
							else {
								if(this.cache_path) {
									this.cache
										.read(payload)
										.then(content => {
											resolve(JSON.parse(content));
										})
										.catch(err => {
											reject();
										})
								}
								else {
									reject();
								}
							}
						}
					);
			};

			if(this.cache_path) {
				this.cache
					.check(payload)
					.then(content => {
						console.log('Osmek.get', 'returning content from cache');
						resolve(JSON.parse(content));
					})
					.catch(() => {
						console.log('Osmek.get', 'fetching fresh content from ' + api_url);
						makeCall();
					});
			}
			else {
				makeCall();
			}
			
		});
	}

	create(bin_id, data) {
		var payload = Object.assign({ 
				api_key: this.api_key,
				bin_id: bin_id
			}, data || {}),
			api_url = this.api_url + 'create';
		return new Promise((resolve, reject) => {
			request
				.post({ 
						url: api_url, 
						form: payload
					}, 
					(error, response, body) => {
						if ( ! error && response.statusCode == 200) {
							resolve(JSON.parse(body));
						}
						else {
							reject();
						}
					}
				);
		});
	}

	update(bin_id, item_id, data) {
		var payload = Object.assign({ 
				api_key: this.api_key,
				bin_id: bin_id,
				item_id: item_id
			}, data || {}),
			api_url = this.api_url + 'update';
		return new Promise((resolve, reject) => {
			request
				.post({ 
						url: api_url, 
						form: payload
					}, 
					(error, response, body) => {
						if ( ! error && response.statusCode == 200) {
							resolve(JSON.parse(body));
						}
						else {
							reject();
						}
					}
				);
		});
	}

	delete(bin_id, item_id) {
		var payload = { 
				api_key: this.api_key,
				bin_id: bin_id,
				item_id: item_id
			},
			api_url = this.api_url + 'delete';
		return new Promise((resolve, reject) => {
			request
				.post({ 
						url: api_url, 
						form: payload
					}, 
					(error, response, body) => {
						if ( ! error && response.statusCode == 200) {
							resolve(JSON.parse(body));
						}
						else {
							reject();
						}
					}
				);
		});
	}

	uploadPhoto(file_data, file_name, data) {
		var payload = Object.assign({ 
				api_key: this.api_key,
				Filedata: file_data,
				file_name: file_name
			}, data),
			api_url = this.api_url + 'upload_photo';
		return new Promise((resolve, reject) => {
			request
				.post({ 
						url: api_url, 
						formData: payload
					}, 
					(error, response, body) => {
						if ( ! error && response.statusCode == 200) {
							resolve(JSON.parse(body));
						}
						else {
							reject();
						}
					}
				);
		});
	}
}

class OsmekCache {
	constructor(cache_path, cache_time) {
		this.cache_path = cache_path;
		this.cache_time = cache_time || 600000;
	}

	getCacheFilePath(payload) {
		console.log(JSON.stringify(payload));
		return this.cache_path + 'cache' + md5(JSON.stringify(payload)) + '.txt';
	}

	check(payload) {
		var cacheFile = this.getCacheFilePath(payload);
		console.log('OsmekCache', 'checking ' + cacheFile);
		return new Promise((resolve, reject) => {
			fs.stat(cacheFile, (err, stats) => {
				if(err) {
					reject();
				} 
				else {
					var mtime = new Date(util.inspect(stats.mtime)).getTime(),
						now = new Date().getTime();
					if(mtime + this.cache_time > now) {
						console.log('OsmekCache', 'File still fresh: ' + cacheFile);
						this.read(payload)
							.then(content => {
								console.log('OsmekCache', 'Returning: ' + cacheFile);
								resolve(content);
							})
							.catch(err => {
								console.log('OsmekCache', 'Couldn\'t read file, rejecting request: ' + cacheFile);
								reject(err);
							});
					}
					else {
						console.log('OsmekCache', 'File is stale or doesn\'t exist, rejecting request: ' + cacheFile);
						reject();
					}
				}
			});
		});
	}

	read(payload) {
		var cacheFile = this.getCacheFilePath(payload);
		return new Promise((resolve, reject) => {
			fs.readFile(cacheFile, (err, content) => {
				if(err) {
					reject();
				}
				else {
					resolve(content);
				}
			});
		});
	}

	write(payload, response) {
		fs.writeFile(this.getCacheFilePath(payload), response);
	}
}

module.exports = Osmek;
