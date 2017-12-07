/* eslint-disable import/no-amd, import/no-dynamic-require */
require(
	[
		'myPlaceholder',
		'bootstrap',
		'esri/dijit/Legend',
		'underscore',
		'doTimeout',
		'esri/map',
		'esri/SpatialReference',
		'esri/geometry/Extent',
		'esri/tasks/RelationshipQuery',
		'dojo/promise/all',
		'esri/InfoTemplate',
		'jquery',
		'mustache',
		'esri/dijit/editing/AttachmentEditor',
		'esri/geometry/Point',
		'esri/layers/FeatureLayer',
		'esri/tasks/query',
		'esri/TimeExtent',
		'dojo/number',
		'dojo/date/locale',
		'dojo/dom',
		'dojo/on',
		'dojo/_base/array',
		'dojo/domReady!'],
	(
		myPlaceholder,
		Bootstrap,
		Legend,
		_,
		doTimeout,
		Map,
		SpatialReference,
		Extent,
		RelationshipQuery,
		all,
		InfoTemplate,
		$,
		Mustache,
		AttachmentEditor,
		Point,
		FeatureLayer,
		Query,
		TimeExtent,
		number,
		locale,
		dom,
		on,
		arrayUtils,
	) => {
		const decodeEntities = (function decodeEntities() {
		// this prevents any overhead from creating the object each time
			const element = document.createElement('div');

			const decodeHTMLEntities = (str) => {
				let newStr = str;
				if (newStr && typeof newStr === 'string') {
				// strip script/html tags
					newStr = newStr.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '')
						.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');

					element.innerHTML = newStr;
					newStr = element.textContent;
					element.textContent = '';
				}
				return str;
			};

			return decodeHTMLEntities;
		}());

		const urls = {
			parkLayer: '//bcgis.baltimorecountymd.gov/arcgis/rest/services/Apps/WalkingTrails/MapServer/0',
			trailLayer: '//bcgis.baltimorecountymd.gov/arcgis/rest/services/Apps/WalkingTrails/MapServer/1',
		};

		let trailsTemplate;
		let trailTemplate;
		let map;
		let parkLayer;
		let trailLayer;
		let pageInfo;
		const appData = {
			ids: [],
			parks: [],
			trails: [],
			attachs: [],
		};
		const coalitionMessage = "<a href='/Agencies/health/coalition/lhc.html' title='Learn more about the Baltimore County Health Colation'><img src='/sebin/e/t/coalitionapproved.gif' alt='This walking trail location is Health Coalition approved.' /></a>";

		const parkInfoWindowTemplate = function parkInfoWindowTemplate(desc) {
			return "<div id='info' class='park-info'><p>${desc}</p>" +
                '<a href=\'https://www.google.com/maps/?daddr=${Lat},${Long}\'>' +
                'Get Directions</a><a href=\'#parkid${ID}-${OBJECTID}\' class=\'js-infoWindow-more-info pull-right\' ' +
                'data-object-id=\'${OBJECTID}\' title=\'View More Information on ${NAME}\'>More Information</a>' +
                '<div id=\'attach\'></div>' +
                '</div>';
		};

		trailsTemplate = "<ul class='trails'>{{#.}}{{#attributes}}{{#NAME}}";
		trailsTemplate += "<li id='parkid{{ID}}-{{OBJECTID}}' data-park-id='{{ID}}' data-object-id='{{OBJECTID}}' class='park'>";
		trailsTemplate += "<div class='row'>";
		trailsTemplate += "<div class='col-md-8 col-sm-8'>";
		trailsTemplate += "<h2 class='park-name'>{{NAME}}</h2>";
		trailsTemplate += '</div>';
		trailsTemplate += "<div class='col-md-4 col-sm-4 health-coalition'>";
		trailsTemplate += '{{#isEndorsed}}{{HC_ENDORSEMENT}}{{/isEndorsed}}';
		trailsTemplate += '</div>';
		trailsTemplate += '</div>';
		trailsTemplate += "<div class='row'>";
		trailsTemplate += "<div class='col-md-8 col-sm-8'>";
		trailsTemplate += '<strong>About this Site</strong>';
		trailsTemplate += "<p class='park-desc'>{{#convertLinks}}{{DESC_}}{{/convertLinks}}</p>";
		trailsTemplate += "<div class='park-map'></div>";
		trailsTemplate += '</div>';
		trailsTemplate += "<div class='col-md-4 col-sm-4'>";
		trailsTemplate += "<address class='park-address'>";
		trailsTemplate += '<strong>Contact Information</strong><br />';
		trailsTemplate += '{{CONTACT}}<br>';
		trailsTemplate += "{{#ADDRESS}}<span class='address-label'>Address:</span> <a href='http:\/\/maps.google.com\/maps?daddr={{Lat}},{{Long}}' title='Get Directions to {{NAME}}'>{{ADDRESS}}<\/a>{{\/ADDRESS}}";
		trailsTemplate += "{{^ADDRESS}}<a href='http:\/\/maps.google.com\/maps?daddr={{LATLNG}}' title='Get Directions to {{NAME}}'>{{LATLNG}}<\/a>{{\/ADDRESS}}<br>";
		trailsTemplate += "{{#PHONE}}<span class='address-label'>Phone:</span> {{PHONE}}<br />{{\/PHONE}}";
		trailsTemplate += "{{#CONTACT_EMAIL}}<span class='address-label'>Email:</span> <a href='mailto:{{CONTACT_EMAIL}}' title='Email {{CONTACT}}'>{{CONTACT_EMAIL}}</a>{{\/CONTACT_EMAIL}}";
		trailsTemplate += '<\/address>';
		trailsTemplate += '<\/div>';
		trailsTemplate += '</div>';
		trailsTemplate += "<div class='row'>";
		trailsTemplate += "<div class='park-trails col-md-12'>";
		// trailsTemplate += "<h3 class='trails-header-hidden'>Trails</h3>";
		trailsTemplate += "<ul class='nav nav-tabs park-trails-nav'></ul>";
		trailsTemplate += "<div class='trail-tabs tab-content'></div>";
		trailsTemplate += '</div>';
		trailsTemplate += '</div>';
		trailsTemplate += '</li>';
		trailsTemplate += '{{/NAME}}{{/attributes}}{{/.}}</ul>';


		let trailNavTemplate = '';
		trailNavTemplate += '{{#.}}';
		trailNavTemplate += '{{#attributes}}';
		trailNavTemplate += "<li><a href='#trail{{PARK_ID}}{{OBJECTID}}' data-toggle='tab'>{{TRAIL_NAME}}</a></li>";
		trailNavTemplate += '{{\/attributes}}';
		trailNavTemplate += '{{\/.}}';


		trailTemplate = '';
		trailTemplate += '{{#.}}';
		trailTemplate += '{{#attributes}}';
		trailTemplate += "<div id='trail{{PARK_ID}}{{OBJECTID}}' data-object-id='{{OBJECTID}}' class=\"trail tab-pane\">";
		trailTemplate += '<h4 class="trail-name">{{TRAIL_NAME}}<\/h4>';
		trailTemplate += '<p class="trail-desc">{{TRAIL_DESC}}<\/p>';
		trailTemplate += '<p class="trail-type"><strong>Type:</strong> {{TRAIL_TYPE}}<\/p>';
		trailTemplate += '<div class="trail-map"><\/div>';
		trailTemplate += '<\/div>';
		trailTemplate += '{{\/attributes}}';
		trailTemplate += '{{\/.}}';

		const attachTemplate = function attachTemplate(label) {
			return `{{#.}}<a href='{{url}}' id='attach-{{objectId}}' class='btn btn-default trail-map object-{{objectId}}' title='View the Park Map'>${label}</a>{{/.}}`;
		};

		window.myData = appData;

		// Hide the initial message that describes a list of road closures should exist here
		$('.initial-message').hide();

		// HACK: To fix issue when going back to the app with a filter applied for demo
		// This will be udpated in a upcoming release
		const $filter = $('.js-trails-filter');
		if ($filter.val()) {
			$filter.val('');
			$('body').focus();
		}

		map = new Map('map', {
			basemap: 'hybrid',
			center: [-76.6455, 39.4671],
			zoom: 10,
			displayGraphicsOnPan: false,
			autoResize: false,
		});

		map.on('load', () => {
		// On Zoom Change
			map.on('extent-change', onZoom);

			parkLayer = new FeatureLayer(urls.parkLayer, {
				name: 'parks',
				mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
				outFields: ['*'], // Return all fields from the layer
				orderByFields: ['NAME'],
				infoTemplate: new InfoTemplate(''), // This can be empty because we are going to update it later in the app
			});

			// Get a list of parks and display them in a list
			parkLayer.on('load', GetParksList);

			// Listen for click event on point
			parkLayer.on('click', DisplayParkInfoWindow);

			trailLayer = new FeatureLayer(urls.trailLayer, {
				name: 'trails',
				mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
				outFields: ['*'], // Return all fields from the layer
				orderByFields: ['NAME ASC'],
			});

			// Add Layers to the map
			map.addLayers([parkLayer]);
		});

		// add the legend
		map.on('layers-add-result', (evt) => {
			const layerInfo = arrayUtils.map(evt.layers, (layer, index) => ({
				layer: layer.layer,
				title: layer.layer.name,
			}));
			if (layerInfo.length > 0) {
				const legendDijit = new Legend({
					map,
					layerInfos: layerInfo,
				}, 'legend');
				legendDijit.startup();
			}
		});

		const DisplayParkInformation = function DisplayParkInformation(evt) {
			if (pageInfo.recordsPerPage !== pageInfo.totalRecords) {
				const $this = $(this);
				const objectId = parseInt($this.attr('data-object-id'));
				const pageNumber = getParkObjectPageNumber(objectId);

				// If the park you want to view more information is already on the page,
				// maintain default behavior
				// Otherwise get the appropraite page and data and then navigate to that information section
				queryRecordsByPage(pageNumber);
			}
		};
		const DisplayParkInfoWindow = (evt) => {
			const { graphic } = evt;
			const { geometry } = graphic;
			const latLng = GetLatLong(geometry);

			/* Update the attributes to include Lat and Long for Use with our Template */
			graphic.attributes.Lat = latLng.Lat;
			graphic.attributes.Long = latLng.Long;

			// Update the Infowindow based on
			UpdateInfoWindowContent(evt, parkInfoWindowTemplate);
		};
		const GetLatLong = (geometry) => {
			const point = new Point(geometry.x, geometry.y, geometry.spatialReference);

			return {
				Lat: point.getLatitude(),
				Long: point.getLongitude(),
			};
		};
		const GetTrails = (parks) => {
			if (parks) {
				const query = new Query();
				query.outFields = ['*'];
				query.where = `PARK_ID IN (${parks})`;

				const results = localDataExists('trails', query);

				if (results) {
					ShowTrails(results.features);
				} else {
					trailLayer.queryFeatures(query).then((results) => {
						storeData('trails', {
							query,
							data: results,
						});

						ShowTrails(results.features);
					});
				}
			}
		};
		const GetParksList = (filter) => {
			// Build the query to retreive the data
			const query = new Query();
			query.where = 'name is not null';
			query.orderByFields = ['NAME'];
			if (typeof filter === 'string') {
				query.where = filter;
			}

			const results = localDataExists('ids', query);

			if (results) {
				fetchRecords(results.objectIds);
			} else {
				parkLayer.queryIds(query, (objectIds) => {
					storeIds({
						query,
						objectIds,
					});

					fetchRecords(objectIds);
				});
			}
		};
		const storeAttach = (data) => {
			// Loop through existing data and make sure it doesn't already exist
			for (let i = 0; i < appData.attachs.length; i += 1) {
				// Compare existing attachment data to the one being passed in
				const isEqual = _.isEqual(appData.attachs[i], data);

				// If these two objects match return out of the function
				if (isEqual) return;
			}

			// If the data doesn't exist push it ot hte appData object
			appData.attachs.push(data);
		};
		const storeIds = (data) => {
			// Loop through existing application data
			for (let i = 0; i < appData.ids.length; i += 1) {
				// Check to see if the data already exists
				const isEqual = _.isEqual(data, appData.ids[i]);

				// If these two objects match return out of the function
				if (isEqual) return;
			}

			// If the data doesn't exist push it ot hte appData object
			appData.ids.push(data);
		};
		const storeData = (type, data) => {
			// Loop through existing data and make sure it doesn't already exist
			for (let i = 0; i < appData[type].length; i += 1) {
				const existingData = appData[type][i];
				const isEqual = _.isEqual(existingData.query, data.query);

				if (isEqual) return;
			}

			// If the data doesn't exist push it ot the appData object
			appData[type].push(data);
		};
		const GetAttachment = (layer, objectId) => layer.queryAttachmentInfos(objectId);

		const FilterRecords = (evt) => {
			const $this = $(evt.target);
			const userInput = $this.val();
			const filter = buildQueryParams(userInput);

			GetParksList(filter);
		};
		const GetParks = (recordsPerPage, currentPage) => {
			if (!IsNumeric(recordsPerPage)) {
				pageInfo.recordsPerPage = pageInfo.totalRecords;
				// Get the records, there will only be one page
				queryRecordsByPage(1);
			} else {
				const records = parseInt(recordsPerPage);
				let page = pageInfo.currentPage;
				if (records === 10) {
					page = Math.ceil(page / 2);
				} else {
					page *= 2;
				}
				// Set the records per Page to the total Records to show all records
				pageInfo.recordsPerPage = records;
				queryRecordsByPage(page);
			}
		};
		const ShowAttachment = (attachs, type, label) => {
			if (attachs.length > 0) {
				// $("." + type + " ." + type + "-map").html('')
				// Loop through each trail so that we can determine where it should go
				for (let i = attachs.length - 1; i >= 0; i--) {
					// Create html based off of the trail template
					const content = Mustache.render(attachTemplate(label), attachs[i]);
					// Get the selector of the list item
					const selector = `.${type}[data-object-id=${attachs[i].objectId}]` + ` .${type}-map`;
					const hiddenClass = 'trails-header-hidden';

					// Append the html to the appropriate park in the list
					setTimeout(() => {
						$(selector)
							.html(content)
							.find(`.${hiddenClass}`)
							.removeClass(hiddenClass); // remove class that is hiding the header for trails;
					}, 250);
				}
			}
		};
		const ShowAttachments = (layer, objectIds, type, label) => {
			for (let i = 0; i < objectIds.length; i += 1) {
				const objectId = objectIds[i];
				const localAttach = localAttachExists(layer.name, objectId);

				if (localAttach) {
					ShowAttachment(localAttach, type, label);
				} else {
					GetAttachment(layer, objectIds[i]).then((results) => {
						if (results.length) {
							storeAttach({
								layer: layer.name,
								objectId,
								data: results,
							});

							ShowAttachment(results, type, label);
						}
					});
				}
			}
		};
		const ShowParks = (results, callback) => {
			let parks = results.features;
			// Sort the list in alphabetical order
			parks = addLatLong(parks.sort(compare));

			parks.convertLinks = () => (text, render) => {
				let words = decodeEntities(render(text));

				// http://stackoverflow.com/questions/5796718/html-entity-decode
				// textContent is not supported in IE8, so use jQuery to fix decode the text
				if (!words) {
					words = $('<div />').html(render(text)).text();
				}

				return words.replace(/(http:\/\/[^\s]+)/gi, '<a href="$1" title="View more information">$1</a>');
			};

			parks.isEndorsed = () => (text, render) => {
				if (render(text) !== 'NO') {
					return coalitionMessage;
				}
				return '';
			};

			// Get Park
			const content = Mustache.render(trailsTemplate, parks);

			// Put results on the screen
			$('.parks').html(content);

			// Get a list of Visible Parks Id's so we can get their Trails
			const parkIds = cleanParks(getFeatureProperty(results.features, 'ID').join(','));
			const parkObjectIds = getFeatureProperty(results.features, 'OBJECTID');

			// Get Trails and Then Append them to the Parks
			GetTrails(parkIds);

			if (parkObjectIds) {
				// Get the attachments and then append them to the Parks
				ShowAttachments(parkLayer, parkObjectIds, 'park', 'Site Map');
			}

			if (callback && typeof callback === 'function') {
				callback(content);
			}
		};
		const cleanParks = parksStr => _.without(parksStr.split(','), '');

		const ShowTrails = (trails) => {
			// Sort trails in ascending order by name
			trails.sort(compareTrails);

			// Clear existing trails tabs
			$('.park-trails-nav, .trail-tabs').html('');

			// Loop through each trail so that we can determine where it should go
			for (let i = 0; i < trails.length; i += 1) {
				// Create html based off of the trail template
				const content = Mustache.render(trailTemplate, trails[i]);
				// Get the selector of the list item
				const selector = `[data-park-id='${trails[i].attributes.PARK_ID}']`;
				const hiddenClass = 'trails-header-hidden';

				const navContent = Mustache.render(trailNavTemplate, trails[i]);

				$('.park-trails-nav', selector).append(navContent).find('li:first').addClass('active')
					.find('a')
					.text('Featured Trail');

				// Append the html to the appropriate park in the list
				$('.trail-tabs', selector)
					.append(content).parent()
					.find(`.${hiddenClass}`)
					.removeClass(hiddenClass)
					.end()
					.find('.tab-pane:first')
					.addClass('active'); // remove class that is hiding the header for trails
			}

			const trailObjectIds = getFeatureProperty(trails, 'OBJECTID');

			ShowAttachments(trailLayer, trailObjectIds, 'trail', 'Trail Map');
		};
		const UpdateInfoWindowContent = (evt, template) => {
			// Set the title of teh infowindow to the name of the Park
			parkLayer.infoTemplate.setTitle('${NAME}'); // eslint-disable-line

			const graphicAttributes = evt.graphic.attributes;
			let desc = graphicAttributes.DESC_; // eslint-disable-line no-underscore-dangle

			if (desc.length > 255) {
				desc = `${graphicAttributes.DESC_.substring(0, 255)}...`; // eslint-disable-line no-underscore-dangle
			}

			// Set teh infowindow content
			parkLayer.infoTemplate.setContent(template(desc));

			// Show the info window
			map.infoWindow.show(evt.point, map.getInfoWindowAnchor(evt.point));
		};
		const addLatLong = (features) => {
			const targetFeatures = features;

			for (let i = 0; i < targetFeatures.length; i += 1) {
				const latLng = GetLatLong(targetFeatures[i].geometry);

				targetFeatures[i].attributes.Lat = latLng.Lat;
				targetFeatures[i].attributes.Long = latLng.Long;
			}
			return targetFeatures;
		};

		const buildQueryParams = input => `ZIPCODE LIKE '${input}%' OR UPPER(CITY) LIKE UPPER('${input}%') or UPPER(NAME) LIKE UPPER('%${input}%') AND name is not null`;

		const compare = (a, b) => {
			const x = a.attributes.NAME.toLowerCase();
			const y = b.attributes.NAME.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		};
		const compareTrails = (a, b) => {
			const x = a.attributes.TRAIL_NAME.toLowerCase();
			const y = b.attributes.TRAIL_NAME.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		};
			/* Example provided here https://developers.arcgis.com/javascript/jssamples/fl_paging.html */
		const fetchRecords = (objectIds) => {
			if (objectIds) {
				updatePageInformation(objectIds);
				const page = getHashPageNumber();

				queryRecordsByPage(page, window.location.hash);
			} else {
				$('.parks').html('<h2>No Matching Parks</h2>');
			}
		};
		const getFeatureProperty = (features, field) => {
			const values = [];
			for (let i = 0; i < features.length; i += 1) {
				values.push(features[i].attributes[field]);
			}
			return values;
		};
		const getParkObjectPageNumber = (objectId) => {
			const recordNumber = getParkObjectPosition(objectId);
			// Add one to the recordNumber because the array is zero based
			return Math.ceil((recordNumber + 1) / pageInfo.recordsPerPage);
		};
		const getParkObjectPosition = (objectId) => {
			for (let i = 0; i < pageInfo.objectIds.length; i += 1) {
				if (pageInfo.objectIds[i] === objectId) {
					return i;
				}
			}
		};
		const goToRecord = (anchor, html) => {
			// Setting timeout to let the page content completely
			// Page is loading cotent as you go to it and it makes it look choppy
			const anchorExistsOnPage = $(anchor).html().length;

			if (anchorExistsOnPage) {
				const targetElmId = anchor.replace('#', '');
				const obj = document.getElementById(targetElmId);
				obj.scrollIntoView();
			}
		};
		const hideLoadingMessage = () => {
			$('.js-loading-message').hide();
		};
		const IsNumeric = input => (input - 0) === input && (`${input}`).replace(/^\s+|\s+$/g, '').length > 0;

		const isRecordVisible = pageNumber => pageNumber === pageInfo.currentPage;


		const onZoom = () => {
			const zoomLevel = map.getLevel();
			const trailLayerVisible = map.getLayer(trailLayer.id);

			if (zoomLevel >= 15) {
				if (trailLayerVisible === undefined) {
					return map.addLayer(trailLayer);
				}
			} else if (trailLayerVisible) {
				return map.removeLayer(trailLayer);
			}
		};
		const localAttachExists = (layer, objectId) => {
			for (let i = 0; i < appData.attachs.length; i += 1) {
				const attachmentExists = _.isEqual(objectId, appData.attachs[i].objectId) && _.isEqual(layer, appData.attachs[i].layer); // eslint-disable-line
				if (attachmentExists) {
					return appData.attachs[i].data;
				}
			}
		};
		const localDataExists = (type, query) => {
			for (let i = 0; i < appData[type].length; i += 1) {
				if (_.isEqual(query, appData[type][i].query)) {
					return appData[type][i].data;
				}
			}
		};
		const updatePageControls = (pageNumber) => {
			const $jsPageBtn = $('.js-page-btn');
			const $pageNumber = $(`.page-${pageNumber}`);
			const $lastNext = $('.js-last-btn, .js-next-btn');
			const $firstPrev = $('.js-first-btn, .js-prev-btn');
			const $allBtns = $('.js-first-btn, .js-last-btn, .js-prev-btn, .js-next-btn');
			const numberOfPagingButtons = $('.paging-numbers:first').children().length;

			$jsPageBtn.removeClass('active');
			$pageNumber.addClass('active');

			if (pageNumber === pageInfo.totalPages() && pageInfo.totalPages() !== 1) {
				$lastNext.attr('disabled', 'disabled');
				$firstPrev.removeAttr('disabled');
			} else if (pageNumber === 1) {
				$firstPrev.attr('disabled', 'disabled');
				$lastNext.removeAttr('disabled');
				if (numberOfPagingButtons === 1) {
					$lastNext.attr('disabled', 'disabled');
				}
			} else {
				$allBtns.removeAttr('disabled');
			}
		};

		const dynamicSort = (property) => {
			let sortOrder = 1;
			let targetProperty = property;
			if (targetProperty[0] === '-') {
				sortOrder = -1;
				targetProperty = targetProperty.substr(1);
			}
			return (a, b) => {
				const result = (a[targetProperty] < b[targetProperty]) ? -1 : (a[targetProperty] > b[targetProperty]) ? 1 : 0;
				return result * sortOrder;
			};
		};


		function onParkLayerQuerySuccess(results) {
			storeData('parks', {
				query,
				data: results,
			});

			// Show Parks List
			ShowParks(results, (html) => {
				// Hide the loading message.
				hideLoadingMessage();

				if (anchor) {
					goToRecord(anchor, html);
				}

				if (callback && typeof callback === 'function') {
					callback();
				}
			});
		}

		function onParkLayerQueryError(err) {
			console.log(err);
		}

		const queryRecordsByPage = (pageNumber, anchor, callback) => {
			// check if the page number is valid
			if (pageNumber < 1 || pageNumber > pageInfo.totalPages) {
				return;
			}

			showLoadingMessage();

			const begin = pageInfo.recordsPerPage * (parseInt(pageNumber) - 1);
			const end = begin + pageInfo.recordsPerPage;
			const results = localDataExists('parks', query);
			const totalPages = pageInfo.totalPages();

			// Set the current Page Number
			pageInfo.currentPage = pageNumber;

			createPagingLinks(totalPages, pageNumber);

			updateFilterControls(begin, end, pageNumber);

			if (results) {
				// Show Parks List
				ShowParks(results, callback);

				// Hide the loading message.
				hideLoadingMessage();
			} else {
				// create the query
				const query = new Query();
				query.objectIds = pageInfo.objectIds.slice(begin, end);
				query.where = 'name is not null';
				query.outFields = ['*'];


				// Get the features based on the object ids we pass in.
				parkLayer.queryFeatures(query, onParkLayerQuerySuccess, onParkLayerQueryError);
			}
		};
			// Check to see if there is a hash and direct the user appropriately
		const checkHash = (pageNumber) => {
			const anchor = window.location.hash;
			const $hash = $(anchor);
			const totalPages = pageInfo.totalPages();

			// Make sure anchor exists and anchor is to a park
			if (anchor) {
				if (anchor.indexOf('parkid') > -1) {
					if ($hash.length) {
						goToRecord(anchor);
						pageLoaded = true;
					} else {
						// Search the next page for that ID
						queryRecordsByPage(pageNumber + 1);
					}
					return;
				}
				if (anchor.indexOf('page') > -1) {
					if (pageNumber > 1) {
						queryRecordsByPage(pageNumber);
					}
					pageLoaded = true;
				}
			} else {
				queryRecordsByPage(1);
				pageLoaded = true;
			}
		};
		const createPagingLinks = (totalPages, currentPage) => {
			let html = '';
			let start;
			let end;

			if (currentPage <= 3) {
				start = 0;
				end = totalPages < 5 ? totalPages : 5;
			} else if (currentPage > totalPages - 3) {
				start = totalPages - 5;
				end = totalPages;
			} else {
				start = currentPage - 3;
				end = currentPage + 2;
			}

			for (let i = start; i < end; i += 1) {
				const pageNum = i + 1;
				html += `<button class='btn btn-default js-page-btn page-${pageNum}' id='page-${pageNum}'>${pageNum}</button>`;
			}

			$('.paging-numbers').html(html);

			updatePageControls(currentPage);
		};
		const showLoadingMessage = () => {
			$('.js-loading-message').show();
		};
		const updateFilterControls = (begin, end, pageNumber) => {
			// TODO: Put into some smaller methods
			const totalPages = pageInfo.totalPages();
			let recordMessage = `${begin + 1} - ${end} of ${pageInfo.totalRecords}`;
			// Set the current Page Number
			pageInfo.currentPage = pageNumber;

			if (pageInfo.currentPage === totalPages) {
				recordMessage = `${begin + 1} - ${pageInfo.totalRecords} of ${pageInfo.totalRecords}`;
			}

			$('.page-info').html(` | Page: ${pageInfo.currentPage} of ${totalPages}`);
			$('.records-info').html(recordMessage);
		};
		const updatePageInformation = (objectIds, page) => {
			pageInfo = {
				objectIds,
				totalRecords: objectIds.length,
				totalPages() {
					const pageInformation = this;
					return Math.ceil(objectIds.length / pageInformation.recordsPerPage);
				},
				currentRange() {
					const pageInformation = this;
					const low = pageInformation.currentPage === 1
						? 1 : ((pageInformation.currentPage - 1) * pageInformation.recordsPerPage) + 1;
					const high = pageInformation.recordsPerPage * pageInformation.currentPage > pageInformation.totalRecords
						? pageInformation.totalRecords : pageInformation.recordsPerPage * pageInformation.currentPage;
					return `${low} to ${high}`;
				},
				currentPage: page || 0,
				recordsPerPage: 5,
			};

			if (pageInfo.currentPage > pageInfo.totalPages()) {
				queryRecordsByPage(pageInfo.currentPage - 1);
			}
		};

		/* Events */
		$(document).on('click', '.js-prev-btn', (e) => {
			e.preventDefault();
			queryRecordsByPage(pageInfo.currentPage - 1);

			window.location.hash = pageInfo.currentPage === 1 ? 'page-1' : `page-${pageInfo.currentPage}`;
		});

		$(document).on('click', '.js-next-btn', (e) => {
			e.preventDefault();
			queryRecordsByPage(pageInfo.currentPage + 1);

			window.location.hash = `page-${pageInfo.currentPage}`;
		});

		$(document).on('click', '.js-first-btn', (e) => {
			e.preventDefault();
			// This will always be one!
			queryRecordsByPage(1);

			window.location.hash = 'page-1';
		});

		$(document).on('click', '.js-last-btn', (e) => {
			e.preventDefault();
			queryRecordsByPage(pageInfo.totalPages());

			window.location.hash = `page-${pageInfo.totalPages()}`;
		});

		$(document).on('click', '.js-infoWindow-more-info', DisplayParkInformation);


		$(document).on('click', '.js-legend-toggle', (evt) => {
			evt.preventDefault();
			const $this = $(evt.target);
			const status = $this.text().toLowerCase();
			const $legend = $('.map-legend');
			const $mapContainer = $('.map-container');
			const visibleClass = 'map-legend-visible';

			if (status === 'show legend') {
				$legend.addClass(visibleClass);
				$mapContainer.addClass('col-md-9 col-sm-9');
				$this.text('Hide Legend');
			}
			// Legend is visble, we want to hide it
			else {
				$legend.removeClass(visibleClass);
				$mapContainer.removeClass('col-md-9 col-sm-9');
				$this.text('Show Legend');
			}
		});

		$(document).on('click', '.js-page-btn', (evt) => {
			evt.preventDefault();
			const $this = $(evt.target);
			const pageNumber = parseInt($this.text());

			window.location.hash = $this.attr('id');

			queryRecordsByPage(pageNumber);
		});


		$(document).on('click', '.js-show-records', (evt) => {
			evt.preventDefault();
			const $this = $(evt.target);
			const recordsPerPage = $this.text();

			$('.js-show-records button').removeClass('active');

			$this.addClass('active');

			// Update the record count to reflect the one that was not selected
			$('.js-show-records').html($this.parent().html());

			const $paging = $('.paging').children();

			// Hide the paging links if all records are shown
			if (recordsPerPage.toLowerCase() === 'show all') {
				$paging.hide();
			} else {
				$paging.show();
			}

			GetParks(recordsPerPage, pageInfo.currentPage);
		});

		$(document).on('keyup', '.js-trails-filter', (evt) => {
			window.location.hash = 'filter';
			// Only fire the filter when the user is done typing
			$(this).doTimeout('typing', 250, () => {
				FilterRecords(evt);
			});

			// Focus back on the input, this is required for a firefox bug
			$(this).focus();
		});
		$(document).on('click', '.trail-tabs nav-tabs a', (evt) => {
			evt.preventDefault();
			$(this).tab('show');
		});


		$(document).on('click', '.js-clear-filter', (e) => {
			e.preventDefault();
			const $filter = $(this).parent().find('input');

			// Clear the filter
			// Then trigger the keyup event so the the filter refreshes
			$filter.val('').trigger('keyup');
		});

		const locationHashChanged = () => {
			const { hash } = window.location;
			const page = getHashPageNumber();

			if (!hash) {
				queryRecordsByPage(1, hash);
				return;
			}

			queryRecordsByPage(page, hash);
		};
		const getHashPageNumber = () => {
			const { hash } = window.location;
			let page = 1;
			if (hash.indexOf('page') > -1) {
				page = parseInt(hash.split('-')[1]);
			}
			if (hash.indexOf('parkid') > -1) {
				const parkId = parseInt(hash.split('-')[1]);
				page = getParkObjectPageNumber(parkId);
			}

			return page;
		};

		window.onhashchange = locationHashChanged;
	},
);
