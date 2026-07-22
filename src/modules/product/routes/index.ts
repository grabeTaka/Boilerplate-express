import express, { type Request, type Response } from 'express';
import knex from '../../../config/database.ts';
import  { ProductController } from '../controller/index.ts'
import {ProductRepository} from '../repository/index.ts'

export const productRouter = express.Router({ caseSensitive: true, strict: true });

const repository = new ProductRepository(knex);
const productController = new ProductController(repository);

productRouter.get('/', async (req: Request, res: Response) => {
    try {
        const result = await productController.findAll({
            name: req.query.name as string | undefined,
        })
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});

productRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await productController.findOne(Number(req.params.id))
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});

productRouter.post('/', async (req: Request, res: Response) => {
    try {
        const result = await productController.create(req.body)
        res.status(201).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});

productRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const result = await productController.update(Number(req.params.id), req.body)
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});

productRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await productController.delete(Number(req.params.id))
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' })
    }
});

