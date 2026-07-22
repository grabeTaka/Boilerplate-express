/**
 * Formato do recurso retornado pela API externa (JSONPlaceholder).
 * GET https://jsonplaceholder.typicode.com/todos/:id
 */
export interface Todo {
    id: number;
    userId: number;
    title: string;
    completed: boolean;
}

/** Dados enviados ao criar um todo (a API externa gera o `id`). */
export type TodoInput = Omit<Todo, "id">;

export interface TodoServiceInterface {
    getTodo(id: number): Promise<Todo>;
    createTodo(data: TodoInput): Promise<Todo>;
}
