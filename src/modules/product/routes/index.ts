import express, { type Request, type Response } from 'express';
import  { ProductController } from '../controller/index.ts'
import {ProductRepository} from '../repository/index.ts'

export const productRouter = express.Router({ caseSensitive: true, strict: true });

const repository = new ProductRepository();
const productController = new ProductController(repository);

productRouter.get('/', async (req: Request, res: Response) => {
    try {
        const result = await productController.findAll()
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});


