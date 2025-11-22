export const unauthorized = () => new Response("Unauthorized", { status: 401 });

export const forbidden = () => new Response("Forbidden", { status: 403 });

export const badRequest = (msg: string = "Bad Request") =>
    new Response(msg, { status: 400 });

export const internalError = (msg: string = "Internal Server Error") =>
    new Response(msg, { status: 500 });

export const ok = (body?: string | object) =>
    new Response(
        body ? typeof body === "string" ? body : JSON.stringify(body) : "",
        { status: 200, headers: { "Content-Type": "application/json" } },
    );
