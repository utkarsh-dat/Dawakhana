import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qlbckbemphwnggzkvvft.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_QlkcqY-kbhS270OC51R05A_trI8vWwa";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
