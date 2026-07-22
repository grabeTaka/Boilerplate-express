import type { AxiosInstance } from "axios";
import type { Todo, TodoInput, TodoServiceInterface } from "./interface.ts";

/**
 * Service que fala com a API externa. Recebe o cliente HTTP pelo construtor
 * (DI), então a regra de negócio não conhece o axios diretamente — fica
 * testável e o transporte é trocável.
 */
export class TodoService implements TodoServiceInterface {
    constructor(private readonly http: AxiosInstance) {}

    async getTodo(id: number): Promise<Todo> {
        const { data } = await this.http.get<Todo>(`/todos/${id}`);
        return data;
    }

    async createTodo(data: TodoInput): Promise<Todo> {
        const { data: created } = await this.http.post<Todo>("/todos", data);
        return created;
    }
}
