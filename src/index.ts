import { Router } from 'express';

class IndexRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.initializeRoutes();
	}

	initializeRoutes() {
		this.router.get('/', (req, res) => {
			res.status(200).send('App is running...');
		});
	}
}

export default new IndexRoute().router;
