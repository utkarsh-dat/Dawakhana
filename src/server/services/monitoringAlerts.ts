const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
const alertPhoneNumber = process.env.MONITOR_ALERT_PHONE;

function getTwilioConfig() {
    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber || !alertPhoneNumber) {
        throw new Error("Twilio monitoring alerts are not configured.");
    }
    return { twilioAccountSid, twilioAuthToken, twilioFromNumber, alertPhoneNumber };
}

async function sendTwilioMessage(to: string, from: string, body: string) {
    const config = getTwilioConfig();
    const credentials = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!response.ok) throw new Error(`Twilio SMS request failed with status ${response.status}.`);
}

async function placeTwilioCall(to: string, from: string, message: string) {
    const config = getTwilioConfig();
    const credentials = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64");
    const twiml = `<Response><Say language="en-IN">${message.replace(/[<&>]/g, "")}</Say></Response>`;
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls.json`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Twiml: twiml }),
    });
    if (!response.ok) throw new Error(`Twilio voice request failed with status ${response.status}.`);
}

export async function sendMonitoringAlert(status: "down" | "recovered", details: string) {
    const config = getTwilioConfig();
    const prefix = status === "down" ? "DawaKhana ALERT: Website may be down." : "DawaKhana RECOVERY: Website is back online.";
    const message = `${prefix} ${details}`.slice(0, 1_500);
    await sendTwilioMessage(config.alertPhoneNumber, config.twilioFromNumber, message);
    if (status === "down") {
        await placeTwilioCall(config.alertPhoneNumber, config.twilioFromNumber, `${prefix} ${details}`.slice(0, 500));
    }
}
