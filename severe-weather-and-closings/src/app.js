import { bcStatusIcon } from './status/bc.status-icon.directive';
import { closingsController } from './closings/closings-controller';
import { dataService } from './services/data-service';
import { dataProvider } from './providers/data-mock-provider';

const closingsDataService = new dataService(dataProvider);

angular.module('severeWeatherAndClosings', [])
	.directive('bcStatusIcon', bcStatusIcon)
	.factory('severeWeatherAndClosings.dataService', () => closingsDataService)
	.controller('severeWeatherAndClosings.closingsController', ['$sce', 'severeWeatherAndClosings.dataService', closingsController]);
