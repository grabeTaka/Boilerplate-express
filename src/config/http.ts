import "dotenv/config";
import axios, { type AxiosInstance } from "axios";

/**
 * Cliente HTTP configurado para chamadas a serviços externos.
 * Instância única, injetada nos services pelo construtor — mesmo padrão
 * do knex no repository (Injeção de Dependência).
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: process.env.EXTERNAL_API_URL ?? "https://jsonplaceholder.typicode.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default httpClient;
