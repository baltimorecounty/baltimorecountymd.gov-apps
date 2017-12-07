/* eslint-disable import/prefer-default-export */
const getIconType = (status) => {
	const types = {
		canceled: 'fa-times',
		cancelled: 'fa-times',
		closed: 'fa-times',
		external: 'fa-external-link',
		seewebsite: 'fa-external-link',
		modified: 'fa-exclamation-triangle',
		open: 'fa-check',
		operating: 'fa-check',
	};

	return types[status];
};

export const bcStatusIcon = () => ({
	restrict: 'E',
	templateUrl: 'src/status/bc.status-icon.html',
	scope: {
		status: '=',
	},
	link: (scope, element, attr) => {
		scope.status = scope.status.split(' ').join('').toLowerCase();
		scope.iconType = getIconType(scope.status);
	}
});
