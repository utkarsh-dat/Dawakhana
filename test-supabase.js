const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exitCode = 1;
} else {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    supabase.auth.admin
        .listUsers({ page: 1, perPage: 1 })
        .then(({ data, error }) => {
            if (error) {
                console.error(`Supabase test failed: ${error.message}`);
                process.exitCode = 1;
                return;
            }

            console.log(`Supabase connection successful. Users found: ${data.users.length > 0 ? "yes" : "no"}`);
        })
        .catch((error) => {
            console.error(`Supabase test failed: ${error.message}`);
            process.exitCode = 1;
        });
}
