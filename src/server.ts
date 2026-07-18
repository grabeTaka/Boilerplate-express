import app from './app.ts'

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
    console.info(`server running on port ${port}!`)
})