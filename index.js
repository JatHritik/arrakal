const express = require("express");
const { data, transaction } = require("./data.js");
const axios = require("axios");
const app = express();
const port = 3000;

// ------------------- ZOHO CONFIG -------------------
const client_id = "1000.PI3NXZ2NN5UYD4CE322QPS9W609HLF";
const client_secret = "c026be16a48706543ddc4d2a89ba9363a6750045eb";
const refresh_token = "1000.97d12fd8612cbfa69604216ef6d779ae.6b7881398e3c60adc1ba65e4691b5977";
const zoho_domain = "https://accounts.zoho.com";
const crm_domain = "https://www.zohoapis.com";
const transactionsModule = "Transactions";
const dealsModule = "Deals";

// ------------------- ACCESS TOKEN -------------------
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
  }
}

// ------------------- UTIL: TODAY -------------------
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ------------------- CREATE DEAL -------------------
async function createDeal(access_token, dealDataFromTemplate) {
  const dealData = {
    data: [
      {
        Deal_Name: dealDataFromTemplate.Deal_Name || "Unnamed Deal",
        Stage: dealDataFromTemplate.Stage || "Qualification",
        Closing_Date: dealDataFromTemplate.Closing_Date || today(),
        Amount: dealDataFromTemplate.Amount || 0,
        Customer_interest: dealDataFromTemplate.Customer_interest,
        Prefix_Code: dealDataFromTemplate.Prefix_Code,
        Description: dealDataFromTemplate.Description || "Auto-created from Transaction",
        Account_Name: dealDataFromTemplate.Account_Id,
        Contact_Name: dealDataFromTemplate.Contact_Id,
        Email: dealDataFromTemplate.Email,
        Pipeline: dealDataFromTemplate.Pipeline,
        Phone: dealDataFromTemplate.Phone,
        Category: dealDataFromTemplate.Category,
        Sub_Category: dealDataFromTemplate.Sub_Category,
        Brand: dealDataFromTemplate.Brand,
        Style: dealDataFromTemplate.Style,
        Size: dealDataFromTemplate.Size,
        Design: dealDataFromTemplate.Design,
        Purity: dealDataFromTemplate.Purity,
        Metal_Colour: dealDataFromTemplate.Metal_Colour,
        Gross_Weight: dealDataFromTemplate.Gross_Weight,
        Net_Weight: dealDataFromTemplate.Net_Weight,
        Stone_Weight: dealDataFromTemplate.Stone_Weight,
        Stone_Rate: dealDataFromTemplate.Stone_Rate,
        Making: dealDataFromTemplate.Making,
        Wastage: dealDataFromTemplate.Wastage,
        Supplier_Name: dealDataFromTemplate.Supplier_Name,
        Supplier_Purchase_Number: dealDataFromTemplate.Supplier_Purchase_Number,
      },
    ],
  };

  try {
    console.log("📦 Creating Deal:", JSON.stringify(dealData, null, 2));
    const res = await axios.post(`${crm_domain}/crm/v6/${dealsModule}`, dealData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const newDealId = res?.data?.data?.[0]?.details?.id;
    console.log(`🆕 Deal Created (${newDealId})`);
    return newDealId;
  } catch (err) {
    console.error("❌ Deal Create Error:", JSON.stringify(err.response.data) || err.message);
    return null;
  }
}

// ------------------- UPDATE TRANSACTION WITH DEAL -------------------
async function updateTransactionWithDeal(access_token, transactionId, dealId) {
  try {
    const body = { data: [{ Deals: { id: dealId } }] };
    await axios.put(`${crm_domain}/crm/v6/${transactionsModule}/${transactionId}`, body, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`🔁 Linked Transaction (${transactionId}) → Deal (${dealId})`);
  } catch (err) {
    console.error("❌ Error updating transaction:", err.response?.data || err.message);
  }
}

// ------------------- CREATE TRANSACTION -------------------
async function createTransaction(access_token, trx) {
  try {
    const safeName = trx.Name?.trim() || "Untitled Transaction";
    const transactionPayload = {
      data: [
        {
          Name: safeName,
          Layout: trx.Layout_id ? { id: trx.Layout_id } : undefined,
          Customer_interest: trx.Customer_interest,
          Prefix_Code: trx.Prefix_Code,
          Stone_Weight: trx.Stone_Weight,
          Making: trx.Making,
          Making_Price_2: trx.Making_Price_2,
          Description: trx.Description || "Transaction created from API",
        },
      ],
    };

    console.log("📦 Creating Transaction:", JSON.stringify(transactionPayload, null, 2));
    const res = await axios.post(`${crm_domain}/crm/v6/${transactionsModule}`, transactionPayload, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const transactionId = res.data.data[0].details.id;
    console.log(`✅ Transaction Created (${transactionId})`);

    // 🆕 Step 2: Immediately create a Deal using the data.deals[0]
    const dealTemplate = data.deals[0];
    const newDealId = await createDeal(access_token, dealTemplate);

    // 🔁 Step 3: Update the Transaction with the newly created Deal ID
    if (newDealId) {
      await updateTransactionWithDeal(access_token, transactionId, newDealId);
      return { transactionId, dealId: newDealId, status: "deal_created_and_linked" };
    } else {
      console.warn("⚠️ Deal creation failed, skipping link update.");
      return { transactionId, dealId: null, status: "deal_creation_failed" };
    }
  } catch (err) {
    console.error("❌ Transaction Error:", err.response?.data || err.message);
    return null;
  }
}

// ------------------- CREATE ALL TRANSACTIONS -------------------
async function createAllTransactions() {
  const token = await getAccessToken();
  if (!token) return { success: false, message: "No access token" };

  const results = [];
  for (const trx of transaction.data) {
    const result = await createTransaction(token, trx);
    results.push(result);
  }

  console.log("🎉 All transactions processed!");
  return results;
}

// ------------------- ROUTES -------------------
app.post("/create-transactions", async (req, res) => {
  try {
    const results = await createAllTransactions();
    res.status(200).json({
      success: true,
      message: "Transactions and Deals created successfully",
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Zoho CRM Transaction + Deal Creation API Running...");
});

// ------------------- START SERVER -------------------
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
