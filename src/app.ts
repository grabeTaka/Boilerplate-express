import express, { type Express, type Request, type Response } from 'express';
import { swaggerDocs } from './config/swagger.ts'
import swaggerUi from 'swagger-ui-express';


import "dotenv/config";

import {productRouter} from './modules/product/routes/index.ts'

const app: Express = express();

app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({"message":'Serve is running'});
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/products', productRouter)

export default app;