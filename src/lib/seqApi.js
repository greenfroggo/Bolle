import { feedApi } from "./SequentialFeed.jsx";
import { supabase } from "./bolleCore.jsx";

export const seqApi = feedApi(supabase);
