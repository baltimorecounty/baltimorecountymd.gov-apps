/* eslint-disable import/prefer-default-export, class-methods-use-this */
import * as Closing from '../models/closing';

const data = [{
	status: 'Open',
	agency: '<a title="Get the latest closing information." href="http://www.baltimorecountymd.gov/Agencies/recreation/programdivision/weather.html">Recreation Centers</a>',
	info: 'All recreation centers are open with normal operating hours.',
}, {
	status: 'Closed',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/publicworks/solid_waste/snow.html">Trash and Recycling Drop-Off Centers</a>',
	info: 'All three County drop-off centers, including the Eastern Sanitary Landfill in White Marsh, are open with normal operating hours.',
}, {
	status: 'Operating',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/publicworks/solid_waste/snow.html">Trash and Recycling Collection</a>',
	info: 'Scheduled trash and recycling collections are running normally.',
}, {
	status: 'Open',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/aging/weather.html">Senior Centers</a>',
	info: 'Senior Centers are&nbsp;open.',
}, {
	status: 'Open',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/aging/weather.html">County Ride</a>',
	info: '<span class="Normal">CountyRide is operating.</span>',
}, {
	status: 'See Website',
	agency: '<a title="Get the latest library closing information." href="http://www.bcpl.info">Public Library</a>',
	info: 'Visit the Baltimore County Public Library website for all branch closing information.',
}, {
	status: 'Open',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/animalservices/">Animal Services</a>',
	info: 'All Baltimore County Animal Services facilities are open and operating normally.&nbsp;',
}, {
	status: 'See Website',
	agency: '<a title="Get the latest school closing information." href="http://www.bcps.org">Public Schools</a>',
	info: 'Visit the Baltimore County Public Schools website for all school closing information.',
}, {
	status: 'Open',
	agency: '<a title="Get the latest closing information." href="https://www.baltimorecountymd.gov/Agencies/circuit/weather.html">Circuit Court</a>',
	info: 'The Circuit Court for Baltimore County is open and operating normally.&nbsp;',
}];

export class dataProvider {
	getClosings() {
		return data.map(closing => new Closing(closing.status, closing.agency, closing.info));
	}
	getGeneralCountyInformation() {
		return new Closing('Open', null, 'Baltimore County general government offices are operating on a normal schedule. Any exceptions for specific agencies or programs will be noted in the chart below.');
	}
}
