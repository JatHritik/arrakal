const axios = require("axios");
const cron = require("node-cron");

// ------------------- ZOHO CONFIG -------------------
const client_id = "1000.PI3NXZ2NN5UYD4CE322QPS9W609HLF";
const client_secret = "c026be16a48706543ddc4d2a89ba9363a6750045eb";
const refresh_token = "1000.97d12fd8612cbfa69604216ef6d779ae.6b7881398e3c60adc1ba65e4691b5977";
const zoho_domain = "https://accounts.zoho.com";
const crm_domain = "https://www.zohoapis.com";
const transactionsModule = "Transactions";
const dealsModule = "Deals";

async function getAccessToken() {
  try {
    const res = await axios.post(`${zoho_domain}/oauth/v2/token`, null, {
      params: {
        refresh_token,
        client_id,
        client_secret,
        grant_type: "refresh_token",
      },
    });
    console.log("✅ Access Token Generated");
    return res.data.access_token;
  } catch (err) {
    console.error("❌ Error generating token:", err.response?.data || err.message);
    return null;
  }
}

async function fetchAllTransactions(access_token) {
  try {
    const results = [];
    let page = 1;
    while (true) {
      const res = await axios.get(`${crm_domain}/crm/v6/${transactionsModule}`, {
        headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
        params: { 
          page, 
          per_page: 200,
          fields: "id,Name,Transaction_Name,Deals,Customer_interest,Prefix_Code,Amount,Account_Name,Contact_Name,Email,Phone,Category,Sub_Category,Brand,Style,Size,Design,Purity,Metal_Colour,Gross_Weight,Net_Weight,Stone_Weight,Stone_Rate,Making,Wastage,Supplier_Name,Supplier_Purchase_Number,Description"
        },
      });
      const data = res?.data?.data || [];
      if (!data.length) break;
      results.push(...data);
      if (data.length < 200) break;
      page += 1;
    }
    return results;
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.response?.data || err.message);
    return [];
  }
}

async function createDeal(access_token, dealPayload) {
  try {
    const payload = { data: [dealPayload] };
    const res = await axios.post(`${crm_domain}/crm/v6/${dealsModule}`, payload, {
      headers: { Authorization: `Zoho-oauthtoken ${access_token}`, "Content-Type": "application/json" },
    });
    const newDealId = res?.data?.data?.[0]?.details?.id;
    console.log(`🆕 Deal Created (${newDealId})`);
    return newDealId;
  } catch (err) {
    console.error("❌ Deal Create Error:", err.response?.data || err.message);
    return null;
  }
}

async function updateTransactionWithDeal(access_token, transactionId, dealId) {
  try {
    const body = { data: [{ Deals: { id: dealId } }] };
    await axios.put(`${crm_domain}/crm/v6/${transactionsModule}/${transactionId}`, body, {
      headers: { Authorization: `Zoho-oauthtoken ${access_token}`, "Content-Type": "application/json" },
    });
    console.log(`🔁 Linked Transaction (${transactionId}) → Deal (${dealId})`);
  } catch (err) {
    console.error("❌ Error updating transaction:", err.response?.data || err.message);
  }
}

function mapTransactionToDeal(trx) {
  return {
    Deal_Name: trx.Name || trx.Transaction_Name || `Deal for ${trx.id || "unknown"}`,
    Stage: "Qualification",
    Closing_Date: new Date().toISOString().split("T")[0],
    Amount: trx.Amount || 0,
    Customer_interest: trx.Customer_interest,
    Prefix_Code: trx.Prefix_Code,
    Description: trx.Description || `Auto-created from Transaction ${trx.id}`,
    Account_Name: trx.Account_Name || undefined,
    Contact_Name: trx.Contact_Name || undefined,
    Email: trx.Email || undefined,
    Phone: trx.Phone || undefined,
    Category: trx.Category,
    Sub_Category: trx.Sub_Category,
    Brand: trx.Brand,
    Style: trx.Style,
    Size: trx.Size,
    Design: trx.Design,
    Purity: trx.Purity,
    Metal_Colour: trx.Metal_Colour,
    Gross_Weight: trx.Gross_Weight,
    Net_Weight: trx.Net_Weight,
    Stone_Weight: trx.Stone_Weight,
    Stone_Rate: trx.Stone_Rate,
    Making: trx.Making,
    Wastage: trx.Wastage,
    Supplier_Name: trx.Supplier_Name,
    Supplier_Purchase_Number: trx.Supplier_Purchase_Number,
  };
}

async function syncUnlinkedTransactions() {
  const token = await getAccessToken();
  if (!token) return;

  const allTrx = await fetchAllTransactions(token);
  const unlinked = allTrx.filter((t) => !t.Deals || (t.Deals && !t.Deals.id));
  console.log(`🔎 Found ${unlinked.length} unlinked transactions`);

  for (const trx of unlinked) {
    try {
      const dealPayload = mapTransactionToDeal(trx);
      const newDealId = await createDeal(token, dealPayload);
      if (newDealId) {
        await updateTransactionWithDeal(token, trx.id || trx.ID || trx.record_id, newDealId);
      }
    } catch (err) {
      console.error("❌ Error processing transaction:", trx.id, err.message || err);
    }
  }
}

// Schedule: twice daily at 09:00 and 15:00 (9 AM and 3 PM)
cron.schedule("0 9,15 * * *", () => {
  console.log(new Date().toISOString(), "— Running sync job (09:00 & 15:00 daily)...");
  syncUnlinkedTransactions();
});

// Run once immediately on start
syncUnlinkedTransactions();

console.log("🕒 Deals sync cron started (runs twice daily at 09:00 and 15:00). Use npm run cron to start this script.");
