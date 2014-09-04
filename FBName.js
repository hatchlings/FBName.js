var FBName = (function() {
	var nameCache = {};
	var nameQueue = {};

	var getNameOfUsers = function(fbids, genericName, callback) {
		if(!genericName) genericName = 'Facebook User';
		if(!_.isArray(fbids)) fbids = [fbids];
		if(!callback) callback = function() {};

		var ret = {};

		var outstanding = 0;
		var lookupCB = function(fbid, name) {
			outstanding--;

			ret[fbid] = name || genericName;

			if(outstanding === 0) callback(ret);
		};

		var toLookup = [];
		_.each(fbids, function(fbid) {
			if(typeof nameCache[fbid] != 'undefined') {
				ret[fbid] = nameCache[fbid] || genericName;
			} else if(Facebook && Facebook.name_cache && Facebook.name_cache[fbid]) {
				nameCache[fbid] = Facebook.name_cache[fbid];
				ret[fbid] = Facebook.name_cache[fbid];
			} else if(nameQueue[fbid]) {
				ret[fbid] = genericName;

				nameQueue[fbid].push(lookupCB);
				outstanding++;
			} else {
				ret[fbid] = genericName;

				nameQueue[fbid] = [lookupCB];

				toLookup.push(fbid);
				outstanding++;
			}
		});

		var chunks = _.groupBy(toLookup, function(element, index) {
			return Math.floor(index/50);
		});

		var lookupChunk = function(chunk) {
			FB.api('/?ids=' + chunk.join(',') + '&fields=id,name', function(response) {
				if(response.error) {
					var errorId = NaN;

					try {
						errorId = parseInt(response.error.message.substring(response.error.message.lastIndexOf(' ')+1));
					} catch(e) {}

					if(isNaN(errorId)) {
						console.log('Unrecoverable Error Generating Names', response.error, chunk);
					} else {
						nameCache[errorId] = null;

						_.each(nameQueue[errorId], function(cb) {
							cb(errorId, null);
						});

						delete nameQueue[errorId];

						lookupChunk(_.without(chunk, errorId));
					}
				} else {
					_.each(chunk, function(fbid) {
						var user = response[fbid];

						var name = (user && user.name) || null;

						nameCache[fbid] = name;

						_.each(nameQueue[fbid], function(cb) {
							cb(fbid, name);
						});

						delete nameQueue[fbid];
					});
				}
			});
		};

		_.each(chunks, lookupChunk);

		if(outstanding === 0) callback(ret);

		if(_.size(ret) == 1) {
			return _.values(ret)[0];
		}

		return ret;
	};

	var parseDOM = function(elems, genericName) {
		var tagsById = {};

		if(!elems) elems = 'body';
		elems = $(elems);

		elems.find('f\\:name').each(function() {
			var elem = $(this);

			var fbid = elem.attr('uid');

			if(fbid) {
				if(!tagsById[fbid]) tagsById[fbid] = [];
				tagsById[fbid].push(elem);
			}
		});

		getNameOfUsers(_.keys(tagsById), genericName||'Facebook User', function(names) {
			_.each(names, function(name, fbid) {
				_.each(tagsById[fbid], function(elem) {
					$(elem).html(name);
				});
			});
		});
	};

	return {
		getString: getNameOfUsers,
		parse: parseDOM
	};
})();
