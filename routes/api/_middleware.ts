import { unauthorized } from "../../lib/http.ts";
import { supabase } from "../../lib/supabase/supabaseAdmin.ts"
import { Context } from "../../lib/types.ts";

export const handler = async (req: Request, ctx: Context) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
        return unauthorized()

    const token = authHeader.split(" ")[1];

    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user)
        return unauthorized()

    ctx.state.user = user.user;
    return await ctx.next();
}
