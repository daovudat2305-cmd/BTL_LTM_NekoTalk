declare module "@hookform/resolvers/zod" {
  export function zodResolver<TFieldValues extends Record<string, unknown>, TContext = any>(
    schema: unknown,
    options?: unknown,
  ): any;
}
