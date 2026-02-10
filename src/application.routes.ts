import { Application } from 'express';
import { deployRoutes } from './components/deploy';
import IndexRoute from './index';

export default class ApplicationConfig {
	public static registerRoute(app: Application) {
		app.use('/', IndexRoute);
		app.use('/deploy', deployRoutes);
	}
}
